# Packaging Guidance

Synplant has three script shapes. Choose by what the request needs; do not default to a GUI package.

## Single-file `.js` scripts

Use a single JavaScript file for a direct utility, generator, patch operation, or other command with
no custom interface. It runs when chosen from Synplant's script menu. This is the default for simple
requests and the most robust shape — it depends only on the JavaScript API.

## `.spscript` GUI packages

Use a `.spscript` package when the user asks for a custom GUI, a persistent tool window, Cushy
controls/variables/actions, or a stateful reusable tool. A package is a directory:

```text
My Script.spscript/
  My Script.js            # launcher: displayCushy('My Script.spscript/MyScript_main', 'script', true)
  MyScript_main.cushy     # the layout
  MyScript_main.js        # sets up variables and action functions (run when the layout opens)
  MyScript_main.schema    # package schema for CushyLint (see validation.md)
  ...                     # optional .ivg, images, resources
```

Treat `.spscript` examples as directories; inspect their internal files before adapting one.

Package `.schema` paths are relative to the `.schema` file itself. When creating a package in the
recommended separate project layout (`scripts/My Script.spscript/` plus
`references/synplant-scripts-sdk/`), create the schema with project-correct paths from the start:

```schema
include: ../../references/synplant-scripts-sdk/Synplant Resources/Synplant2.schema
resources: ../
resources: ../../references/synplant-scripts-sdk/Synplant Resources
```

The bundled SDK examples use `../../Synplant Resources/...` because they live under
`examples/<Name>.spscript/` inside the SDK checkout. Do not copy that header unchanged into a
different directory depth.

Package-local resources are still resolved from the schema's `resources:` roots, not from the
`.cushy` file's directory. If a file sits next to the layout in `My Script.spscript/Icon.ivg`, refer
to it through the package folder, for example `ivgFile: "My Script.spscript/Icon"` or
`file: "My Script.spscript/Icon"`, not just `"Icon"`.

Package directory names and package-local launcher/layout filenames may contain spaces. Use the exact
package path in `displayCushy`, `file:`, and `ivgFile:` references, for example
`displayCushy('Patch Stack.spscript/Patch Stack_main', 'script', true)`. Keep JavaScript globals,
Cushy action names, and schema action names identifier-safe, e.g. a visible package named
`Patch Stack` with an internal object/action prefix such as `patchStack`.

### GUI startup pattern

- Open the window from the launcher with `displayCushy('<Name>.spscript/<Name>_main', 'script', true)`.
- Make startup rerun-safe: a GUI script's `_main.js` runs again on every rebuild (including when the
  end user changes Synplant's zoom). Guard one top-level state object created on first run, and
  reassign methods and GUI-variable handlers on reruns.
- Prefer `@include scriptSupport.makaron` and the shared `@window(...)` macro for standard window
  chrome (shadow, frame, title, close button) instead of rebuilding it from primitive views.
- Wire the close control to a real close action (`displayCushy(null, 'script')` or the script's close
  handler), not just a visual button.

## Mods

Use a Mod only when the user wants to change Synplant's **own** interface — add a button or menu to
the built-in GUI, or alter its behavior. A Mod is a `.js` file in a `Mods/` subfolder of the scripts
folder; every `.js` there runs automatically at startup. Mods rewrite Synplant's built-in `.cushy`
source as it loads and/or monkey-patch its JavaScript. They are the most powerful and the most
version-sensitive shape. See the [Mods Guide](../../docs/Synplant%20Mods%20Guide.md).
