# 🧐 LENS

Most AI output fails because it neither thinks how you think nor writes how you write. Nobody wants to maintain a massive "act like me" system prompt, and even when you try, humans are notoriously bad at explaining their own voice and decision-making from scratch.

**LENS** is a passive identity engine for your AI agents. Instead of asking you to write an essay about your communication style, it observes how you naturally work across sessions and asks occasional, one-sentence trade-off questions. Over time, it distills your context, your judgment, and your voice into three plain-text YAML files in `~/.lens/`.

> **Prompt (The Request) + LENS (The Trinity Nodes) = Authentic Output.**

## Why LENS Works

Style without judgment is just hollow mimicry, and facts without style read like a robot reciting your resume. LENS separates what is true about your life (`AXIOM`), how you weigh trade-offs (`ETHOS`), and how you actually phrase things (`MODUS`) so your agent reasons through your compass before speaking in your voice.

Identity also should not be a second job to maintain. LENS models one human on one personal machine (no multi-user profiles, persona switchers, or opaque vector databases) and runs natively across **Google Antigravity**, **OpenClaw**, **Claude Code**, and **OpenAI Codex CLI** through the universal `SKILL.md` standard.

## The Trinity Nodes

Your identity lives in three plain-text YAML files inside `~/.lens/`:

### 1. `AXIOM.yaml`: The Truth (What)
`AXIOM` gives your agent silent situational awareness so you never have to re-explain your background, stack, or environment. It captures your biography, inner circle, daily hardware and tools, infrastructure, active projects, and career history.

### 2. `ETHOS.yaml`: The Nature (Who)
`ETHOS` governs how your agent evaluates ideas, spots weak logic, and pushes back before a single word is drafted. It captures conditional `decision_heuristics` (*when X conflicts with Y, prioritize X*), core doctrines, risk and reversibility boundaries, conflict protocol, cultural taste, and quality standards.

### 3. `MODUS.yaml`: The Voice (How)
`MODUS` makes sure the final output actually sounds like you wrote it, adapting across registers (peer collaboration, architectural critique, public long-form, and external diplomacy) while stripping out AI filler, robotic transitions, and default list formatting. It tracks verbatim `voice_anchors`, sentence rhythm, punctuation habits, and humor triggers.

## Using Your LENS

LENS stays out of the way during routine coding and general tasks. It only activates when you ask for it:

* **Think, write, or evaluate as you:** *"Use my LENS to draft a reply to this proposal"* or *"Looking through my LENS, what is wrong with this architecture?"*
* **Calibrate on demand:** *"Focus my LENS"* or *"Ask me a LENS question"* prompts a single scenario or trade-off dilemma to sharpen an uncalibrated area.
* **Distill recent sessions:** *"Distill my LENS"* harvests and refines signals from your recent conversations on the spot.
* **Direct updates:** *"Add to my LENS that I prefer flat modules over deep class hierarchies"* updates the matching node in place.

## Architecture & Directory Layout

Your private identity files live in `~/.lens/` in your home directory, completely separate from the universal skill engine in `lens-skill/lens/`:

```text
~/.lens/
├── AXIOM.yaml
├── ETHOS.yaml
├── MODUS.yaml
├── README.md
├── SCOPE.json
└── TRACE.txt

lens-skill/
├── .gitignore
├── AGENTS.md
├── README.md
└── lens/
    ├── SKILL.md
    ├── package.json
    ├── prompts/
    │   ├── distillation.md
    │   └── interview.md
    ├── references/
    │   ├── alignment-scales.md
    │   ├── resolve-protocol.md
    │   └── trinity-definitions.md
    └── scripts/
        ├── bootstrap.js
        ├── distillation.js
        ├── interview.js
        └── templates/
            ├── AXIOM.yaml
            ├── ETHOS.yaml
            ├── MODUS.yaml
            └── README.md
```

## How It Evolves

Behind the scenes, `scripts/distillation.js` acts as a zero-token preflight harvester. It collects your raw user messages from the last 24 hours across **Google Antigravity (App, IDE, & `agy` CLI)**, **OpenClaw**, **Claude Code**, and **Codex CLI**. If you have not chatted recently, it exits silently (`TRACE_EMPTY`) without waking a model or burning tokens.

When new messages exist, `prompts/distillation.md` filters out assistant replies, pasted logs, rapid bot commands (*"run the build"*), and one-off project tasks. Only signals that would still hold true if you switched projects tomorrow make it into your YAML nodes.

To fill in blind spots that normal work sessions do not surface, `prompts/interview.md` runs a lightweight calibration loop across **onboarding** (15 questions), **stabilizing** (22 questions), and **habitual** phases using quick, concrete trade-off questions instead of abstract personality quizzes. By default, `"model": ""` in `~/.lens/SCOPE.json` lets each platform run distillation and interviews with its own active default model, or you can pin a specific model string to override it.

## Installation & Onboarding

### 1. Run Bootstrap
```bash
node lens/scripts/bootstrap.js
```
Running `bootstrap.js` handles the local setup automatically:
1. Initializes `~/.lens/` (`AXIOM.yaml`, `ETHOS.yaml`, `MODUS.yaml`, `README.md`, `SCOPE.json`, `TRACE.txt`), or leaves your existing `~/.lens/` untouched if you already cloned your identity repo from Git.
2. Detects installed agent platforms and links the skill into each one:
   * **Google Antigravity:** `~/.gemini/config/skills/lens` (unless already registered in `~/.gemini/config/skills.json`)
   * **OpenClaw:** `<workspace>/skills/lens` (via `~/.openclaw/openclaw.json`, or install via [ClawHub](https://clawhub.ai/capachow/lens))
   * **Claude Code:** `~/.claude/skills/lens`
   * **OpenAI Codex CLI:** `~/.codex/skills/lens` (or `$CODEX_HOME/skills/lens`)
3. Pre-configures the Google Antigravity background sidecars (`~/.gemini/config/sidecars/lens-distillation/sidecar.json` and `lens-interview/sidecar.json`) when Antigravity is present.

### 2. Background Scheduling by Platform

How nightly distillation (`0 3 * * *`) and calibration interviews (`30 11,17 * * *` $\rightarrow$ `30 11 * * *` $\rightarrow$ `30 11 * * 3`) run depends on your host environment:

* **OpenClaw:** Runs a persistent daemon with a native `cron` tool. On your first LENS interaction (or whenever preflight spots missing schedules in `OPENCLAW_CRON_LIST`), the agent registers `lens-distillation` and `lens-interview` automatically and asks your first calibration question.
* **Google Antigravity:** `bootstrap.js` writes the **"LENS Nightly Distillation"** and **"LENS Calibration Interview"** definitions to `~/.gemini/config/sidecars/` with scoped permissions for `~/.lens/`. Open the **Automations Dashboard** (`sidecar://dashboard`) to toggle them on.
* **Claude Code & OpenAI Codex CLI:** Terminal CLIs only run while a session is open and have no background daemon, so you have three ways to evolve `~/.lens/`:
  1. **Shared harvesting (automatic):** If you also run OpenClaw or Antigravity on the same machine, their overnight jobs automatically harvest your CLI sessions too.
  2. **On demand in chat:** Say *"Distill my LENS"* or *"Focus my LENS"* during any CLI session.
  3. **System `crontab` (optional):** If you only use a terminal CLI and want unattended 3:00 AM distillation, add the preflight check to `crontab -e` so a model only runs when `distillation.js` outputs `DISTILLATION_READY`:
     * **Claude Code:**
       ```bash
       0 3 * * * node /abs/path/to/lens/scripts/distillation.js | grep -q DISTILLATION_READY && claude -p "Read /abs/path/to/lens/prompts/distillation.md and follow it strictly." --allowedTools "Read,Edit,Write,Bash"
       ```
     * **OpenAI Codex CLI:**
       ```bash
       0 3 * * * node /abs/path/to/lens/scripts/distillation.js | grep -q DISTILLATION_READY && codex exec --full-auto --add-dir "$HOME/.lens" "Read /abs/path/to/lens/prompts/distillation.md and follow it strictly."
       ```

## Privacy & Security

Because `~/.lens/` lives in your home directory outside the skill repository, you can version it as its own private Git repo (`git clone <your-private-lens-repo> ~/.lens` on a new machine) and upgrade or reinstall the skill without touching your personal data.

* **Opt out any message with `#private`:** Any chat message containing `#private` is skipped entirely before `TRACE.txt` is written.
* **Automatic secret scrubbing:** `distillation.js` strips URLs, API keys, private keys, passwords, SSNs, bank numbers, and IP addresses before a model ever reads `TRACE.txt`. Setting `"anonymize": true` in `~/.lens/SCOPE.json` also scrubs emails, phone numbers, street addresses, dates of birth, and social handles.
* **Public draft redlines:** `resolve-protocol.md` blocks sensitive `AXIOM` data (biometrics, exact addresses, financial details, and medical context) from ever leaking into external or public-facing drafts.

---
> *Proudly refined through my own LENS.*
