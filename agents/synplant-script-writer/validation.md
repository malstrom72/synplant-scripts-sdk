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

> **Tooling status in this SDK snapshot.** Two pieces the linter needs are not yet vendored here:
> the `PikaCmd` binary the `CushyLint` runner invokes (only `MakaronCmd` is present, arm64), and the
> Synplant product schema (`Synplant2.schema`) that package `.schema` headers include. Until those are
> added, CushyLint will not run end-to-end in this checkout. In the meantime: check `.cushy` syntax by
> hand against `cushy.schema` / `chimera.schema` and the example packages, and verify behavior with
> the live bridge. Do not claim a CushyLint pass you could not actually run.

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

## What validation does and does not prove

- A clean syntax/schema check confirms the `.js`/`.cushy` parse and conform — not that the script
  behaves correctly inside Synplant.
- CushyLint does not validate or rasterize IVG drawing code. Check IVG against
  [`docs/IVG Documentation.md`](../../docs/IVG%20Documentation.md) and known-working example resources.
- The authoritative behavioral check is running it in Synplant — over the bridge when possible.
