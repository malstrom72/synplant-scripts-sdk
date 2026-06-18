# Synplant Script Examples

The `examples/` folder contains complete, working Synplant scripts to learn from and adapt. They
range from a few lines to full GUI tools, and together they exercise most of the scripting API. This
document is a guided index: what each example does and which techniques it shows.

Some of these scripts ship to Synplant users; others are included here only as examples and have not
been released. That status is noted for each — an unreleased example is still valid and instructive,
it simply is not something an end user would already have.

For the APIs referenced below, see the *Synplant JS Reference*; for the three script types
(standalone `.js`, GUI `.spscript`, and Mods) see that document's Cushy Interface section; for Mods
specifically see the *Synplant Mods Guide*.

## Table of Contents

-   [Released examples](#released-examples)
    -   [Skin Chooser](#skin-chooser)
    -   [Export All Genopatch Solutions](#export-all-genopatch-solutions)
    -   [Mods](#mods)
-   [Other examples](#other-examples)
    -   [Four Knobs](#four-knobs)
    -   [Genobatch](#genobatch)
    -   [Tuning Fork](#tuning-fork)
    -   [Inverse Plant](#inverse-plant)
    -   [Tween Branches](#tween-branches)

## Released examples

These ship with Synplant.

### Skin Chooser

`Skin Chooser.spscript` — **GUI script.** Presents the skins found in `DIRS.SKINS` as a scrollable
grid and applies the one the user picks. It first checks that the skins folder is reachable and warns
clearly if not:

```javascript
if (!(function () { try { dir(DIRS.SKINS) } catch (x) { return false; } return true; })()) {
    display('"Synplant Skins" folder is missing.\n\n... ' + DIRS.SKINS);
} else {
    displayCushy('Skin Chooser.spscript/SkinChooser_main', 'script', true);
}
```

Shows: directory listing with `dir`, a configurable grid GUI driven by Numbstrict parameters
(`parseNumbstrict`), smooth scrolling, and applying a choice back to the host.

### Export All Genopatch Solutions

`Export All Genopatch Solutions.js` — **standalone `.js`.** After a Genopatch search, walks every
stalk and solution and exports them. It guards its preconditions first — that Papageno is initialized
and a reference is loaded — and reports clearly when they are not:

```javascript
if (!papageno.isInitialized()) { display('Please run Genopatch first.'); return; }
if (papageno.getReferenceInfo() === null) { display('Please load a reference sound first.'); return; }
```

Shows: driving the `papageno` (Genopatch) API from a script — enumerating stalks/solutions and
saving their patches.

### Mods

The four bundled Mods — **Favorite Button**, **Detailed DNA Hints**, **Graft Onto Branch**, and
**Tween Branches** — live in `examples/Mods/`. They patch Synplant's own interface at load time. They
are documented in full in the *Synplant Mods Guide*; start with **Favorite Button** as the most
complete worked example.

## Other examples

These are included as examples only and have not been released.

### Four Knobs

`Four Knobs.spscript` — **GUI script.** Exposes four "macro" knobs that morph the genome along random
direction vectors, turning 48 genes into four expressive controls:

```javascript
function randomVector() {
    var v = [];
    for (var i = 0; i < GENES.length - 5; ++i) { v[i] = random.normal(0.0, 1.0); }
    return v;
}
```

Shows: working with the genome through `GENES`, generating random vectors with the `random` helper,
`createClass`, and a compact knob GUI.

### Genobatch

`Genobatch.spscript` — **GUI script.** Batch Genopatch: point it at a folder of audio files and a
destination, and it runs a Papageno search on each file and saves the resulting patches, with a
progress display and an error report.

Shows: iterating files with `dir`, running the `papageno` engine repeatedly, long-running work with
its own progress display, and structured result reporting.

### Tuning Fork

`Tuning Fork.spscript` — **GUI script.** Plays a steady reference tone you can toggle on and off,
using a preview patch:

```javascript
enable:  function () { tuningFork.isEnabled = true;  setPreview(tuningFork.previewPatch); },
disable: function () { tuningFork.isEnabled = false; setPreview(); },
```

Shows: auditioning a patch with `setPreview` and a minimal toggle GUI.

### Inverse Plant

`Inverse Plant.js` — **standalone `.js`.** Operates on the currently selected branch, producing an
"inverted" plant from it.

Shows: reading the current patch and selected branch, computing a transformed result, and bracketing
the change with `saveUndo` — a good template for a one-shot patch operation.

### Tween Branches

`Tween Branches.js` — **standalone `.js`.** Interpolates ("tweens") between branches of the current
patch. A Mod variant of the same idea also ships (see the Mods Guide); comparing the two is a useful
illustration of the difference between a one-shot script and a Mod that adds the operation to
Synplant's own interface.

Shows: branch math against `BRANCH_COUNT` and the patch `branches` array, applied as an undoable
edit.
