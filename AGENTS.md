# AGENTS.md instructions

This repository contains the Obsidian plugin **Canvas for StoryLine**.

## Purpose

The plugin reads a configured StoryLine project and generates Canvas files plus
an export-oriented `Master.md` in the project's direct `Canvas` subfolder.
Source notes must never be modified. Generated `Canvas/**` files must never be
treated as source input.

## Architecture

- `src/storyline/`: StoryLine discovery and parsing;
- `src/model/`: Obsidian-independent domain types;
- `src/generation/identity.ts`: deterministic IDs and hashes;
- `src/generation/canvas/`: Canvas rendering;
- `src/generation/master/`: master-note rendering;
- `src/generation/plan/`: pure output planning;
- `src/vault/`: Vault-API-only reads and writes;
- `src/ui/`: settings and later user interfaces;
- `src/main.ts`: lifecycle and orchestration only.

Keep parsing, domain logic, rendering, Vault effects, and UI separated. Prefer
small pure helpers with focused tests. Preserve existing behavior unless a
change is requested.

## Vault safety

- Use Obsidian Vault APIs for all vault files and folders.
- Do not introduce Node/Electron runtime dependencies; the plugin is not desktop-only.
- Never silently overwrite an unowned or manually changed generated file.
- Store ownership state only in plugin data, not in StoryLine source files.
- Do not add live synchronization until source semantics and conflict behavior
  have been validated manually.

## Quality and Git

Before completing code changes, run `npm test` and `npm run build:prod` where possible.
Use the shared Obsidian test vault for runtime checks. Do not push, tag, publish,
or change remotes without explicit approval. Keep `release/`, `main.js`, local
plugin data, and test-vault state out of Git.
