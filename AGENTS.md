# LENS Repository Guardrails (`capachow/lens-skill`)

These rules govern agentic development on the `lens-skill` repository:

1. **`~/.lens/` Data Isolation (`~/.lens/` vs. `lens/scripts/templates/`):**
   - `~/.lens/` holds the user's live, private identity data (and any legacy `.lens/` in the repository is gitignored). Never read, overwrite, delete, or stage files inside `~/.lens/` (or `.lens/`) during codebase development.
   - All schema or template changes belong exclusively in `lens/scripts/templates/AXIOM.yaml`, `ETHOS.yaml`, `MODUS.yaml`, and `README.md`.
2. **Single-Subject Architecture:**
   - LENS models one human on one personal machine. Never introduce multi-user profiles, persona switchers, or external database dependencies.
3. **Agent-Agnostic Skill (`lens/`):**
   - Keep `lens/SKILL.md`, `lens/prompts/`, `lens/references/`, and `lens/scripts/` universal across Google Antigravity, Gemini CLI, OpenClaw, Claude Code, and OpenAI Codex CLI.
   - Always resolve skill paths via `fs.realpathSync(fileURLToPath(import.meta.url))` and `LENS_DIR` to `~/.lens/` (`path.join(HOME_DIR, '.lens')`) in `bootstrap.js`.
4. **Code & Versioning Standards:**
   - `lens/package.json` is the single source of truth for the LENS version.
   - Native Node.js ESM (`import`/`export`) with zero external npm dependencies.
   - Zero code comments in any file, and every file must end with a single empty trailing line.
