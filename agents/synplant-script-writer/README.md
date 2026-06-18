# Synplant Script Writer Agent Package

Reusable agent instructions for creating, adapting, and debugging Synplant scripts with this SDK as
the source of truth.

- [`instructions.md`](instructions.md) is the canonical instruction file.
- [`vibe-coding.md`](vibe-coding.md) is a practical project-setup and AI-assisted workflow guide.
- [`source-map.md`](source-map.md) maps where to find authoritative references.
- [`packaging.md`](packaging.md) covers the three script shapes (`.js`, `.spscript`, Mods).
- [`validation.md`](validation.md) covers CushyLint and live-bridge verification.
- [`examples.md`](examples.md) is a task-to-example index.
- [`cushy-notes.md`](cushy-notes.md) collects practical Cushy gotchas and patterns.

The platform-specific files are thin wrappers for tools that expect a particular entry-point format,
all pointing back to `instructions.md`:

- Claude: [`claude/CLAUDE.md`](claude/CLAUDE.md)
- Codex: [`codex/SKILL.md`](codex/SKILL.md)
- ChatGPT: [`chatgpt/instructions.md`](chatgpt/instructions.md)

The package lives inside the SDK so agents can inspect the same documentation, examples, schemas,
resources, and tools that script authors use.
