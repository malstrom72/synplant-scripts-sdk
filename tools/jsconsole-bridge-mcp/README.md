# Synplant JS Console bridge — MCP server

A tiny [Model Context Protocol](https://modelcontextprotocol.io) server that lets
an MCP client (e.g. Claude Code) evaluate JavaScript against a **live** Synplant
engine and read the result back — no GUI automation, no screen reading.

It drives the file bridge built into `JS Console.spscript`. You type `bridge on`
in the JS Console; this server writes JS requests to a shared folder and reads the
replies the bridge writes back.

## How it fits together

```
MCP client  ──sp_eval(code)──▶  this server  ──request.json──▶  JS Console bridge
                                                                 (eval in live engine,
                                                                  in the shared JS globals)
MCP client  ◀──value/output──   this server  ◀─response.json──  JS Console bridge
```

Because every Synplant script shares one JS global space, code you `sp_eval` can
read and drive a script running in the main GUI layer while the JS Console runs in
the dev layer — it's a real debugger into the running instrument.

## Shared folder

Both ends agree on a folder inside the Sonic Charge user-documents directory
(`DIRS.DOCUMENTS`), in a `jsconsole-bridge` subfolder:

| OS      | Folder |
| ------- | ------ |
| macOS   | `~/Documents/Sonic Charge/jsconsole-bridge/` |
| Windows | `%USERPROFILE%\Documents\Sonic Charge\jsconsole-bridge\` |

**Why there, not a machine-global path?** Synplant sandboxes script file I/O. At
startup it grants scripts deep **read-write** access to one trusted location —
`userPresetsDefault`, which is exactly `DIRS.DOCUMENTS` — and prompts the user for
anything outside the trusted set. Keeping the bridge folder under `DIRS.DOCUMENTS`
means `bridge on` (and every poll/reply after it) reads and writes **without ever
triggering a file-permission prompt**. A machine-global path like `/Users/Shared`
would prompt on first use and break if denied.

This server `mkdir -p`s the folder on startup; the bridge also creates it on
`bridge on` via `makeDir` — whichever side starts first wins. The two ends must
resolve to the **same** folder: the server derives it from `os.homedir()`, the
bridge from `DIRS.DOCUMENTS`. If your install puts user documents somewhere
non-standard, set the `BRIDGE_BASE` environment variable (it must match
`jsConsole.bridgeBase()` in `JSConsole_main.js`).

Files (all JSON):

- `request.json` — `{ seq, code }`, written by this server (temp file + atomic rename).
- `response.json` — `{ seq, ok, value, output, error }`, written by the bridge.
- `bridge.json` — `{ ready, protocol }`, written by the bridge on `bridge on`. The
  server uses this file's mtime for the "announced N s ago" status (the bridge
  measures time with `getMonotonicTime()`, not a wall clock, so it writes no epoch).

Requests and replies are paired by a strictly increasing `seq` (epoch-ms based,
so it keeps climbing across restarts). The bridge ignores any `seq` it has already
handled.

> **One Synplant instance only.** The folder is a single fixed machine-global path,
> so the bridge assumes exactly one live bridge per machine: one running Synplant,
> one JS Console, `bridge on`. Two instances with the bridge enabled would race
> over the same files — enable `bridge on` in only one at a time.

## Tools

- **`sp_eval(code, [timeout_ms])`** — evaluate `code` against the live engine.
  Returns the value of the final expression plus any `print()` output. Keep
  snippets short: each eval freezes the UI and is subject to Synplant's ~20s
  per-call suspension limit. Default timeout `20000` ms.
- **`sp_status()`** — report whether a bridge is attached (via `bridge.json`) and
  the last request/reply sequence numbers.

## Install

Requires Node ≥ 18 (no dependencies, no build step).

### 1. Install the JS Console into Synplant

Copy the `JS Console.spscript` folder (at the repo root) into your Synplant Scripts
folder. The quickest way to find that folder is the script menu in Synplant →
**Open Scripts Folder** (it is `DIRS.SCRIPTS`).

### 2. Register the MCP server

This repo ships a project-scoped [`.mcp.json`](../../.mcp.json) at its root, so
opening the project in Claude Code offers the server automatically — approve the
one-time prompt and you're done. The `server.js` path is resolved relative to the
repo root.

To register it manually instead (e.g. from outside the repo):

```sh
claude mcp add synplant-bridge -- node /ABS/PATH/TO/synplant-scripts-sdk/tools/jsconsole-bridge-mcp/server.js
```

### Other MCP clients

`.mcp.json` is Claude Code's convention. The bridge itself is client-agnostic — the
`request.json` / `response.json` protocol is just files. Point any MCP client at
`node tools/jsconsole-bridge-mcp/server.js`, or write your own host against the file
protocol described above.

## Usage

1. Open Synplant, open the **JS Console** from the script menu, type `bridge on`.
2. From the MCP client, call `sp_status` to confirm `attached: yes`, then `sp_eval`
   with a snippet, e.g. `getElement('patch').genome.flt_freq`.

You'll see each command echo as `BRIDGE> …` in the JS Console window.

## Running a script over the bridge

Use Synplant's `run()` with the script's `.js` entry point relative to the live
Synplant Scripts folder:

```js
sp_eval("run('Four Knobs.spscript/Four Knobs.js')")
```

For GUI packages the entry `.js` normally calls `displayCushy(...)`, which opens the
package window on its layer. To check which script window is open, read the relevant
layer:

```js
sp_eval("getDisplayedCushy('script')")
```

## Reloading the target script over the bridge

The console's `reload` / `reset` are JS Console *commands*, not globals, so
`sp_eval("reload")` just throws `ReferenceError`. To rerun the script files and
rebuild the GUI from the host — the edit → reload → re-test loop — evaluate the
underlying action instead:

```js
sp_eval("performCushyAction('reload')")
```

A normal reload reruns the JavaScript files but keeps the engine and globals alive.
It does not close the current script window, so **the bridge survives its own
reload** and keeps working. The call returns `true`.

Do **not** drive a full reset (`performCushyAction('reload', 'reset')`) over the
bridge — it wipes JS memory, tearing down the JS Console and the bridge. After that
you must re-enable `bridge on` from the JS Console window. Do resets from the GUI.
