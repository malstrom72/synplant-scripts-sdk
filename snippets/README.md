# Snippets

Reusable source snippets for Synplant scripts.

These files are SDK source material, not a runtime dependency that end users should normally install
separately. For a distributable script, copy the snippet code you need into the single `.js` file or
into the `.spscript` package so the script remains self-contained and version-stable.

Snippets are written for Synplant's ES3-style JavaScript engine. Copy them into your script's IIFE,
Mod patcher closure, or another private scope. A snippet should expose only the small local functions
named in its header; implementation helpers belong inside those functions so they do not leak into
the rest of the script.
