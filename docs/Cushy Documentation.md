# Cushy

_Cushy_ is the GUI / layout engine used in Synplant. A `.cushy` file describes a window's layout as a
tree of _views_, and wires those views to your script through _GUI variables_ and _GUI actions_. This
document is an orientation: it explains the mental model and shows where each piece is documented in
full. It does not duplicate the field-by-field reference — that lives in
[`cushy.schema`](../CushyLint/cushy.schema).

Synplant's interface is built entirely on Cushy, so the same system you use for your own script
windows is the one the product itself is made of.

## Where Cushy is documented

There is no single exhaustive Cushy manual, by design. The format is large and validated against a
schema, so the schema is the canonical syntax reference and everything else routes to it:

| If you need...                                              | Read                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| The mental model and a reading order (this page)            | this document                                                                                   |
| Exact fields for a view, action, color, font, or style      | [`CushyLint/cushy.schema`](../CushyLint/cushy.schema) — the official reference                  |
| How `.cushy` connects to JavaScript (variables and actions) | [Synplant JS Reference](Synplant%20JS%20Reference.md) → _Cushy Interface_                        |
| The macro syntax used in `.cushy` files (`@define`, etc.)   | [Makaron Documentation](Makaron%20Documentation.md)                                             |
| Vector graphics drawn inside views                          | [IVG Documentation](IVG%20Documentation.md) and [ImpD Documentation](ImpD%20Documentation.md)   |
| Dynamic vector graphics and IVG/Cushy variable wiring        | [Synplant JS Reference](Synplant%20JS%20Reference.md#dynamic-vector-graphics)                    |
| Working code to copy from                                   | the scripts under [`examples/`](../examples)                                                     |

The schema is written to be read: it carries inline comments alongside every rule and serves as a
kind of official reference on `.cushy` files, available view types, and built-in actions. When exact
syntax or supported fields matter, the schema is the source of truth.

## The mental model

A `.cushy` file is a _Numbstrict_ document — a JSON-like notation with C-style comments and a few
extensions — that is expanded by Makaron macros before parsing. Conceptually it has five top-level
sections:

```
bounds:      { left, top, width, height }   // the window rectangle (main .cushy only)
autoexecs:   { ... }                        // actions run on open, close, a timer, or a variable change
transitions: { ... }                        // open/close animations
translations:{ ... }                        // string translations for this Cushy
views:       { ... }                        // the view tree — the actual UI
```

Three ideas tie the system together:

1. **Views nest into a tree.** Each view has `bounds` relative to its parent, and Cushy **clips hard
   at every view's bounding box** — nothing outside a view's bounds is drawn or clickable. Common
   view types include `group`, `caption`, `rectangle`, `button`, `knob`, `slider`, `click`, `hover`,
   `vector`, and `cluster`; the full list and every field is in the schema. Later views in a `views:`
   list are drawn on top of earlier ones, and where they handle the mouse they get it first. A
   `vector` view has no mouse handling, so clicks go to the views beneath it: decorative IVG drawn
   over an interactive view does not block it.

2. **GUI variables synchronize view state with your script.** A knob bound to
   `variable: myScript.cutoff` writes `myScript.cutoff` when the user turns it, and continuously reads
   it to redraw. Variables are always strings. A bound name can be a plain JS string, a getter
   function, an object with `get`/`set`/`touch`, or a Cushy-only variable. The exact semantics and the
   available built-in variable names are in the JS Reference's _Cushy Interface_ and the
   *Synplant Cushy Variables Reference*.

3. **GUI actions run script code from the UI.** A clicked button or menu item performs an _action_ —
   a built-in (`set`, `popup`, `edit`, `reload`, ...) or a JavaScript function you provide
   (optionally an object with `execute`/`enabled`/`checked`). Actions can also be triggered by
   `autoexecs`: on open, on close, on a timer, or when a variable changes.

### Startup and reload

A GUI script is a `<Name>.spscript/` directory. Its entry `<Name>.js` opens the window with
`displayCushy("<Name>.spscript/<Name>_main", "script", true)`. When Cushy opens `<Name>_main.cushy`,
it first runs the same-named `<Name>_main.js`, which defines the script's variables and action
functions.

Cushy **reruns that JavaScript on every reload** — and reload is not only a developer action:
changing Synplant's zoom scale also forces a rebuild. So scripts must survive their JS being re-run:
keep persistent state under a single object named after the script and guard its initialization
(`if (!globals.myScript) { ... }`) so existing globals are not reset. The reload/reset/close
lifecycle is detailed in the JS Reference's _Cushy Interface_.

## Coordinates, expressions, and scaling

**Coordinates are always integers.** View bounds and offsets are whole pixels, and they stay whole
pixels after the user's zoom level and high-DPI scaling are applied — Cushy rescales to integer
positions and never places a view on a fractional pixel.

**Synplant scales the whole UI for the end user.** A zoom setting and the display's pixel density
(standard 1x or high-DPI/Retina 2x) combine into a scale factor applied to your integer layout.
Changing the zoom forces a full GUI rebuild — the same reload that reruns your `_main.js` — so the
layout must survive reloads (see [Startup and reload](#startup-and-reload)).

> **Align to a 4-pixel grid.** Zoom steps are fractional, so small details can land between pixels
> and shift by one at some zoom levels. A feature placed on a 4-pixel boundary rescales to an exact
> integer across the common zoom levels, while a 1-, 2-, or 3-pixel detail may not. For tightly
> aligned, abutting views, align on multiples of 4.

**Math expressions are evaluated by Cushy, at construction.** Where a numeric constant is expected you
may write an expression — for example `bounds: { l+10, t+10, w-20, h-20 }` or `updateRate: $*2`, using
`$` for the field's default value and `l`/`t`/`w`/`h`/`r`/`b` for the parent rectangle (see the
repository README). These are evaluated by **Cushy when it builds the view tree** — *not* by Makaron
(which only does text substitution before parsing) and *not* by JavaScript. The result is a fixed
number baked into the view at construction time.

**Most properties are static between rebuilds.** Cushy reads view properties once when it builds the
tree; they do not change again until the next reload/rebuild. Beyond that, dynamism comes in two
grades, and it is worth deliberately choosing the more stable one:

- **Live updates without recreating views (preferred).** Fields explicitly designed to be dynamic
  accept a GUI variable (`<var>`) in the schema and update in place while the window is open. A
  `group`, for example, can move and show or hide its contents via `offset: { <var>, <var> }` and
  `visibility: <var>` (the schema notes these "do not recreate views on change"). This is cheap and
  stable. By contrast, a `caption`'s position or a `knob`'s `bounds` have no variable form and stay
  static.

  `vector` views are another in-place dynamic tool. Prefer static IVG with explicit `defines:` and
  `bindings:` when the geometry is fixed and only values such as visibility, color, or labels change.
  Treat `guiVariables: true` as a fallback for drawings that genuinely need open GUI-variable access,
  and generate the whole IVG source from JavaScript only when the drawing geometry itself is
  computed. `file:` vector source text is cached until a real reload, so editing an external `.ivg`
  file while developing requires the JS Console reload button, `performCushyAction('reload')`, or
  another GUI reload before Synplant re-reads it.

- **Non-modal script windows edit the live document.** Ordinary `.spscript` windows stay open beside
  Synplant's own UI, so controls that change the sound should call `saveUndo` and write the real patch
  or parameters directly. A preview-plus-Apply model is for auditioning or a genuinely modal flow; in
  a non-modal window it can make what the user hears differ from what Save/export and undo/redo see.

- **Rebuilding views from a source variable (`varExpansion`, least stable).** A `group` with
  `varExpansion: 'true'` treats its `views:` as a source string with `[var]myDynamicSource[/var]`
  interpolation, letting a script generate arbitrary view configurations at run time. The catch is
  that those views are torn down and recreated *every time the source variable changes* — the schema
  even notes CushyLint cannot check views under `varExpansion`. It is the most flexible and the least
  stable option; reserve it for cases that genuinely need a script-generated view tree.

  **`[var]` expansion does not nest.** Expansion is literally a single pass that rebakes the whole
  group's `views:` text and reparses it as a Cushy subtree — there is no second pass. So a child
  inside a `varExpansion` group cannot itself rely on `[var]…[/var]` (a knob `hint`, a `meta` text, an
  indirect `execute` action, etc.); the inner markers are consumed or broken by the one outer
  expansion. If you need `[var]`-driven content *inside* a var-expanding group, move that content out
  of the expanded subtree, or have the script bake the inner value into the generated source string
  directly instead of leaving a `[var]` marker for a second pass that never happens.

When something must change live, look for an in-place `<var>` field first and design around a view
that has one (often a `group`). Fall back to `varExpansion` only when you truly need a
script-generated tree, and expect a full rebuild only when nothing else fits.

**Raster resources ship at high resolution.** PNG resources are referenced by base name in `.cushy`
(`image: "myGraphic"` or `image: { name: "myGraphic" }`); Synplant resolves the file and scales it to
the current zoom and DPI. Provide a high-resolution master named `<base>_x2.png` (and, for very
high-density displays, optionally `<base>_x4.png`). Vector (`vector` / IVG) graphics and `caption` text
scale cleanly at any zoom and sidestep the resolution question entirely; prefer them where crisp
graphics matter. An image can also be drawn from IVG (`image: { ivgFile: "myGraphic" }`), which is
crisp at every zoom and needs no PNG master; see [Drawing cost](#drawing-cost) for which to choose.

## A minimal window

The smallest useful `.cushy` includes the shared support macros and uses the `@window` macro for
standard window chrome (shadow, frame, title, close button), then declares its content views. The
fragment below — one knob bound to a script variable, with a caption — follows the same conventions
as the [`examples/`](../examples) scripts:

```makaron
@include scriptSupport.makaron

@define scriptIdentifier=myScript
@define scriptName=My Script
@define backgroundColor=hsv(0.55, 0.07, 1.0)
@define frameColor=hsv(0.55, 0.4, 0.4)

@window(280, 200, 180, 120, "@scriptName", @backgroundColor, @frameColor, white, @scriptIdentifier, @<
    {
        type: "knob"
        bounds: { 60, 20, 60, 40 }
        variable: @scriptIdentifier.cutoff
        range: { 0, 1 }
        cap: { size: 40, color: "white", frame: { color: "white", stroke: 1 } }
        hint: "Cutoff = [var]@scriptIdentifier.cutoff.human[/var]"
    }
    {
        type: "caption"
        bounds: { 60, 65, 60, 15 }
        text: "Cutoff"
        font: { ivgfont: "sans-serif", size: 14, color: "white" }
        align: "center"
    }
@>)
```

The matching `MyScript_main.js` would define `myScript` with a `cutoff` value (guarded so it survives
reloads), and the launcher `My Script.js` would call
`displayCushy("My Script.spscript/MyScript_main", "script", true)`. For the full window structure,
`transitions:`/`autoexecs:` blocks, and how `@window` lays out its content, read the example scripts
end to end — they are the canonical worked references.

A few things that trip up first-time authors, all expanded in the schema or example scripts:

- **All text-bearing views/styles need an explicit `font`** — Cushy has no default font. Text in
  `caption` views, button captions, bubble styles, and any other text-bearing view/style is simply
  not drawn unless that view or style provides a `font`.
- **Coordinates are clipped at view bounds** — a child cannot draw or receive clicks outside its
  parent.
- **Colors use normalized components** — `rgb(1,1,1,0.35)`, not `rgb(255,255,255,...)`.
- **Keep `.cushy` source ASCII** unless you have tested the exact character path.

## Performance

Cushy has no change notifications. It polls: on refresh ticks every view asks its GUI variables for
their values and its actions whether they are enabled and checked, and redraws only if something
differs from what it drew last. Getters therefore run for as long as the window is open, and drawing
cost depends on the kind of view. How much this matters for a given window depends on its size and
contents, so check it in Synplant.

### How often views poll

Synplant refreshes its plug-in window, and the script windows open in it, every 20 ms (50 times a
second) when it is the most recently used Synplant window (the instance last focused or clicked),
every 40 ms when it is visible but another Synplant instance was used more recently, and every 100 ms
when it is hidden. Each view paces itself: right after a change it polls on every tick, and while
nothing changes it slows down step by step to every 5th tick. A steady view in the most recently used
window still polls about 10 times a second.

Hidden views are not refreshed and poll nothing: a hidden view, everything inside a hidden group, and
the pages a `paged` view is not showing. A sub-cushy on a hidden page does not even load its layout
until the page is shown. The group or `paged` view itself keeps polling its own `visibility`, `offset`
or index variable. Views that are only scrolled or clipped out of sight inside a visible group still
poll.

Some polling ignores the pace:

- Every mouse click, right click and context click in a window makes every view in it poll at once.
- `onChanged` autoexecs look up all their variables on every refresh, so keep those lists short.
- `repeat` autoexecs run at their own rate, whether or not anything changed.
- The `vector` of a button, and a knob or slider cap drawn with `vector`, re-reads every variable its
  IVG read on every tick, without slowing down. It reruns the IVG and redraws only when one of them
  changed, so the cost is the lookups: keep the variables such a vector reads few and cheap.

Two views bound to the same variable call its getter twice; nothing caches values within a tick. A
JavaScript getter or action state function therefore runs up to 50 times a second per view that uses
it, and again on every click. See the JS Reference's
[Performance Notes](Synplant%20JS%20Reference.md#performance-notes) for what that means for scripts.

### What polling costs

- An unchanged value costs only the lookup. A view invalidates and redraws only when the value differs.
- Built-in variables such as `params.*` and the patch fields are cheap: they read a copy taken once
  per tick.
- `preferences.<key>` is not cheap: every lookup reads the preferences store from disk. Do not bind it
  to many views; read it once into a script variable instead.
- A `vector` view reruns its whole IVG whenever a variable it read changes. Between runs it looks up
  each variable the last run read, by name, on every paced check. `bindings:` and `guiVariables: true`
  cost the same here, so choose between them for clarity.
- A group with `varExpansion: 'true'` re-parses its whole `views:` text on every paced tick, and a
  change rebuilds all its children, which loses their state and reruns their autoexecs.

### Drawing cost

Per repaint, cheapest first:

1. A `raster` view or an image field (`image:`, a button `icon:`), whether from a PNG or from IVG. The
   image is built once and blended, clipped to the area being repainted.
2. A static `vector` view once its cache is built. It blends a run-length compressed copy of its
   drawing, over its whole bounds even when only part of it is repainted.
3. A `vector` view during its first draws, or one whose variables keep changing. It runs its whole IVG
   on every draw, through an extra offscreen buffer when `blend` is not `"normal"` or `opacity` is not
   100%.

**Vector view cache.** The first 5 draws after a view is created, or after its cache was dropped, run
the IVG. The 6th draws into an offscreen buffer and keeps a compressed copy, and later draws only blend
that copy. A change to the source, to a variable the last run read, or to the view's size drops the
cache and starts the count again. Moving the view or its group, or covering it, does not. A view that
is never repainted never builds its cache.

**Images from IVG.** An image given as `ivgFile:` or `ivgCode:` (with optional `defines:`) is rendered
at the final pixel size, so it is crisp at every zoom and display density. It is rendered once per
distinct image (source, `defines:`, format and scale), and every view that asks for the same image
shares it. Its IVG cannot read Cushy variables; use a `vector` view for that.

The image cache is shared by all Synplant instances and is cleared on every reload, including the
reload that a zoom change causes. The same reset re-reads `file:` IVG sources.

Choosing a graphic:

- **Fixed vector art** (icons, frames, gradients, decorations): an image from IVG, in a `raster` view
  or a button `icon:`. It is as cheap as a PNG to draw, crisp at any scale, and needs no master file.
- **Photographic or bitmap art:** a PNG with an `_x2` master. It is resampled from the nearest `_x2`
  or `_x4` master, so it is crisp only when the scale matches one exactly.
- **Graphics that follow variables:** a `vector` view with `bindings:`. Keep views that change often
  small, and split a large drawing so that the static part sits in its own view or image.

## Validating what you write

Numbstrict is easy to get subtly wrong in deeply nested view trees, so run **CushyLint** against your
files before loading them in Synplant:

```sh
CushyLint/CushyLint "$(pwd)/My Script.spscript/"           # macOS / Linux
CushyLint\CushyLint.bat "%cd%\My Script.spscript/"         # Windows
```

Pass a directory path **with a trailing slash** so the companion `.schema` files next to your
`.cushy` are picked up. CushyLint checks syntax and schema conformance; it does not predict runtime
performance — measure that in Synplant (see [Performance](#performance)). See the repository README for CushyLint details and
[`cushy.schema`](../CushyLint/cushy.schema) for what it validates against.
