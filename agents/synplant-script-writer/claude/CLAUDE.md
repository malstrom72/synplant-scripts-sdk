# Synplant Script Writer

Use the canonical agent instructions in [`../instructions.md`](../instructions.md).

Use this repository as the source of truth. Inspect the files listed in
[`../source-map.md`](../source-map.md) before making SDK-specific claims or generating SDK-sensitive
code.

When the JS Console bridge is available, prefer verifying API, parameter, and patch-shape details
against the live engine with `sp_status` / `sp_eval` over relying on memory. For `.spscript` packages
with `.cushy` files, follow [`../validation.md`](../validation.md).
