# Example Selection

Use the example scripts as implementation references, not generic templates. The
[Script Examples](../../docs/Synplant%20Script%20Examples.md) document indexes them with what each
demonstrates; the scripts themselves are under [`examples/`](../../examples).

Starting points by task:

- **Patch/genome operation, one-shot** — [`examples/Inverse Plant.js`](../../examples/Inverse%20Plant.js)
  and [`examples/Tween Branches.js`](../../examples/Tween%20Branches.js): read the current patch and
  selected branch, transform it, and apply the result as an undoable edit.
- **Macro-style genome control with a GUI** — [`examples/Four Knobs.spscript`](../../examples/Four%20Knobs.spscript):
  morph the genome along random vectors via a small knob interface.
- **Genopatch (Papageno) workflow** — [`examples/Export All Genopatch Solutions.js`](../../examples/Export%20All%20Genopatch%20Solutions.js)
  for driving the `papageno` API from a script, and
  [`examples/Genobatch.spscript`](../../examples/Genobatch.spscript) for batch searching over a folder
  with progress feedback.
- **Auditioning sound** — [`examples/Tuning Fork.spscript`](../../examples/Tuning%20Fork.spscript):
  a preview patch toggled with `setPreview`.
- **Browsing/applying resources** — [`examples/Skin Chooser.spscript`](../../examples/Skin%20Chooser.spscript):
  listing a directory and presenting a scrollable grid.
- **Extending Synplant's own interface** — [`examples/Mods/`](../../examples/Mods): Favorite Button,
  Detailed DNA Hints, Graft Onto Branch, Tween Branches. See the
  [Mods Guide](../../docs/Synplant%20Mods%20Guide.md).

When adapting an example:

- Preserve the package structure unless the task clearly calls for a single-file script.
- Create the package `.schema` with paths that are correct for the package's actual location. The SDK
  examples' `../../Synplant Resources/...` header is correct inside `examples/`; a separate project
  under `scripts/` normally points back through `../../references/synplant-scripts-sdk/...`.
- Keep generated JavaScript within the engine's ES3 constraints (see
  [`instructions.md`](instructions.md)).
- Verify behavior against the live engine with the bridge when it is available.
