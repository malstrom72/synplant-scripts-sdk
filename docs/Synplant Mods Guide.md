# Synplant Mods Guide

A **Mod** is a special kind of Synplant script that modifies Synplant's *own* built-in interface at
load time, rather than opening a window of its own. Mods can add buttons, menus, and behavior to the
main GUI by rewriting Synplant's interface definitions as they are loaded and by adding JavaScript
that the new interface elements call.

This guide was written and verified against **Synplant 2.0.2 (build 309)**. It assumes familiarity
with the *Synplant JS Reference* (for the JavaScript API) and the `.cushy` layout format described by
`CushyLint/cushy.schema`.

## Table of Contents

-   [What a Mod is](#what-a-mod-is)
-   [Mods are the least sturdy script type](#mods-are-the-least-sturdy-script-type)
-   [Installing and running Mods](#installing-and-running-mods)
-   [How Mods work](#how-mods-work)
-   [Registering a patcher](#registering-a-patcher)
-   [Rewriting interface source](#rewriting-interface-source)
-   [Adding JavaScript: the `mods` namespace](#adding-javascript-the-mods-namespace)
-   [Monkey-patching the interface's JavaScript](#monkey-patching-the-interfaces-javascript)
-   [A worked example](#a-worked-example)
-   [Bundled example Mods](#bundled-example-mods)
-   [Practical guidance](#practical-guidance)

## What a Mod is

Synplant's own interface is built from the same technologies a script uses: `.cushy` layout files,
GUI variables, GUI actions, and JavaScript. A Mod hooks into the moment those built-in layouts are
loaded and **rewrites their source text before it is parsed**, splicing in new views and behavior.
Because the change happens at load time, a Mod's additions look and behave like a native part of
Synplant.

A Mod differs from the other two script types in three ways:

-   It runs **automatically at startup**, with no menu selection.
-   It modifies the **built-in** interface instead of opening its own window.
-   Its effect is **persistent** for the session — it is woven into Synplant's GUI until the engine
    is reset.

## Mods are the least sturdy script type

Of the three kinds of Synplant script, Mods carry the most compatibility risk, because of how much
of Synplant's internals each kind depends on:

-   **No-GUI single `.js` scripts** are the most robust. They use only the JavaScript API (the
    functions, parameters, and patch model in the *Synplant JS Reference*), which is a deliberate,
    stable contract. A script that just reads and writes patches will keep working across releases.
-   **GUI scripts (`.spscript`)** sit in the middle. They rely on the `.cushy` format and the GUI
    variable/action conventions as well as the JavaScript API. Those are stable in spirit, but the
    Cushy format and conventions *might* change between releases, so a GUI script may occasionally
    need a touch-up.
-   **Mods are the most fragile.** A Mod reaches into Synplant's *own* built-in interface — its exact
    `.cushy` source text and the JavaScript its layouts define. None of that is a published contract;
    it is internal implementation that **is expected to change with new releases**. A Synplant update
    can move an anchor, rename a layout, or restructure the JavaScript a Mod wraps, and the Mod will
    break.

This is not a reason to avoid Mods — they can do things nothing else can — but it sets expectations:
write Mods defensively, fail loudly when an assumption no longer holds (see
[Practical guidance](#practical-guidance)), and be prepared to update them when Synplant updates. If
the same goal can be met with a GUI script or a plain `.js` script, prefer that.

## Installing and running Mods

Mods live in a folder named `Mods` inside the Synplant Scripts folder (`DIRS.SCRIPTS`; reachable via
**Open Scripts Folder** in Synplant's script menu):

    <Synplant Scripts>/
        Mods/
            Favorite Button.js
            Detailed DNA Hints.js
            ...

When Synplant starts and a `Mods` folder exists, **every `.js` file directly inside it is run
automatically**, in alphabetical order. There is no separate "enable" step — presence in the folder
is what activates a Mod. Removing the file (and reloading) removes the Mod.

> If there is no `Mods` folder, the modding machinery is not installed at all: the
> `handleCushyPreparation` hook and the global `mods` object are simply absent. Adding the folder and
> reloading activates them.

## How Mods work

Two pieces cooperate:

1.  **Patchers** rewrite interface source. A Mod registers one or more *patcher* functions, each
    targeting a named built-in layout (for example `'Synplant2_main'` or `'Synplant2_dna'`). When
    Synplant loads that layout, the engine calls the global hook `handleCushyPreparation`, which runs
    the registered patchers and uses their rewritten text in place of the original.

2.  **The `mods` namespace** holds JavaScript behavior. The new views a patcher injects refer to GUI
    variables and actions by name; a Mod defines those under the global `mods` object so the injected
    interface has something to call.

The hook itself is installed for you when a `Mods` folder is present — you never define
`handleCushyPreparation` yourself. You only register patchers and populate `mods`.

Beyond rewriting layout source, a Mod can also **monkey-patch JavaScript**. A Mod's `.js` runs after
the interface's own JavaScript has executed, so by the time your Mod code runs, the functions and
objects that the running layouts defined already exist as globals. A Mod can therefore wrap or
replace them — capturing the original and substituting its own behavior — in addition to (or instead
of) splicing views into the layout source. See
[Monkey-patching the interface's JavaScript](#monkey-patching-the-interfaces-javascript).

## Registering a patcher

A Mod registers a patcher with the global function `addModPatcher`:

    function addModPatcher(modName: string, cushyName: string,
            patcher: function(cushyName: string, cushyContents: string) : string | undefined) : void

-   `modName` — a label for your Mod, used in trace and error messages.
-   `cushyName` — the built-in layout to target, without extension (e.g. `'Synplant2_main'`).
-   `patcher` — called with the layout name and its raw source text. It returns the **modified**
    source, or `undefined` to leave the layout unchanged.

A single Mod may register several patchers, for the same layout or different ones. Multiple Mods may
patch the same layout; their patchers run in turn, each receiving the output of the previous one.

**Important:** if a patcher returns a string that is *identical* to its input, the engine treats that
as a mistake (a patch that found no anchor and changed nothing) and throws an error naming your Mod.
A patcher must either change the text or return `undefined`.

## Rewriting interface source

A patcher receives the layout's raw `.cushy` / macro source as a string and returns a new string.
The usual technique is to locate stable anchor points and splice text around them with ordinary
string and regular-expression operations:

```javascript
addModPatcher('My Mod', 'Synplant2_main', function (cushyName, cushyContents) {
    var anchor = '{ type: "raster" blend: "add" image: "patchspecular" }';
    var i = cushyContents.indexOf(anchor);
    if (i < 0) {
        throw new Error('anchor not found');   // fail loudly if the layout changed
    }
    var injected = '{ type: "button" bounds: { 202, 7, 20, 20 } /* ... */ }\n';
    return cushyContents.slice(0, i) + injected + cushyContents.slice(i);
});
```

Because the input is the source *before* macro expansion, you can also inject macro definitions
(`@define …`) and macro calls, and adjust existing layout expressions. Injected views can carry their
own `vector:` (IVG) graphics, `actions:`, `hint:`, and so on — anything the `.cushy` format supports.

Throw an explicit error whenever an anchor is missing or a replacement does not take effect. A Mod
that silently does nothing is hard to diagnose; a Mod that throws tells the user exactly which anchor
broke (typically after a Synplant update moved it).

## Adding JavaScript: the `mods` namespace

Views injected by a patcher reference GUI variables and actions by name. Define those under the
global `mods` object so they resolve. By the time your Mod runs, `mods` already exists.

```javascript
mods.myMod = {
    doThing: {
        execute: function () { /* ... */ },
        checked: function () { return /* ... */; },
        enabled: function () { return /* ... */; },
        hint:    function () { return translate('Does the thing'); }
    }
};
```

Your injected `.cushy` then binds to these, e.g. an action `"mods.myMod.doThing"` or a hint
`"[var]mods.myMod.doThing.hint[/var]"`. Because everything lives under `mods.myMod`, it stays clear
of other Mods and of Synplant's own globals. A Mod may also read and drive the patch through the
normal JavaScript API (`getElement('patch')`, `setElement('patch', …)`, `getParam`, `saveUndo`,
file functions, etc.).

## Monkey-patching the interface's JavaScript

Rewriting layout source is the right tool for changing the *interface*. For changing *behavior*, a
Mod can reach into the JavaScript the running interface has already defined and wrap or replace it.
Because a Mod's `.js` runs after the host layout's `.js` has executed, those globals are in place when
your Mod runs.

The pattern is to capture the original function and install a replacement that calls through to it:

```javascript
// Wrap an existing interface function with extra behavior.
var originalDoThing = globals.someInterfaceFunction;
globals.someInterfaceFunction = function () {
    // ... your behavior before ...
    var result = originalDoThing.apply(this, arguments);
    // ... your behavior after ...
    return result;
};
```

Guard for the function actually existing first (`if (typeof globals.someInterfaceFunction ===
'function')`), since the name you are wrapping is internal and may differ between releases — this is
exactly the fragility discussed [above](#mods-are-the-least-sturdy-script-type). Monkey-patching JS
and rewriting layout source are complementary: a Mod commonly does both — splice a button into the
layout, and have its action call into wrapped or new JavaScript.

## A worked example

The bundled **Favorite Button** Mod adds a star button to the patch display that saves the current
patch into a "Favorites" folder, with a right-click menu to recall favorites. It shows the full
pattern:

1.  **Set up storage** using script file functions, under the script-writable user-documents folder:

    ```javascript
    var favoriteFolder = DIRS.DOCUMENTS + 'Synplant User Patches' + DIR_SLASH + 'Favorites' + DIR_SLASH;
    if (fileInfo(favoriteFolder) === null) {
        makeDir(favoriteFolder);
    }
    ```

2.  **Define behavior** under `mods` — a `markFavorite` action with `execute`/`checked`/`enabled`/
    `hint`, plus helpers to list and load favorites and build the context menu:

    ```javascript
    mods.favoriteButton = {
        markFavorite: {
            checked: function () { /* is current patch already a favorite? */ },
            execute: function () {
                var patch = getElement('patch');
                save(favoriteFolder + splitPath(patch.path)[1] + '.synplant', marshal('patch', patch, true));
                displayHint(translate('Added to Favorites folder'));
            },
            enabled: function () { /* only when a saved, unmodified patch is current */ },
            hint:    function () { /* contextual hint text */ }
        },
        loadFavorite: function (name) { /* load a chosen favorite */ },
        contextMenu:  function () { /* build the right-click menu of favorites */ }
    };
    ```

3.  **Register a patcher** for `Synplant2_main` that injects the button into the patch display,
    anchored on existing markers in the layout, and injects an `@define` for its width so the display
    makes room:

    ```javascript
    addModPatcher('Favorite Button', 'Synplant2_main', function (cushyName, cushyContents) {
        var offset = cushyContents.indexOf('// Patch display');
        if (offset === -1) { throw new Error('Patch display comment not found'); }
        // ... insert "@define favoriteStarWidth = 24", shrink the display bounds,
        // and splice a { type: "button" ... vector: { code: "...star IVG..." } ... } view
        // before the "patchspecular" raster, wiring its actions to mods.favoriteButton ...
        return cushyContents.slice(0, offset) + patched;
    });
    ```

The same Mod also registers a second, tiny patcher for `Synplant2_legacyMode` that nudges an icon
offset — a reminder that one Mod can patch several layouts.

## Bundled example Mods

Four Mods ship as examples and are good reading:

-   **Favorite Button** — adds a "favorite" star to the patch display and a Favorites folder
    (patches `Synplant2_main` and `Synplant2_legacyMode`). The fullest example.
-   **Detailed DNA Hints** — patches `Synplant2_dna` to show richer, value-aware hints for the genes.
-   **Graft Onto Branch** — adds a patch operation that grafts material onto a selected branch
    (patches `Synplant2_main`). See the JS Reference sections on
    [explicit branch morphs](Synplant%20JS%20Reference.md#explicit-branch-morphs) and
    [grafting](Synplant%20JS%20Reference.md#grafting) for the patch-model details behind it. The Mod
    vendors a copy of the reusable source snippet [`snippets/grafting.js`](../snippets/grafting.js)
    so the example remains self-contained.
-   **Tween Branches** — adds an operation that interpolates between branches (patches
    `Synplant2_main`).

## Practical guidance

-   **Anchors are version-sensitive.** A patcher matches on the exact text of a built-in layout, so a
    Synplant update can move or rename an anchor and break the Mod. Always throw a clear error when an
    anchor is missing, and choose the most stable anchors you can (comments and distinctive view
    blocks tend to last).
-   **Keep `mods` tidy.** Put everything under `mods.<yourMod>` and never overwrite another Mod's
    entry.
-   **Use the patch API, not text hacks, for patch data.** Rewrite interface source only for the
    interface; read and modify the patch through `getElement`/`setElement` and the parameter
    functions, and bracket changes with `saveUndo`.
-   **Persist under `DIRS.DOCUMENTS`.** That is the folder a script may write to without a permission
    prompt (see the JS Reference, File Access and Permissions).
-   **Reload to iterate.** Reloading the GUI re-runs the built-in layouts and therefore re-applies
    patchers. A full engine reset clears Mods until the next startup re-reads the `Mods` folder.
