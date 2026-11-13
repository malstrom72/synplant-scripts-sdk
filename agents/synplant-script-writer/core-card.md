# Synplant Script Writer Core Card

The rules that apply to every Synplant scripting task, for agents that cannot load the full instructions. Everything
else is in [`llms.txt`](../../llms.txt), a section index with line ranges: find the section there and read only those
lines. The full instructions are [`instructions.md`](instructions.md).

## JavaScript

- Synplant runs ECMAScript 3 with partial ECMAScript 5. No arrow functions, `let`, `const`, classes, template
  literals, destructuring, promises, modules or async code. JSON, string index access, `Object.assign` and
  `Array.isArray` are available.
- `Math.round` does not convert a string first: `Math.round("7")` is `70`. GUI variable setters receive strings, so
  write `Math.round(+value)`.
- Use only functions, objects, actions and schema fields documented in this SDK. Never invent API. Host helpers such as
  `clamp`, `displayCushy` and `select` come from Synplant's main script, not the engine; guard them with `typeof` when
  unsure.
- Scripts run only while the Synplant window is open. Closing it destroys the JavaScript environment; all scripts
  share one environment while it is open.
- A script that runs for 20 seconds is suspended, and the UI freezes while any script runs. For timed or repeated
  work use short repeating Cushy `autoexecs`, not loops. Time with `getMonotonicTime()`, not `Date.now()`.
- No real-time audio or MIDI processing, no audio export and no network.
- Memory is limited to about 64 MB per instance after garbage collection; every value costs at least 16 bytes.

## Script types

- A single `.js` file is the default. Use a `.spscript` package when the user wants a window or a persistent tool. Use
  a Mod, a `.js` in `Mods/` that rewrites Synplant's own interface, only to change the built-in UI.

## Reload-safe GUI scripts

- GUI scripts rerun on every reload, including the one a zoom change causes. Keep state in one global object named
  after the script and guard it at top level: `if (!this.myScript) { myScript = { inited: false }; }`. Reading an
  undeclared global throws, so test `this.myScript`, not `myScript`. For ESLint, add `/* global myScript:writable */`
  at the top of each file that uses it. Keep only changing state in that object; constants, methods and GUI variable
  handlers go outside the guard and are reassigned on every run.
- A reload must leave everything the user sees unchanged: startup code must not re-randomize, re-capture or write to
  the document.
- Over the bridge, `sp_reload` reruns the scripts and keeps globals. Never run `reload` with `reset` over the bridge:
  it tears the bridge down. When the state object's shape changes during development, start it over instead of
  writing migration code: `sp_eval("myScript = undefined")`, then `sp_reload`.

## Changing the document

- Call `saveUndo(label)` immediately before each write. With `collapse` `true`, a write with the same label as the
  last undo entry joins that entry, even from a separate gesture; for one undo step per drag, see `saveUndo` in the
  JS Reference.

## Code and comments

- Comments describe the code as it is now: no revision history ("renamed from"), version counters or "verified"
  claims.
- Write each rule once. When two functions need the same decision, call one shared function instead of keeping two
  copies in sync.

## Cushy GUI (`.cushy`)

- All text needs an explicit `font`, for example `font: { ivgfont: "sans-serif", size: 13, color: "..." }`. Cushy has
  no default font, so text without one is not drawn.
- Colors use normalized components: `rgb(1,1,1,0.35)`, not `rgb(255,255,255,0.35)`. Cushy's invisible color is
  `transparent`; IVG's is `none`.
- Views clip hard at their bounds: nothing outside a view's bounds is drawn or clickable.
- Keep `.cushy` source and the strings getters return ASCII.
- `@define` takes everything to the end of the line, so a trailing `//` comment becomes part of the value. Put
  comments on their own line.
- Build windows with `@include scriptSupport.makaron` and `@window(...)`, not from primitive views.
- Lay out from a few `@define`s for margins, gutters and columns, not hand-typed coordinates. Before calling a GUI
  done, look at a screenshot of it: every caption fits its longest value, and edges and gaps are consistent. Button
  labels say what the button does; explanations go in the `hint`.
- Every script action the `.cushy` names, `autoexecs` included, must be listed in the package `.schema`. Remove the
  entry when you remove the action.
- Views poll their variables and action states up to 50 times a second. Keep getters, `enabled` and `checked` cheap:
  return values computed when their inputs changed. Read `preferences.*` once into a script variable.
- Never modify anything in `Synplant Resources/`; it is a copy of the shipped files.
- To start a GUI package, copy `examples/Tuning Fork.spscript`, the smallest example (about 0.7k tokens: a window,
  a checkbox button with a caption and a package schema). For knobs, copy `examples/Four Knobs.spscript` (about
  1.3k). The other examples are 2k to 11k tokens; open only the parts you need.

## Graphics (IVG)

- Check every IVG instruction against `docs/IVG Documentation.md`; CushyLint does not validate IVG.
- Fixed vector art: an image from IVG (`image: { ivgFile: "name" }`). Drawings that follow variables: a `vector` view
  with `file:` and `bindings:`.
- IVG colors are normalized too, and `none` is transparent.

## Validate before you answer

Run every check below again after each round of edits, not only the first time; work is not done while a check fails
or was skipped. Run them from the project root, with the SDK in `references/synplant-scripts-sdk/`; from the SDK root,
drop that prefix. On Windows, use the `.cmd` and `.bat` versions, in Git Bash too.

- `.js` files: `references/synplant-scripts-sdk/tools/validate-js.sh scripts`. Run it from the project root, or
  ESLint skips files outside the SDK.
- `.cushy` files: CushyLint on the package folder, with a trailing slash:
  `references/synplant-scripts-sdk/CushyLint/CushyLint "scripts/My Script.spscript/"`. The package `.schema` must
  include `Synplant2.schema` from the SDK; an error count of 7 with `rule view is missing` means it was not loaded.
  On Windows, Git Bash included, call `CushyLint/CushyLint.bat` with the same argument, forward slashes and a
  trailing `/`: the file without an extension is the Unix script and tries to compile with g++.
- `.ivg` files: `references/synplant-scripts-sdk/tools/validate-static-ivg.sh "scripts/My Script.spscript"`, and
  render icons while designing them with
  `references/synplant-scripts-sdk/tools/IVG2PNG/IVG2PNG <input.ivg> <output.png>`. On Windows that is
  `IVG2PNG.exe`; `IVG2PNG` without an extension is the macOS binary.
- When the bridge tools are available, call `sp_status` first and verify behavior with `sp_eval`. Never claim code
  was tested inside Synplant unless it ran there.
