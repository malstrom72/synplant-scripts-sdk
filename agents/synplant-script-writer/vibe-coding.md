# Vibe-Coding Synplant Scripts

This guide is for using an AI coding assistant with the Synplant Scripts SDK. Treat the SDK as the
source of truth for documentation, examples, schemas, resources, and the live bridge.

## Starter prompt

Copy this into a fresh agent session to bootstrap a Synplant script project:

```text
I want to build Sonic Charge Synplant scripts with this SDK. Clone the SDK into:

  git clone https://github.com/malstrom72/synplant-scripts-sdk.git references/synplant-scripts-sdk

Then read and follow the project bootstrap instructions in:

  references/synplant-scripts-sdk/agents/synplant-script-writer/vibe-coding.md

Use the agent behavior and source-of-truth rules from:

  references/synplant-scripts-sdk/agents/synplant-script-writer/instructions.md

Set up the project as vibe-coding.md describes, then wait for my script idea.
```

## Recommended project layout

Keep your own scripts in a separate project and use the SDK as a reference checkout:

```text
my-synplant-scripts/
  AGENTS.md
  .mcp.json
  scripts/
    MyUtility.js
    MyTool.spscript/
      MyTool.js
      MyTool_main.cushy
      MyTool_main.js
      MyTool_main.schema
  references/
    synplant-scripts-sdk/
```

Write project scripts under `scripts/`, not inside the SDK checkout, unless you are deliberately
contributing SDK examples.

## Minimal project `AGENTS.md`

```md
# Project Agent Instructions

For Synplant scripting work, follow:

`references/synplant-scripts-sdk/agents/synplant-script-writer/instructions.md`

Use the SDK checkout as the source of truth for docs, examples, schemas, resources, and validation.
```

## Installing scripts in Synplant

Synplant runs scripts from the **Synplant Scripts** folder — open it from Synplant's script menu with
**Open Scripts Folder**. Inside Synplant, `DIRS.SCRIPTS` is the absolute path to this folder.

- Single-file scripts go in directly as `MyUtility.js`.
- GUI scripts go in as `MyTool.spscript/` package folders.
- Mods go in a `Mods/` subfolder; every `.js` there runs at startup.

For quicker iteration you can keep a project-local scripts folder and link Synplant's scripts folder
to it — see **Development scripts folder** in the [repository README](../../README.md#development-scripts-folder)
for the macOS/Windows commands. Linking changes Synplant's live scripts installation and may need
elevated permissions, so ask the user before doing it, and first check whether the live folder is
already a symlink to another workspace (on macOS, inspect it with `ls -ld` and `readlink`).

## The live bridge

The SDK's `JS Console.spscript` contains a file bridge, and
[`tools/jsconsole-bridge-mcp/`](../../tools/jsconsole-bridge-mcp) is the MCP server that drives it.
Wire it up so you can verify against the live engine. The bridge brokers files in a folder under
`DIRS.DOCUMENTS`, which Synplant scripts may write to without a permission prompt — so no special
folder setup is needed.

1. Install the SDK's `JS Console.spscript` into the folder Synplant reads (it must be **this SDK's**
   bridged copy — a plain console has no `bridge on`).
2. Register the MCP server for the assistant.
   - **Claude Code:** a project-root `.mcp.json` registers it:

     ```json
     {
       "mcpServers": {
         "synplant-bridge": {
           "command": "node",
           "args": ["references/synplant-scripts-sdk/tools/jsconsole-bridge-mcp/server.js"]
         }
       }
     }
     ```

     Then exit Claude Code, start it again in the project, and approve the project MCP server prompt.
   - **Codex** uses its own MCP configuration; a project `.mcp.json` alone is not enough. Check
     `codex mcp --help`; if it supports `add`, register with an absolute path:

     ```sh
     codex mcp add synplant-bridge -- node /ABS/PATH/TO/references/synplant-scripts-sdk/tools/jsconsole-bridge-mcp/server.js
     ```

     Otherwise add it to `~/.codex/config.toml` (ask the user before editing a file outside the
     workspace), then reopen Codex.
3. Open Synplant, open the JS Console, type `bridge on`.
4. Restart or reopen the MCP client after registering the server. The `sp_status` and `sp_eval`
   tools are unavailable until the client has loaded the MCP server, so the smoke test normally
   happens in this second session, not during the initial bootstrap.
5. Resume the assistant session and run the smoke test:

   ```text
   Run the Synplant bridge smoke test now. Check sp_status, then evaluate 1 + 1 over the bridge.
   ```

   `sp_status` should report `attached: yes`, and `sp_eval` of `1 + 1` should return `2`.

Do not claim the bridge tools are available until the MCP client has actually loaded them — verify
that `sp_status`/`sp_eval` exist before relying on them. The bridge assumes **one** running Synplant
with one JS Console and `bridge on`.

## Reloading while iterating

Synplant caches resources, including script JavaScript, while the window is open. Over the bridge,
re-run edited files and rebuild with `sp_eval("performCushyAction('reload')")` — a normal reload keeps
the engine and globals alive, so the bridge survives it. In the JS Console window directly, use the
reload button (or `reload`); a `reset` performs a full engine reset that clears globals and tears down
the bridge. Closing Synplant's window destroys the whole environment. GUI scripts must survive being
re-run, because an end user changing the zoom scale also forces a reload.

## JavaScript style

Synplant's engine is ECMAScript 3 with a little ECMAScript 5 and SDK-provided host helpers. Prefer
`var`, function declarations, and plain objects; one script-named global state object for persistent
state; a main IIFE for local scope in single-file scripts; and rerun-safe setup for GUI scripts. Do
**not** use `let`/`const`, arrow functions, classes, destructuring, modules, promises, async, or
template literals.

## Script state pattern

```js
if (!globals.myScript) {
    myScript = {
        inited: false,
        cache: {}
    };
}

(function () {
    if (!myScript.inited) {
        myScript.cache = {};
        myScript.inited = true;
    }

    // Script body here.
}());
```

Keep state in the single script-named object; avoid scattering globals or aliases that obscure it.
