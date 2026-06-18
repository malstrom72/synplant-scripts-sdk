# Source Map

Use these repository files as the grounding map for Synplant scripting work.

## Core API references

- [`docs/Synplant JS Reference.md`](../../docs/Synplant%20JS%20Reference.md) — the JavaScript API:
  engine limits, constants, functions, the patch/genome/branch object model, Genopatch, host helpers,
  and the Cushy interface.
- [`ts/COJSEngine.d.ts`](../../ts/COJSEngine.d.ts) — the authoritative, machine-readable declaration
  of the native API. When the prose and the declarations disagree, the declarations win.
- [`docs/Synplant Cushy Variables Reference.md`](../../docs/Synplant%20Cushy%20Variables%20Reference.md) —
  the GUI variables and built-in actions a `.cushy` layout or script can read, write, and trigger.

## Cushy and GUI references

- [`docs/Cushy Documentation.md`](../../docs/Cushy%20Documentation.md) — orientation to Cushy: the
  mental model, a minimal-window walkthrough, and where each part is documented. Start here, then drill
  into the schema for exact syntax.
- [`CushyLint/cushy.schema`](../../CushyLint/cushy.schema) — the official `.cushy` format reference:
  view types, built-in actions, meta text/variables, and schema rules, with inline comments.
- [`CushyLint/chimera.schema`](../../CushyLint/chimera.schema) — the standard host actions and the
  `midiAssign` view, layered above `cushy.schema`.
- [`Synplant Resources/scriptSupport.makaron`](../../Synplant%20Resources/scriptSupport.makaron) — the
  shared macros (`@window`, `@windowInLayer`, helpers) used by GUI scripts.
- [`docs/Makaron Documentation.md`](../../docs/Makaron%20Documentation.md) — the macro syntax.
- [`docs/IVG Documentation.md`](../../docs/IVG%20Documentation.md) and
  [`docs/ImpD Documentation.md`](../../docs/ImpD%20Documentation.md) — vector graphics drawn inside
  views and the data format they build on.
- [`docs/ivgfont Documentation.md`](../../docs/ivgfont%20Documentation.md) — the `.ivgfont` format.
- [`cushy-notes.md`](cushy-notes.md) — practical Cushy gotchas and patterns.

## Mods

- [`docs/Synplant Mods Guide.md`](../../docs/Synplant%20Mods%20Guide.md) — writing Mods that patch
  Synplant's own interface at load time.

## Examples

- [`docs/Synplant Script Examples.md`](../../docs/Synplant%20Script%20Examples.md) — a guided index of
  the example scripts, what each does, and which techniques it shows.
- [`examples/`](../../examples) — the example scripts themselves. Inspect package contents; treat
  `.spscript` items as directories, not flat files.

## The live bridge

- [`tools/jsconsole-bridge-mcp/README.md`](../../tools/jsconsole-bridge-mcp/README.md) — bridge setup,
  `sp_eval`/`sp_status` usage, running scripts with `run(...)`, and reload behavior over the live JS
  Console bridge.

## Repository overview

- [`README.md`](../../README.md) — repository structure, technology overview, getting started, and the
  compatibility note.
