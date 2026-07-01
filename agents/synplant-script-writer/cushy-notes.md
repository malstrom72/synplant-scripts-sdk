# Cushy Notes

Practical Cushy details, gotchas, and patterns useful when writing or debugging `.spscript` GUI
packages, too specific for the main instruction file. These notes do not replace the schema, the JS
reference, or the example packages — when exact syntax or supported fields matter, verify against the
references in [`source-map.md`](source-map.md), or against the live engine over the bridge.

For an orientation to Cushy — the mental model, coordinates and scaling, static versus dynamic — start
with [`docs/Cushy Documentation.md`](../../docs/Cushy%20Documentation.md). This file picks up where
that one leaves off.

This is a living file. Add patterns and gotchas discovered while building real Synplant scripts.

## Meta text and meta variables

Cushy `<metaText>` fields support tags such as `[var]...[/var]`, `[trim]...[/trim]`, `[mac]...[/mac]`,
and `[windows]...[/windows]`. Inside `[var]...[/var]`, meta variables can be used anywhere a variable
can be used.

```cushy
hint: "Branch [var]calculated:@index+1[/var] = [var]myScript.@parameter.human[/var]"
```

See [`CushyLint/cushy.schema`](../../CushyLint/cushy.schema) for the strict syntax.

## scriptRoot and the script identity

Define script identity macros at the top of every `.cushy` file. When the package has local
resources, also define a script-root macro and use it wherever the package folder name appears in
Cushy fields such as `file:` and `ivgFile:` references. Recent example packages commonly use
`@script` for the JavaScript object name; some docs and older examples use `@scriptIdentifier` for
the same role.

```makaron
@include scriptSupport.makaron
@define script=myScript
@define scriptRoot=My Script.spscript
@define scriptName=My Script
```

These macros only expand in `.cushy` files. The entry-point `.js` (which calls `displayCushy(...)`)
is plain JavaScript and must use the literal package path.

Renaming a script is a multi-point change — keep these in sync or action dispatch breaks:

- the `@define script=<name>` in the `.cushy` (`@scriptIdentifier` in packages using that
  convention),
- the top-level JavaScript global object (`if (!globals.myScript) { myScript = ... }`),
- the schema action prefix (`action: "myScript.startup"`),
- the package folder `<Name>.spscript/` and its filenames,
- the entry `.js` literal path, `displayCushy("<Name>.spscript/<Name>_main", "script", true)`,
- the `@window(...)` title, if it should match.

After a rename, search the package for the old name; remaining matches should be human-readable text,
not dispatch/schema/filename/path references.

## CushyLint

See [`validation.md`](validation.md) for the full command. Easy mistake: passing a directory path
**without** a trailing slash can skip the package's companion `.schema` file and produce false "rule
missing" errors. Always add the slash:

```sh
CushyLint/CushyLint "$(pwd)/My Script.spscript/"
#                                           ^
```

## Cluster views

A `cluster` is not only a display primitive. By default it is an editable paint surface tied to its
`array`.

If `array` points to a normal JavaScript array of plain values, the cluster can write directly into
that array while the user clicks or drags. This is useful for editable step lanes or grids, but
dangerous when the array is meant to be derived display state. One failure mode is dragging through a
display lane and writing marker/image values back into cells that should be controlled by script
state.

Safer patterns:

1. Display-only cluster: use `readonly: true` when the cluster should only visualize state.
2. Editable cluster with controlled state: use custom per-cell GUI variable objects with `get` and
   `set` methods instead of plain values when writes need to be intercepted.
3. Separate display and interaction: layer a readonly visual cluster with a transparent interaction
   cluster for `mouseIndex` and `clickActions`.

Practical rule of thumb: use a plain array only when it is okay for the cluster to modify it
directly. Use `readonly: true` or per-cell `get`/`set` objects when the displayed values are derived
from script state.

Per-cell `get`/`set` objects are for editable cells that need to intercept writes. For readonly data
that changes over time, prefer a plain array refreshed by an `autoexecs` tick. Do not call
`getElement(...)` from a per-cell getter; it runs once per cell per poll.

A cluster is also not always the right primitive for an overlay. If each row only needs one moving
marker, put the marker view in a `group` and drive the group's `offset: { <var>, <var> }` and
`visibility: <var>` from a tick. Those fields change without recreating views, and the script only
has to write one position and visible flag per marker instead of one value per cell.

## `mouseIndex`

- `mouseIndex` is useful for tracking which cluster rectangle the pointer is over.
- It may become an empty string during pointer transitions or release.
- Do not blindly coerce it to a number, because `""` can behave like `0` and cause controls to snap
  to the first cell.
- Keep a last valid index or ignore empty updates during drag.

## Reload and state

- Cushy reruns the matching `_main.js` on GUI reload, but existing globals survive a normal reload.
- All loaded scripts share one JavaScript global space while the Synplant window is open. This is why
  the JS Console and the bridge can inspect another script's globals, and why script-named namespaces
  matter.
- Over the bridge, a normal reload is `sp_eval("performCushyAction('reload')")`: it flushes cached
  resources, rebuilds the open GUI, and reruns JavaScript without replacing the engine. It does not
  close the current script window, so the bridge survives it.
- Synplant caches `.cushy`, JavaScript, IVG, and other script resources while the window is open.
  CushyLint reads fresh files from disk, but Synplant may still show an old parse error from its
  cache until a normal reload. If the on-disk file validates but Synplant still reports a stale error,
  reload before debugging the file further.
- A full reset (the JS Console `reset`, or `performCushyAction('reload', 'reset')`) recreates the
  engine and clears globals. Do not drive a full reset over the bridge — it tears the bridge down.
- If interaction objects are kept across reloads they may retain old methods and closures. For
  development, recreate interaction objects on each reload and carry over only persistent user state.
- Launching a package over the bridge is asynchronous at the Cushy boundary: `displayCushy(...)`
  returns before the package's `_main.js` runs. Do not assert the package global in the same
  `sp_eval`; check it in a follow-up eval. Inspect which script window is open with
  `sp_eval("getDisplayedCushy('script')")`, and confirm the scripts root with `sp_eval("DIRS.SCRIPTS")`.

## GUI render verification

The JS Console bridge verifies script logic, not the rendered GUI. `getDisplayedCushy('script')`
reports the script-layer layout path that Synplant is trying to display; it does not prove the
layout parsed, painted, or contains visible text. A package's `_main.js` can run and create its
global object even when the companion `.cushy` has a layout problem, so bridge calls into that object
can pass while the window is blank or broken.

Cushy/Makaron parse errors are shown in native modal OS dialogs outside the Cushy layer system. There
is no known bridge API for reading those dialogs. Missing fonts, clipped bounds, bad IVG drawing,
wrong z-order, stale resources, parse dialogs, and other render-only issues require looking at the
actual Synplant window.

## Button icons and vectors

A button view's top-level `vector:` overlay is rendered in the button's coordinate space and has
access to `$width`, `$height`, `$down`, `$checked`, `$disabled`, and `$caption`. Use it for stateful
artwork that should fit the current button bounds.

A button style's `icon:` field is different: it is an image. For IVG icons, Cushy draws the image at
the icon's own image size, subject only to any explicit `<image>` `scale:` you set; it does not
auto-fit that artwork to the button bounds. If the button is smaller than the icon, the image clips.
If the icon was authored to fill a particular button size, that artwork effectively fixes the minimum
practical button size unless you redraw or explicitly scale the icon smaller. Small glyph artwork
with padding around it tolerates button-size changes better.

When shrinking a button that uses an `icon:`, render or inspect the icon at its native size first.
Use the top-level `vector:` field instead when the graphic should resize with the button.

## Timed actions and animation

A GUI script gets periodic callbacks by registering a repeating action in the root `autoexecs` block.
Use it for animation, polling, or any time-based behavior. Each action must return quickly — the UI
freezes while script code runs, and a single call over 20 seconds is suspended.

```cushy
autoexecs: {
    { action: "@script.tick", repeat: 1/@fps }
}
```

Use `getMonotonicTime()` deltas (not `Date.now()`) for a stable rate independent of callback cadence:

```javascript
tick: function () {
    var now = getMonotonicTime();
    if (now - this.lastStep >= this.intervalMs) {
        this.lastStep = now;
        this.step();
    }
    this.render();
}
```

Other `autoexecs` triggers include `onChanged: <var>`, `onClose`, `onReload`, `onInit`, and one-shot
`delay`.

## Performance

Measure in Synplant. CushyLint and syntax linters do not predict runtime cost. Treat FPS drops,
visible lag, delayed redraw, the 20-second suspension prompt, or memory termination as real warnings.
For script-side profiling, take `getMonotonicTime()` deltas around action bodies and print occasional
averages rather than tracing every tick.

### Actions and timing

- Script actions run synchronously on the UI thread and block repaint and input until they return,
  except modal calls (alerts, file dialogs), whose waits do not count toward the 20-second timer.
- The 20-second suspension timer is per JavaScript invocation, not cumulative across `autoexecs`.
- Repeated `autoexecs` run as often as possible but do not pre-empt the UI; they queue if the previous
  invocation is still running.
- Use repeat rates that communicate intent. Target 50 Hz or lower for normal scripts; avoid
  "as often as possible" rates like `repeat: 0.001`. To react to a value change, use `onChanged`
  rather than a fast poll — it runs on the next tick only when the value actually changes.
- Updating a variable every tick is acceptable when the view needs full-rate updates. If a variable
  is read by views, changing it frequently keeps those reads active at the full rate.

### GUI variables and polling

- Cushy has no dependency graph: views poll GUI variables regularly, adapting the rate per lookup
  (rarely-changing variables are polled less often). Keep getters short and fast; cache derived text
  or data based on its inputs.
- JavaScript variables shadow Cushy variables of the same name. Account for that when naming GUI
  state.
- An object member with `get`/`set` is a Cushy **variable descriptor**, not a native JS
  getter/setter: reading `myScript.thing` from JavaScript returns the descriptor object; it does not
  call `get`. To reuse the computed value in script logic, call it explicitly: `myScript.thing.get()`.
- An object member used as an action is a Cushy **action descriptor** — `execute` plus optional
  `checked`/`enabled` state functions:

  ```javascript
  doThing: {
      execute: function (param) { /* ... */ },
      checked: function (param) { return /* ... */; },
      enabled: function (param) { return /* ... */; }
  }
  ```

  Reading `myScript.doThing` returns the descriptor; call `myScript.doThing.execute(param)` to run it.
- For dynamic IVG data, compact list strings are usually fine for payloads of a few hundred
  characters, or even around a thousand characters. If the IVG only needs a tiny part of a very large
  structure, do not serialize the whole thing every tick; `guiVariables: true` can be a better fit.
- There is no simple "`bindings` are faster" or "`guiVariables` is faster" rule. Choose based on
  clarity and update pattern.

### View redraw and vector caching

- Cushy uses dirty-rectangle redraws and occlusion culling; drawing outside a view's bounds is clipped
  and the clipped work is not done. Hidden/invisible views usually cost little unless their state
  depends on heavy variable refreshes.
- Bounds and clipping affect both correctness and performance: drawing outside a view's bounds is
  clipped, and the clipped-away work is not drawn. Covered views can often be partly or fully skipped
  when covered by non-transparent views.
- Cushy can handle many views. The cost depends on update patterns, variable refreshes, redraw area,
  and what each view does.
- `hover` and `mousePosition` updates are not inherently expensive, but avoid doing unnecessary work
  in their actions or getters.
- Vector views cache: for the first few ticks after creation a vector draws directly; once stable it
  draws into a compressed offscreen buffer and reuses that cache until its source material, accessed
  bound variables, or native params (`$width`/`$height`) change. Static or rarely-updated vector views
  are cheap after the initial redraws. `file:` vector sources are cached until a reload.
- `defines:` are constant IVG variables available during rendering; `bindings:` are variables
  available during rendering. Neither is a one-time textual substitution.

### IVG and drawing cost

- IVG/ImpD is CPU-interpreted at render time; there is no GPU acceleration. Large pixel areas (big UI
  regions, high zoom, Retina buffers) are usually a bigger cost than individual language constructs.
- Most features (shapes, paths, masks, gradients, opacity, blends, image transforms, text) are
  practical — measure at the real UI size before assuming something is too expensive. Layering static
  and dynamic content into separate vector views can help, or may be unnecessary; measure.
- IVG text anchoring is geometric, not guaranteed optical centering. In small circles, badges, and
  compact buttons, render the real GUI and apply a small visual offset if the text looks high or low;
  when moving the surrounding shape, move labels by the same visual baseline rule, not necessarily to
  the exact numeric center.

### JavaScript data and memory

- The memory cap is checked after garbage collection. `gc()` is available and returns before/after
  heap stats — useful for memory tests and for forcing a collection after building large transient
  data. Returning from an action makes large temporaries collectible if nothing global retains them;
  avoid keeping large transient data in persistent globals.
- `StringBuilder` (and `Array.prototype.join`, which uses it internally) avoids the GC pressure of
  appending many pieces with repeated `+=`. Plain `+` is fine for a few short strings.
- Array elements are full 16-byte JavaScript values; dense numeric arrays can use far more memory than
  a compact string of the same data. Compact strings are often cheaper for dense payloads such as IVG
  list data.

## Patch state and undo

- `getElement('patch')` returns plain JavaScript objects (genome, control, branches, layers) that you
  can read, copy with `JSON.parse(JSON.stringify(...))`, and modify freely before `setElement`.
- Use `setParam` when changing only a few parameters; it creates less structure and does not disturb
  real-time host parameter updates the way replacing the whole patch can.
- Poll `getElementId('patch')` (a cheap integer that changes on any edit) to detect when the patch
  changed, and only re-read the full patch when it does.
- Ordinary `.spscript` windows are non-modal and stay open beside Synplant's own UI. If a control
  changes the sound, edit the live document directly: `saveUndo(...)`, then `setElement('patch', ...)`
  or parameter edits. Do not build a non-modal preview-plus-Apply editor; Save/export, undo/redo, A/B
  compare, preset switching, and automation all operate on the live patch, not `setPreview`.
- `setPreview` is for auditioning or a genuinely modal flow with one clear commit point.
- Call `saveUndo(description)` **before** mutating patch state — the snapshot is the state the user
  returns to. For a continuous gesture, save undo on the first document-changing update and guard
  further drag updates until release, giving one undo entry per gesture. `saveUndo(..., collapse)` is a
  UX choice: `collapse: true` merges repeated same-description actions into one undo item.
- `saveUndo` captures Synplant document state, not your script's JavaScript state. After undo/redo,
  derive script state from the patch where possible (e.g. re-read on `getElementId('patch')` change)
  rather than assuming your cached GUI state still matches.
- For live-edit GUI scripts that repeatedly replace the same conceptual patch with
  `setElement('patch', patch)`, distinguish document identity from patch ownership:
  `patch.id` corresponds to `getElementId('patch')` / Cushy `patch.identity` and changes when the
  document patch changes; store the identity returned by `setElement('patch', patch)` if the script
  needs to recognize its own latest write. `patch.patchId` is the audio-smoothing identity; keep it
  stable across incremental writes while editing the same conceptual patch so held notes can smooth
  instead of retriggering. Set `patch.modified = true` before writing a changed patch when the user
  should be prompted to save the result.
- Saving or refreshing patch metadata can produce a new `patch.identity` even when the live patch is
  still script-owned. A practical guard is to treat identity changes with the script's stable
  `patchId` and `modified === false` as save/metadata echoes: update cached name/path/identity and
  keep the GUI in sync. Treat this as observed live-edit behavior, not a formal file-format
  guarantee.
- If a GUI script has private state that cannot be reconstructed from the generated patch, host undo
  can restore an older document state without restoring the script's JavaScript model. Auto-resync
  only when the live `patch.identity` matches the latest identity written by the current model, or
  when the script can fully rebuild its model from the live patch. Otherwise show an out-of-sync or
  re-apply affordance instead of pretending the controls still describe the patch.
- To make a GUI recover its own controls after undo/redo when generation is many-to-one, memoize the
  inputs that produced an output and key them by a compact content signature of the generated patch or
  patch region.
- Keep numeric fingerprints inside 32-bit integer operations. JavaScript numbers are doubles;
  repeated multiplication by large constants can lose low bits before the next bitwise coercion. For
  compact content signatures, prefer a shift/add step that truncates every round, such as
  `hash = (((hash << 5) - hash) + value) | 0;`.

## Easy `.cushy` mistakes

- `@define` captures everything to the end of the line unless wrapped as a raw value (`@<...@>`). A
  trailing comment becomes part of the macro value and can break later parsing. Put comments on their
  own line, or use a raw value when a same-line comment is convenient:

  ```makaron
  // width of the main area
  @define viewWidth = 360
  @define viewHeight = @<200@> // emitted as a comment, not part of @viewHeight
  ```

- Cushy and IVG spell transparency differently. Cushy's `<color>` accepts `transparent`; IVG uses
  `none` for invisible paint. Use `fill: "transparent"` in `.cushy`, and `fill none` / `pen none` in
  `.ivg` or inline IVG code.

- Cushy `rgb(r,g,b[,a])` and `hsv(h,s,v[,a])` components are normalized floats: `rgb(1,1,1,0.35)`, not
  `rgb(255,255,255,0.35)`. CushyLint checks syntax but may not catch out-of-range components.

- Keep `.cushy` source ASCII unless you have tested the exact character path. Prefer plain `-`, `'`,
  `"`, and `...` in captions and hints.

- A `button` caption is a plain text value, or an object with both `text` and `offset` (the offset is
  required in object form):

  ```cushy
  caption: "GO"
  caption: { text: "GO", offset: { 0, 0 } }
  ```

## View bounds clip drawing and input

Cushy clips hard at every view's bounding box, with no exceptions — nothing outside a view's bounds is
drawn or clickable. For a slider, the slit `start`/`end` coordinates define where the **center** of the
cap travels, not its edges, so the cap fill and its frame stroke must stay inside the view bounds at
the travel extremes. When a control looks clipped at the ends, widen the view or inset the slit.

Use `dragArea` only when the parent view itself is the thing being moved, and there is larger
surrounding space for it to move in. Do not use `dragArea` for "click anywhere in a fixed pad and
move a marker there": a `dragArea` moves its parent. Making the parent as large as the whole pad
gives it no useful room to move, and putting a larger `dragArea` inside a smaller handle group is
clipped by the handle group's bounds.

For fixed pads, layer a full-size `click` view with `mousePosition`, `press`, and `release` actions,
plus a `hover` view when live hover tracking is needed. Let JavaScript store a `dragging` flag,
convert the reported mouse coordinates into the control value, and move the visual marker with group
`offset` variables or another script-controlled visual state.

## Driving IVG from script state

`vector` views can render dynamic data by combining static `defines:` with live `bindings:`. Static
settings such as sizes or palette colors belong in `defines:`. Data that JavaScript updates while the
GUI is open belongs in `bindings:` and is re-read when it changes.

```cushy
{
    type: "vector"
    file: "@scriptRoot/Points"
    defines: {
        "pointSize": "@pointSize"
        "color": "#E0D0D0E0"
    }
    bindings: {
        "points": @script.points
        "selected": @script.selectedPoint
    }
}
```

The script can keep a binding as an IVG/ImpD list string:

```javascript
myScript.points = "[[0,120,80,yes],[1,160,96,no]]";
```

Then IVG can iterate the list and split each row:

```ivg
for p in:$points [
    $split $p into:i,x,y,enabled
    context [
        offset $x,$y
        ellipse 0,0,$pointSize
    ]
]
```

For more structured state, a `vector` view can set `guiVariables: true`. This allows IVG source to
read GUI variables directly with `$<variable-name>` and refreshes when variables touched during the
last repaint change. Prefer explicit `defines:` plus `bindings:` when the data can be expressed
cleanly; it makes the view's input contract visible in the `.cushy` file and avoids giving the
drawing layer access to the full GUI-variable namespace.

When JavaScript needs to generate the whole IVG source string, use the `variable:` source form:

```cushy
{ type: "vector", variable: @script.ivgSource }
```

`variable: <var>` is the direct form for this pattern: the named GUI variable contains the complete
IVG source. Use `code:` when the source is written inline in the `.cushy` file; use `variable:` when
JavaScript owns and updates the source string.

Generated IVG source is flexible but shifts drawing text generation into JavaScript. IVG/ImpD is
interpreted when it renders, so the cost is not a separate compile step; the tradeoff is that
JavaScript may need to rebuild and store more source text, and static `_test.ivg` validation cannot
cover every generated path. NuXJS stores string character data as UTF-16, so a large source string or
compact text payload is usually much cheaper than an equivalent JavaScript array of numbers, though
normal string object and allocation overhead still applies.

## Input model

There is no documented Cushy model for binding arbitrary real-time keyboard keys such as arrows or
WASD to script actions. Design live interaction around mouse hover, click, drag, context click, and
modifier masks. Text input is available through:

- `ask(question, [default])` in JavaScript: a modal text dialog returning a string or `null` on
  cancel.
- The Cushy `edit` built-in action: a modal editor bound to a variable, with optional `default` and
  `reaction`.
- The Cushy `console` view: TTY-style input/output with live `inputVariable`, `inputAction` on Enter,
  and `outputVariable` or `outputArray`. See `JS Console.spscript`.

If modifier combinations matter, test them in Synplant and give each modifier its own click mask with
an explicit priority order.

### Click mask dispatch

For `click` and `button` views, an `actions` block is an ordered dispatch table, not a list of
callbacks. For each mouse event, Cushy scans masks **bottom up**, so later entries have higher
priority, and chooses one matching action.

Consequences:

- Only one action runs for a given event.
- Later masks can steal events from earlier masks when their type/modifiers match.
- Do not add extra masks speculatively. An apparently harmless `{ "down", "nop" }` at the bottom of
  the table can take priority for hit-tracking entry events.
- Put more specific modifier masks after less specific masks when both could match, e.g. put
  `press+shift` below `press` if shift should win.
- `context` handles right-click/control-click and can bind directly to a script action, not only to
  the built-in `popup` action.
- `down`/`up` are hit-tracking enter/leave masks. They are not extra press-drag callbacks.

For a press-drag-release pad, use the masks that define that interaction:

```cushy
{
    type: "click"
    actions: {
        { "press", "@script.press" }
        { "release", "@script.release" }
    }
    mousePosition: { xy: @script.mousePosition, integer: false }
}
```

## Cushy action binding

Cushy JavaScript actions called as methods on the script singleton bind `this` to that script object.
For example, inside `myScript.padPress`, `this === myScript` is true.

Referencing the explicit script singleton is still acceptable when it makes callbacks or moved helper
functions clearer, but do not diagnose action failure as a `this` binding problem without checking it
directly:

```javascript
// Valid when called as a Cushy action on myScript.
padPress: function () {
    this.dragging = true;
    this.setFromMouse(this.mousePosition);
}

// Also valid, and sometimes clearer for callbacks/helper reuse.
padPress: function () {
    myScript.dragging = true;
    myScript.setFromMouse(myScript.mousePosition);
}
```

## All text requires an explicit font

Cushy has no default font. Any text — `caption` views, button `caption` fields (via `font` in the
button style), bubble styles, or any other text-bearing view — is not drawn at all unless that view
or style has an explicit `font`. There is no fallback font.

CushyLint does not flag this. A text-bearing view/style with no `font` is schema-valid and can still
render blank in Synplant.

```cushy
// caption view
{ type: "caption", text: "...", font: { ivgfont: "sans-serif", size: 13, color: "..." } }

// button caption
standard: { fill: "...", font: { ivgfont: "sans-serif", size: 14, color: "..." } }
```

## Radio button / checked state pattern

For radio-button groups, use `action: "set"` with a **plain string variable**. Per the Cushy spec,
`set` is checked when the variable already equals the value, so the `checked:` style applies
automatically with no JavaScript:

```cushy
// JS: a plain string property on the state object — myScript = { mode: '0', ... }
{
    type: "button"
    action: "set"
    params: { myScript.mode, "2" }
    standard:    { fill: "..." , font: ... }
    checked:     { fill: "..." }          // shown when mode == "2"
    checkedDown: { fill: "..." }
}
```

For custom actions, the equivalent is an action descriptor with both `execute` and `checked`; omitting
`checked` means the checked style never applies.

## Standard window chrome

Do not assemble window chrome from primitive views. Include the support macros and use `@window`:

```makaron
@include scriptSupport.makaron

@window(left, top, width, height, "@scriptName", @backgroundColor, @frameColor, white, @script, @<
    // content views; coordinates start at the content area top-left
@>)
```

`@window` emits the top-level `bounds:` and `views:`, and provides the drop shadow, click blocker,
drag area, rounded frame, centered title, and a close button. Wire the script's own close to
`displayCushy(null, 'script')`. Declare `transitions:` and `autoexecs:` separately — `@window` does
not emit them. It owns its internal chrome constants (shadow, title-bar height); do not redefine those
at top level. Use `@windowInLayer(...)` when you need to target a specific Cushy layer.

For window position persistence, store `windowPosition` on the script's state object inside the
`if (!globals.myScript)` guard so it survives the window closing and the JS re-running; the drag area
reads it on open and writes it on drag, but persistence is the script's responsibility.

## IVG notes

- **Prefer external `.ivg` files over inline `code:`** for static graphics (no GUI-variable
  references). External files are easier to review and test in isolation; inline snippets are not.
- **Package-local IVG paths include the package folder.** Resource lookup starts from the schema's
  `resources:` roots, usually the parent of the package, not the `.cushy` file's directory. For
  `My Tool.spscript/Icon.ivg`, use `ivgFile: "My Tool.spscript/Icon"` or
  `file: "My Tool.spscript/Icon"`, not bare `"Icon"`.
- **Button icons belong in the button style `icon:` field.** For an icon-only or icon-plus-frame
  button, use a style like
  `standard: { icon: { ivgFile: "My Tool.spscript/Icon", defines: { fill: "@textColor" } } }`.
  The button view's top-level `vector:` field is a separate overlay drawn on top of the normal button
  graphics with `$down`, `$checked`, `$disabled`, and `$caption` available; use it when the drawing
  should react to button state, not just to supply a regular static button icon.
- **SVG path whitespace:** unbracketed `path svg:` data must be one ImpD argument. Compact paths like
  `path svg:M3,7L8,7L10,9Z` work; paths containing spaces should use brackets, e.g.
  `path svg:[M 3,7 L 8,7 L 10,9 Z]`.
- **Colors:** `none` is transparent; `rgb(r,g,b,a)` uses normalized components (`rgb(1,1,1,0.35)`, not
  0–255); CSS-style `rgba(...)` is not valid IVG.
- **Font coverage:** the built-in `sans-serif` does not cover all Unicode. Use printable ASCII
  (U+0020–U+007E) in GUI-variable return values and captions; characters like the em-dash `—` render
  as replacement boxes. Use `-` or `...` instead.

Use `tools/validate-static-ivg.sh` / `tools\validate-static-ivg.cmd` for static `.ivg` files. For
dynamic IVG or IVG that uses filesystem `include`, make a temporary self-contained `_test.ivg` copy
with representative hardcoded values, add explicit `bounds`, and render it with
`tools/IVG2PNG/IVG2PNG --fonts IVG/fonts`.
Use `--background "#202020"` or another realistic color for transparent or stroke-only artwork. See
[`validation.md`](validation.md#static-ivg-validation) for the full PNG-check workflow and
[`docs/IVG Documentation.md`](../../docs/IVG%20Documentation.md) for the IVG language.

## File extensions and `dir()` scanning

Common Synplant file types: patches are `.synplant` (legacy `.synp`), MIDI configurations are `.scmc`,
and GUI script packages are `.spscript` directories. `browse` also recognizes audio types (`wav`,
`wave`, `aiff`/`aif`/`aifc`/`afc`) for Genopatch references.

`dir(path, filter)` accepts one extension string or an array of extension strings. Extensions do not
include the leading dot. The special extension `"/"` includes directories, so use an array when a
recursive scan wants both subdirectories and selected file types:

```javascript
function scanDir(path) {
    var entries = dir(path, [ '/', 'synplant', 'synp' ]);
    for (var i = 0; i < entries.length; ++i) {
        var e = entries[i];
        if (e.isDirectory) {
            scanDir(path + e.name + DIR_SLASH);
        } else if (/\.synplant$/i.test(e.name)) {
            // handle file
        }
    }
}
```

Use `dir(path)` with no filter only when you need every entry regardless of extension. A filter such
as `dir(path, 'synplant')` returns matching files only; it does not include subdirectories unless
`"/"` is part of the filter.
