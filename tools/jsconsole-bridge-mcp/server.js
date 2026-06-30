#!/usr/bin/env node
//
// Synplant JSConsole bridge — MCP server
// ======================================
//
// Drives the file bridge built into "JS Console.spscript" so an MCP client (e.g.
// Claude Code) can evaluate JavaScript against a *live* Synplant engine and read
// the result back, with no GUI automation.
//
// Protocol (must match "JS Console.spscript/JSConsole_main.js"):
//
//   <base>/request.json    we write (temp file + rename):  { seq, code }
//   <base>/response.json   the bridge overwrites:          { seq, ok, value, output, error }
//   <base>/bridge.json     the bridge writes on `bridge on`: { ready, protocol, time }
//
// This host owns the directory: it `mkdir -p`s <base> on startup, writes requests
// atomically, and pairs replies by a strictly increasing `seq`. We base `seq` on
// epoch ms so it keeps climbing across restarts of this server. (Synplant's own
// script API can also create the folder via makeDir, but the host creating it
// keeps the protocol robust whichever side starts first.)
//
// Transport is MCP stdio: newline-delimited JSON-RPC 2.0 on stdin/stdout.
// stdout MUST carry only protocol messages — all diagnostics go to stderr.
//

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SERVER_NAME = 'synplant-jsconsole-bridge';
const SERVER_VERSION = '1.0.0';
const DEFAULT_PROTOCOL = '2024-11-05';
const DEFAULT_TIMEOUT_MS = 20000; // a single eval may run up to ~20s in Synplant
const POLL_INTERVAL_MS = 50;

function log() {
	console.error('[' + SERVER_NAME + ']', ...arguments);
}

function withSlash(p) {
	return p.charAt(p.length - 1) === '/' ? p : p + '/';
}

function bridgeBase() {
	if (process.env.BRIDGE_BASE) {
		return withSlash(process.env.BRIDGE_BASE.replace(/\\/g, '/'));
	}
	// Default to a subfolder of DIRS.DOCUMENTS — the Sonic Charge user-documents
	// folder, which Synplant grants scripts deep read-write access to (so the
	// bridge avoids file-permission prompts). DIRS.DOCUMENTS is "<home>/Documents/
	// Sonic Charge/" on both macOS and Windows. The JS Console and this server must
	// resolve to the same folder; override with BRIDGE_BASE if your install differs.
	const dir = path.join(os.homedir(), 'Documents', 'Sonic Charge', 'jsconsole-bridge');
	return withSlash(dir.replace(/\\/g, '/'));
}

const BASE = bridgeBase();
const REQUEST_PATH = path.join(BASE, 'request.json');
const RESPONSE_PATH = path.join(BASE, 'response.json');
const PRESENCE_PATH = path.join(BASE, 'bridge.json');

let lastSeq = 0;

function ensureBase() {
	fs.mkdirSync(BASE, { recursive: true });
	// Continue numbering above any request left from a previous run.
	try {
		const prev = JSON.parse(fs.readFileSync(REQUEST_PATH, 'utf8'));
		if (prev && typeof prev.seq === 'number') {
			lastSeq = prev.seq;
		}
	} catch (e) { /* no prior request, fine */ }
}

function nextSeq() {
	let s = Math.floor(Date.now());
	if (s <= lastSeq) {
		s = lastSeq + 1;
	}
	lastSeq = s;
	return s;
}

function sleep(ms) {
	return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function readJson(p) {
	try {
		return JSON.parse(fs.readFileSync(p, 'utf8'));
	} catch (e) {
		return null;
	}
}

//
// Tool: sp_eval — write a request atomically, poll for the matching reply.
//
async function spEval(args) {
	const code = args && typeof args.code === 'string' ? args.code : null;
	if (code === null) {
		throw new Error('sp_eval requires a string "code" argument');
	}
	const timeout = args && typeof args.timeout_ms === 'number' ? args.timeout_ms : DEFAULT_TIMEOUT_MS;
	const seq = nextSeq();

	// Atomic publish: write a temp file in the same dir, then rename over request.json.
	const tmp = path.join(BASE, 'request.' + process.pid + '.' + seq + '.tmp');
	fs.writeFileSync(tmp, JSON.stringify({ seq: seq, code: code }));
	fs.renameSync(tmp, REQUEST_PATH);

	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		const resp = readJson(RESPONSE_PATH);
		if (resp && resp.seq === seq) {
			return resp;
		}
		await sleep(POLL_INTERVAL_MS);
	}
	throw new Error('timed out after ' + timeout + 'ms waiting for a reply. '
		+ 'Is the JS Console open in Synplant with the bridge on (type `bridge on`)?');
}

function formatEval(resp) {
	const parts = ['value: ' + resp.value];
	if (resp.output && resp.output.length) {
		parts.push('output:\n' + resp.output.replace(/\n$/, ''));
	}
	if (!resp.ok) {
		parts.push('error: ' + resp.error);
	}
	return { text: parts.join('\n'), isError: !resp.ok };
}

//
// Tool: sp_status — report whether a bridge is attached and the current seqs.
//
function spStatus() {
	const lines = ['base: ' + BASE];
	if (!fs.existsSync(BASE)) {
		lines.push('folder: missing (will be created on first sp_eval)');
		return { text: lines.join('\n'), isError: false };
	}
	const presence = readJson(PRESENCE_PATH);
	if (presence && presence.ready) {
		// Use the presence file's mtime (OS wall clock) for "announced ago" — the
		// bridge measures time with getMonotonicTime(), not a wall clock, so it does
		// not write a comparable epoch timestamp.
		let announced = '';
		try {
			const ageMs = Date.now() - fs.statSync(PRESENCE_PATH).mtimeMs;
			announced = ', announced ' + Math.round(ageMs / 1000) + 's ago';
		} catch (e) { /* mtime unavailable, omit */ }
		lines.push('attached: yes (protocol ' + presence.protocol + announced + ')');
	} else {
		lines.push('attached: no (open the JS Console in Synplant and type `bridge on`)');
	}
	const req = readJson(REQUEST_PATH);
	const resp = readJson(RESPONSE_PATH);
	lines.push('last request seq: ' + (req && typeof req.seq === 'number' ? req.seq : '(none)'));
	lines.push('last reply seq: ' + (resp && typeof resp.seq === 'number' ? resp.seq : '(none)'));
	return { text: lines.join('\n'), isError: false };
}

const TOOLS = [
	{
		name: 'sp_eval',
		description: 'Evaluate JavaScript against the live Synplant engine via the JS Console '
			+ 'file bridge and return the result. The JS Console window must be open with the '
			+ 'bridge enabled (type `bridge on` in it). Code runs in the shared JS global space, '
			+ 'so it can read and drive Synplant\'s running scripts. Keep snippets short: each '
			+ 'eval freezes the UI and is subject to Synplant\'s ~20s suspension limit. Wrap '
			+ 'multi-statement snippets in an IIFE to avoid leaking vars or shadowing host '
			+ 'globals such as save, load, or print.',
		inputSchema: {
			type: 'object',
			properties: {
				code: {
					type: 'string',
					description: 'JavaScript to evaluate, e.g. "getElement(\'patch\').genome.flt_freq" '
						+ 'or "BRANCH_COUNT". The value of the final expression is returned; print() '
						+ 'output is captured too.'
				},
				timeout_ms: {
					type: 'number',
					description: 'How long to wait for a reply before giving up. Default ' + DEFAULT_TIMEOUT_MS + '.'
				}
			},
			required: ['code']
		}
	},
	{
		name: 'sp_status',
		description: 'Report whether a JS Console bridge is currently attached (via bridge.json) '
			+ 'and the last request/reply sequence numbers. Use this to check the connection '
			+ 'before evaluating.',
		inputSchema: { type: 'object', properties: {} }
	}
];

async function handleToolCall(name, args) {
	if (name === 'sp_eval') {
		const resp = await spEval(args || {});
		return formatEval(resp);
	}
	if (name === 'sp_status') {
		return spStatus();
	}
	throw new Error('unknown tool: ' + name);
}

//
// JSON-RPC plumbing
//

function send(msg) {
	process.stdout.write(JSON.stringify(msg) + '\n');
}

function sendResult(id, result) {
	send({ jsonrpc: '2.0', id: id, result: result });
}

function sendError(id, code, message) {
	send({ jsonrpc: '2.0', id: id, error: { code: code, message: message } });
}

async function dispatch(msg) {
	const id = msg.id;
	const method = msg.method;

	// Notifications (no id) get no response.
	if (id === undefined || id === null) {
		return;
	}

	switch (method) {
		case 'initialize': {
			const requested = msg.params && msg.params.protocolVersion;
			sendResult(id, {
				protocolVersion: requested || DEFAULT_PROTOCOL,
				capabilities: { tools: {} },
				serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
			});
			return;
		}
		case 'ping':
			sendResult(id, {});
			return;
		case 'tools/list':
			sendResult(id, { tools: TOOLS });
			return;
		case 'tools/call': {
			const params = msg.params || {};
			try {
				const out = await handleToolCall(params.name, params.arguments);
				sendResult(id, {
					content: [{ type: 'text', text: out.text }],
					isError: !!out.isError
				});
			} catch (e) {
				// Tool-level failure is reported as a result with isError, per MCP.
				sendResult(id, {
					content: [{ type: 'text', text: String(e && e.message ? e.message : e) }],
					isError: true
				});
			}
			return;
		}
		default:
			sendError(id, -32601, 'method not found: ' + method);
			return;
	}
}

function main() {
	ensureBase();
	log('ready. bridge folder:', BASE);

	// Don't exit while a tool call is still in flight (an sp_eval may be mid-poll
	// when stdin closes). Real clients keep stdin open; this matters for graceful
	// shutdown and for piped/test invocations.
	let pending = 0;
	let endReceived = false;
	let exiting = false;
	function maybeExit() {
		if (endReceived && pending === 0 && !exiting) {
			exiting = true;
			// Flush any buffered stdout (e.g. the final reply) before exiting; a
			// bare process.exit() can truncate a pending write on a pipe.
			process.stdout.write('', function () { process.exit(0); });
		}
	}

	let buffer = '';
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function (chunk) {
		buffer += chunk;
		let nl;
		while ((nl = buffer.indexOf('\n')) >= 0) {
			const line = buffer.slice(0, nl).trim();
			buffer = buffer.slice(nl + 1);
			if (line === '') {
				continue;
			}
			let msg;
			try {
				msg = JSON.parse(line);
			} catch (e) {
				log('failed to parse line:', line);
				continue;
			}
			// dispatch is async; errors inside are handled per-message.
			pending++;
			Promise.resolve(dispatch(msg)).catch(function (e) {
				log('dispatch error:', e);
			}).then(function () {
				pending--;
				maybeExit();
			});
		}
	});
	process.stdin.on('end', function () {
		endReceived = true;
		maybeExit();
	});
}

main();
