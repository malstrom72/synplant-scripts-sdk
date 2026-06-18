# Synplant Scripts SDK

This repository contains the documentation and resources for writing scripts for **Synplant 2** —
Sonic Charge's growth-based synthesizer. Synplant embeds a JavaScript engine and the Cushy GUI
system, so a script can read and transform patches, drive the Genopatch sound-matching engine, build
its own interface, or extend Synplant's built-in interface.

The documentation here was written and verified against **Synplant 2.0.2 (build 309)**.

## What a script can and cannot do

Synplant's scripting engine runs only while the Synplant window is open, and JavaScript executes on
the interface thread — the UI is frozen while a script runs. A few limits follow from that:

- A single script call that runs longer than **20 seconds** is suspended, with the option to abort or
  continue.
- Each instance has roughly a **64 MB** memory budget (after garbage collection); a script that
  exceeds it is terminated.
- Scripts do **not** run in the real-time audio/MIDI callback: they cannot process the live audio
  stream or raw incoming MIDI events sample-by-sample.

Within those bounds a script can do a great deal: read and write the full patch (genome, control
parameters, the branch/DNA tree, layers), render a patch offline to measure its pitch and level,
drive the Genopatch engine, send MIDI, audition patches, and present a full custom interface. See the
[Synplant JS Reference](docs/Synplant%20JS%20Reference.md) for the complete picture.

There are three kinds of script: single-file **`.js`** scripts, **`.spscript`** GUI packages, and
**Mods** that modify Synplant's own interface. They differ in power and in how much they depend on
Synplant internals — see [Script types](#script-types) below.

## Documentation

| Document | What it covers |
| --- | --- |
| [Synplant JS Reference](docs/Synplant%20JS%20Reference.md) | The JavaScript API: engine, constants, functions, the patch/genome object model, Genopatch, the Cushy interface |
| [Synplant Cushy Variables Reference](docs/Synplant%20Cushy%20Variables%20Reference.md) | The GUI variables and built-in actions a `.cushy` layout or script can read, write, and trigger |
| [Synplant Mods Guide](docs/Synplant%20Mods%20Guide.md) | Writing Mods that patch Synplant's own interface at load time |
| [Synplant Script Examples](docs/Synplant%20Script%20Examples.md) | A guided index of the scripts under `examples/` |
| [Cushy Documentation](docs/Cushy%20Documentation.md) | Orientation to the Cushy GUI/layout system |
| [Makaron Documentation](docs/Makaron%20Documentation.md) | The macro-expansion syntax used in `.cushy` files |
| [IVG Documentation](docs/IVG%20Documentation.md) / [ImpD Documentation](docs/ImpD%20Documentation.md) | Vector graphics drawn inside views, and the imperative data format they build on |
| [ivgfont Documentation](docs/ivgfont%20Documentation.md) | The `.ivgfont` font format |

## AI-assisted workflow

For agent-based script development, see
[`agents/synplant-script-writer/vibe-coding.md`](agents/synplant-script-writer/vibe-coding.md). It
includes a starter prompt with the SDK clone URL, a recommended separate project layout, the
project-local `AGENTS.md`, MCP bridge setup, and the second-session smoke test.

## Technology overview

Synplant's interface and scripting are built from several Sonic Charge technologies:

- **NuXJS** — the JavaScript engine, fully ECMAScript 3 with parts of ECMAScript 5.
- **Cushy** — the GUI / layout engine and `.cushy` file format that describes views and wires them to
  scripts through GUI variables and actions.
- **Numbstrict** — the JSON-like object notation `.cushy` files and patch data are written in.
- **Makaron** — the macro-expansion syntax that makes `.cushy` files easier to write.
- **IVG** (Imperative Vector Graphics) and **ImpD** — the compact vector-graphics format used for
  in-view graphics, and the imperative data format it is based on.

## Repository structure

- [`docs/`](docs) — all documentation (see the table above).
- [`JS Console.spscript/`](JS%20Console.spscript) — an in-app JavaScript console used for development,
  with a file bridge that an external tool can drive.
- [`tools/jsconsole-bridge-mcp/`](tools/jsconsole-bridge-mcp) — a small
  [Model Context Protocol](https://modelcontextprotocol.io) server that evaluates JavaScript against a
  live Synplant engine through the JS Console bridge (see [Live scripting bridge](#live-scripting-bridge)).
- `examples/` — complete, working example scripts, indexed by the
  [Script Examples](docs/Synplant%20Script%20Examples.md) document.
- `CushyLint/` — the command-line `.cushy` syntax checker and `cushy.schema`, the canonical reference
  for the `.cushy` format.
- `ts/` — the TypeScript declaration file (`COJSEngine.d.ts`) that is the authoritative form of the
  scripting API, plus its compile setup.

## Getting started

1. Find your Synplant Scripts folder via Synplant's script menu → **Open Scripts Folder** (it is the
   `DIRS.SCRIPTS` location).
2. Put a single-file script (`MyScript.js`) or a GUI package directory (`MyScript.spscript/`) inside
   it. It appears in the script menu.
3. For a GUI package, the entry `MyScript.js` opens the window:

   ```javascript
   displayCushy('MyScript.spscript/MyScript_main', 'script', true);
   ```

   When Cushy opens `MyScript_main.cushy` it first runs the same-named `MyScript_main.js`, which sets
   up the script's variables and actions.

Scripts persist their own data under `DIRS.DOCUMENTS` (the Sonic Charge user-documents folder), the
one location a script may write to without a file-permission prompt. See the JS Reference's
*File Access and Permissions* section.

### Script types

- **Single-file `.js`** — the most robust. Uses only the JavaScript API, a stable contract. Best for
  one-shot operations on the current patch.
- **GUI packages `.spscript`** — a window of your own, built with Cushy. Depends on the `.cushy`
  format and conventions in addition to the JavaScript API.
- **Mods** — scripts in a `Mods/` subfolder that run at startup and rewrite Synplant's own interface.
  The most powerful and the most version-sensitive, because they reach into Synplant internals. See
  the [Mods Guide](docs/Synplant%20Mods%20Guide.md).

### Development scripts folder

For quicker round-trips, keep your scripts in a project folder and point Synplant's Scripts folder at
it with a symbolic link, so the files you edit are the ones Synplant loads. This pairs well with the
[live scripting bridge](#live-scripting-bridge): edit a file, then reload over the bridge with
`sp_eval("performCushyAction('reload')")`.

Confirm the exact folder with **Open Scripts Folder** first, and copy its current contents into your
project so nothing already installed is lost. On macOS the folder is normally:

```text
/Library/Application Support/Sonic Charge/Synplant Scripts/
```

Copy it into your project, move the original aside as a backup, then create the link (the
`/Library` location needs administrator rights, hence `sudo`):

```sh
mkdir -p "/path/to/my-synplant-scripts"
cp -R "/Library/Application Support/Sonic Charge/Synplant Scripts" \
  "/path/to/my-synplant-scripts/scripts"
sudo mv "/Library/Application Support/Sonic Charge/Synplant Scripts" \
  "/Library/Application Support/Sonic Charge/Synplant Scripts.backup"
sudo ln -s "/path/to/my-synplant-scripts/scripts" \
  "/Library/Application Support/Sonic Charge/Synplant Scripts"
```

On Windows, confirm the folder with **Open Scripts Folder**, then copy it into your project, move the
original aside, and create a directory junction:

```bat
xcopy "<Synplant Scripts folder>" "C:\path\to\my-synplant-scripts\scripts\" /E /I
ren "<Synplant Scripts folder>" "Synplant Scripts.backup"
mklink /J "<Synplant Scripts folder>" "C:\path\to\my-synplant-scripts\scripts"
```

After linking, the scripts in your project `scripts` directory are the same ones Synplant sees. To
revert, remove the link and rename the `Synplant Scripts.backup` folder back.

## Cushy

`.cushy` files describe a window's layout as a tree of views and connect them to your script through
GUI variables and actions. In Cushy you can often write math expressions where a number is expected:
`$` inserts a field's default value, and `l`/`t`/`w`/`h`/`r`/`b` refer to the left/top/width/height/
right/bottom of the parent rectangle — for example `bounds: { l+10, t+10, w-20, h-20 }`.

The format is large and is validated against a schema, so [`CushyLint/cushy.schema`](CushyLint/cushy.schema)
is the canonical reference (its inline comments document every view type and built-in action). Run
**CushyLint** over your package to check syntax and schema conformance before loading it in Synplant:

```sh
CushyLint/CushyLint "$(pwd)/My Script.spscript/"
```

Pass a directory path with a trailing slash so companion `.schema` files are picked up. For an
orientation to the system, read [Cushy Documentation](docs/Cushy%20Documentation.md).

## Live scripting bridge

For development, the `JS Console.spscript` package includes a file bridge that lets an external
process evaluate JavaScript against a **live** Synplant engine and read the result back. The
[`tools/jsconsole-bridge-mcp/`](tools/jsconsole-bridge-mcp) MCP server drives that bridge, so an MCP
client can run snippets against the running instrument — a real debugger into a script as it runs.

To use it: install `JS Console.spscript` into your Synplant Scripts folder, open the JS Console, type
`bridge on`, and point your MCP client at the server (the project-scoped
[`.mcp.json`](.mcp.json) registers it automatically for compatible clients). See the
[bridge README](tools/jsconsole-bridge-mcp/README.md) for details.

## TypeScript

The authoritative form of the scripting API is the TypeScript declaration file
[`ts/COJSEngine.d.ts`](ts/COJSEngine.d.ts). Synplant's own interface is written in TypeScript compiled
to the ECMAScript subset the engine runs, and script authors can target the same definitions for
editor completion and type checking.

## Prerequisites

For everyday scripting — writing `.cushy` and `.js` files and running CushyLint — no extra tools are
needed beyond what is in this repository; the CushyLint binaries are prebuilt.

[Node.js](https://nodejs.org/) (version 18 or newer) is needed only for two optional tasks: running
the JS Console MCP bridge server in [`tools/jsconsole-bridge-mcp/`](tools/jsconsole-bridge-mcp), and
compiling TypeScript against `ts/COJSEngine.d.ts`.

## A note on compatibility

Many proprietary technologies, formats, and languages are involved in building interfaces for Sonic
Charge plug-ins. They have evolved over time and will continue to. There is no guarantee that a script
that works in the current version of Synplant will work unchanged in the next, though good
compatibility is a goal. Single-file `.js` scripts are the most stable; Mods, which depend on
Synplant's internal interface, are the most likely to need updates across releases.
