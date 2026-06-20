# Validation

Two kinds of checking matter for Synplant scripts: **static** checks (JavaScript syntax, `.cushy`
schema conformance) and **live** checks (does it actually behave in Synplant). The live bridge is the
strongest tool available and should be the primary verification.

## Live verification (preferred)

When the bridge MCP server is configured and the JS Console is open with `bridge on`, verify against
the running engine:

- `sp_status` → expect `attached: yes`.
- `sp_eval("run('My Script.spscript/My Script.js')")` to launch a script (or toggle its window).
- `sp_eval("getDisplayedCushy('script')")` to see which script window is open.
- `sp_eval("performCushyAction('reload')")` to re-run edited files and rebuild — the bridge survives a
  normal reload. Do not drive a full reset over the bridge.
- Read state and parameters directly, e.g. `sp_eval("getElement('patch').genome.flt_freq")`.

Keep eval snippets small and side-effect-free unless the user asked for a change; each eval freezes
the UI and is bounded by the ~20 s suspension limit. See
[`tools/jsconsole-bridge-mcp/README.md`](../../tools/jsconsole-bridge-mcp/README.md) and
[`vibe-coding.md`](vibe-coding.md).

### GUI render checks

The bridge verifies JavaScript behavior, not pixels. These signals are useful for logic and routing
but do not prove the `.cushy` rendered correctly:

- `getDisplayedCushy('script')` reports the current script-layer layout path. It does not prove that
  the layout parsed, drew, or contains visible text.
- A package's `_main.js` may run and create its global object even if the companion `.cushy` layout
  has a parse/render problem.
- Calling a script's JavaScript methods over the bridge tests script logic, not the on-screen view
  tree.

Cushy/Makaron parse errors are shown in native modal OS dialogs outside the Cushy layer system. There
is no known bridge API for reading those dialogs. Missing fonts, clipped bounds, bad IVG drawing,
wrong z-order, stale resources, parse dialogs, and other render-only issues require looking at the
actual Synplant window.

To check that the TypeScript `GenomeParamId` union still matches the live engine's `GENES` array,
capture the live gene names and run the SDK drift check:

```text
sp_eval("JSON.stringify(GENES.map(function (g) { return g.NAME; }))")
```

Save the returned JSON array to a temporary file, then run:

```sh
node tools/check-genome-param-ids.js /path/to/live-genes.json
```

## JavaScript syntax

Synplant's engine is ECMAScript 3 with a few additions (string indexing, `JSON`, `Object.assign`,
`Array.isArray`, `Date.now`). Generated `.js` must be written as Synplant scripts, not modern
browser/Node code. Reject `let`/`const`, arrow functions, classes, template literals, destructuring,
modules, and async. If you have a linter available, an ESLint pass configured for ES5 script syntax is
a reasonable static gate (it accepts the trailing-commas/reserved-word-property style the engine
tolerates while rejecting ES6+). A syntax pass does not prove runtime correctness — confirm that with
the bridge.

## `.cushy` validation with CushyLint

`.cushy` files are validated against [`CushyLint/cushy.schema`](../../CushyLint/cushy.schema) plus a
product schema and any package-local `.schema`. The intended command form is:

```sh
CushyLint/CushyLint "$(pwd)/My Script.spscript/"
```

Pass a directory path with a trailing slash so companion `.schema` files resolve.

The `CushyLint` runner builds its `PikaCmd` engine from the vendored source
([`CushyLint/support/PikaCmd/`](../../CushyLint/support/PikaCmd)) on first run, so a C++ compiler is
needed the first time on a platform without the prebuilt binary (an arm64-macOS binary is included).
The product schema is [`Synplant Resources/Synplant2.schema`](../../Synplant%20Resources/Synplant2.schema)
(which pulls in the standard host actions from [`CushyLint/chimera.schema`](../../CushyLint/chimera.schema));
package `.schema` headers include it. The first run also compiles the schema, so it is slower than later runs. A CushyLint pass
confirms `.cushy` syntax and schema conformance only — never runtime behavior; verify that with the
live bridge and by looking at the real window, and do not claim a pass you did not actually run.

CushyLint reads the current file from disk. Synplant may still be using cached resources from before
your latest edit while the window is open. If CushyLint says the file is valid but Synplant still
shows an older parse error, run `sp_eval("performCushyAction('reload')")` or use the JS Console reload
button, then test again.

## Package schema header

Each `.spscript` package should include a package-local `.schema` next to its main `.cushy`. It
declares the product schema include, the package's resource roots, and any custom actions/views.
Paths are relative to the `.schema` file. The example packages use this shape:

```schema
include:   <rel>/Synplant2.schema      // the product schema (provides <synplant2Action> / product views)
resources: ../
resources: <rel>/<resources-folder>

<actions> = <synplant2Action>
        | { action: "myScript.doThing", params: ... }

<view> = <synplant2View>
```

Adjust `<rel>` to wherever the product schema lives in the project. Declare resource roots in the
schema (not only on the CushyLint command line) so editor integrations resolve `@include
scriptSupport.makaron`, `file:` references, and built-in resources consistently.

For scripts developed outside this SDK checkout, schema paths must match where the package actually
lives. The bundled examples use `../../Synplant Resources/...` because they live under
`examples/<Name>.spscript/` inside the SDK. In the recommended separate-project layout, packages live
under `scripts/<Name>.spscript/`, so a newly created package schema should point back to
`../../references/synplant-scripts-sdk/Synplant Resources/...` from the start. See
[`vibe-coding.md`](vibe-coding.md) for the project-layout header.

The same rule applies to SDK packages copied into project `scripts/`. For example, if
`JS Console.spscript` is copied from `references/synplant-scripts-sdk/JS Console.spscript` to
`scripts/JS Console.spscript`, rewrite the copied `scripts/JS Console.spscript/JSConsole.schema`
header to:

```schema
include: ../references/synplant-scripts-sdk/Synplant Resources/Synplant2.schema
resources: ../
resources: ../references/synplant-scripts-sdk/Synplant Resources
```

Do not make `scripts/Synplant Resources/` to satisfy the copied schema's original SDK-relative paths.
That directory should not exist in the project scripts folder; the correct fix is to point the copied
`.schema` file back to the SDK checkout under `references/`.

The `include:` line brings in Synplant-specific view and action definitions. The `resources: ../`
line lets package-local file references resolve through the package's parent directory. The
`resources: <rel>/Synplant Resources` line lets `@include scriptSupport.makaron` and built-in
resources such as `rectDropShadow` resolve. Declare these resource roots in the schema, not only
through a CushyLint command-line argument, so editor integrations resolve includes and file references
consistently.

## What validation does and does not prove

- A clean syntax/schema check confirms the `.js`/`.cushy` parse and conform — not that the script
  behaves correctly inside Synplant.
- CushyLint validates the current on-disk files; it does not model Synplant's runtime resource cache.
- CushyLint does not flag text-bearing views/styles that omit `font`; those are schema-valid but draw
  blank in Synplant.
- CushyLint does not validate or rasterize IVG drawing code. Check IVG against
  [`docs/IVG Documentation.md`](../../docs/IVG%20Documentation.md) and known-working example resources.
- The authoritative behavioral check is running it in Synplant — over the bridge when possible.
