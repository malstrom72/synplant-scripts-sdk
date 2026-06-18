# ChatGPT Agent Instructions

Use the canonical Synplant Script Writer instructions in:

```text
agents/synplant-script-writer/instructions.md
```

Use this repository as the source of truth. Inspect the files listed in:

```text
agents/synplant-script-writer/source-map.md
```

When the JS Console bridge is available, verify SDK details against the live engine with `sp_status`
and `sp_eval` instead of relying on memory. For `.spscript` packages with `.cushy` files, follow:

```text
agents/synplant-script-writer/validation.md
```

Do not rely on memory for SDK-sensitive details when the repository contains the relevant
documentation, schema, or example.
