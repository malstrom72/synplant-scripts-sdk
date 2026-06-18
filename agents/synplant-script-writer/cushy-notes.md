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

Define a script-root macro at the top of every `.cushy` file and use it wherever the package folder
name appears in Cushy fields such as `file:` and `ivgFile:` references. The example packages use
`@scriptIdentifier` for the JavaScript object name and a script-name define for the title:

```makaron
@include scriptSupport.makaron
@define scriptIdentifier=myScript
@define scriptName=My Script
```

These macros only expand in `.cushy` files. The entry-point `.js` (which calls `displayCushy(...)`)
is plain JavaScript and must use the literal package path.

Renaming a script is a multi-point change — keep these in sync or action dispatch breaks:

- the `@define scriptIdentifier=<name>` in the `.cushy`,
- the top-level JavaScript global object (`if (!globals.myScript) { myScript = ... }`),
- the schema action prefix (`action: "myScript.startup"`),
- the package folder `<Name>.spscript/` and its filenames,
- the entry `.js` literal path, `displayCushy("<Name>.spscript/<Name>_main", "script", true)`,
- the `@window(...)` title, if it should match.

After a rename, search the package for the old name; remaining matches should be human-readable text,
not dispatch/schema/filename/path references.

## Reload and state

- Cushy reruns the matching `_main.js` on GUI reload, but existing globals survive a normal reload.
- All loaded scripts share one JavaScript global space while the Synplant window is open. This is why
  the JS Console and the bridge can inspect another script's globals, and why script-named namespaces
  matter.
- Over the bridge, a normal reload is `sp_eval("performCushyAction('reload')")`: it flushes cached
  resources, rebuilds the open GUI, and reruns JavaScript without replacing the engine. It does not
  close the current script window, so the bridge survives it.
- A full reset (the JS Console `reset`, or `performCushyAction('reload', 'reset')`) recreates the
  engine and clears globals. Do not drive a full reset over the bridge — it tears the bridge down.
- If interaction objects are kept across reloads they may retain old methods and closures. For
  development, recreate interaction objects on each reload and carry over only persistent user state.
- Launching a package over the bridge is asynchronous at the Cushy boundary: `displayCushy(...)`
  returns before the package's `_main.js` runs. Do not assert the package global in the same
  `sp_eval`; check it in a follow-up eval. Inspect which script window is open with
  `sp_eval("getDisplayedCushy('script')")`, and confirm the scripts root with `sp_eval("DIRS.SCRIPTS")`.

## Timed actions and animation

A GUI script gets periodic callbacks by registering a repeating action in the root `autoexecs` block.
Use it for animation, polling, or any time-based behavior. Each action must return quickly — the UI
freezes while script code runs, and a single call over 20 seconds is suspended.

```cushy
autoexecs: {
    { action: "@scriptIdentifier.tick", repeat: 1/@fps }
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

### View redraw and vector caching

- Cushy uses dirty-rectangle redraws and occlusion culling; drawing outside a view's bounds is clipped
  and the clipped work is not done. Hidden/invisible views usually cost little unless their state
  depends on heavy variable refreshes.
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
- Call `saveUndo(description)` **before** mutating patch state — the snapshot is the state the user
  returns to. For a continuous gesture, save undo on the first document-changing update and guard
  further drag updates until release, giving one undo entry per gesture. `saveUndo(..., collapse)` is a
  UX choice: `collapse: true` merges repeated same-description actions into one undo item.
- `saveUndo` captures Synplant document state, not your script's JavaScript state. After undo/redo,
  derive script state from the patch where possible (e.g. re-read on `getElementId('patch')` change)
  rather than assuming your cached GUI state still matches.

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

## All text requires an explicit font

Cushy has no default font. Any text — `caption` views, button `caption` fields (via `font` in the
button style), bubble styles — is not drawn at all without an explicit `font`. There is no fallback.

```cushy
{ type: "caption", text: "...", font: { ivgfont: "sans-serif", size: 13, color: "..." } }
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

@window(left, top, width, height, "@scriptName", @backgroundColor, @frameColor, white, @scriptIdentifier, @<
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
  references): reference them with `file: "name"` (no extension). External files are easier to review
  and test in isolation; inline snippets are not.
- **Colors:** `none` is transparent; `rgb(r,g,b,a)` uses normalized components (`rgb(1,1,1,0.35)`, not
  0–255); CSS-style `rgba(...)` is not valid IVG.
- **Font coverage:** the built-in `sans-serif` does not cover all Unicode. Use printable ASCII
  (U+0020–U+007E) in GUI-variable return values and captions; characters like the em-dash `—` render
  as replacement boxes. Use `-` or `...` instead.

See [`docs/IVG Documentation.md`](../../docs/IVG%20Documentation.md) for the IVG language.

## File extensions and `dir()` scanning

Common Synplant file types: patches are `.synplant` (legacy `.synp`), MIDI configurations are `.scmc`,
and GUI script packages are `.spscript` directories. `browse` also recognizes audio types (`wav`,
`wave`, `aiff`/`aif`/`aifc`/`afc`) for Genopatch references.

**`dir()` with an extension filter excludes directories.** When `dir(path, filter)` is given an
extension filter, only matching files are returned — subdirectories are dropped, which silently breaks
recursive scanning. When a scan must recurse, call `dir(path)` with **no filter** and test the
extension manually on non-directory entries:

```javascript
function scanDir(path) {
    var entries = dir(path);              // no filter — directories are included
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

An extension filter is safe only for known-flat directories where no subdirectories need traversing.
