# 🧐 LENS

Most AI outputs fail the identity test in two ways: they neither **think** how you think nor **write** how you write. Worse, nobody has time to hand-write massive "act like me" prompts, and even when you try, humans are notoriously bad at describing their own voice and decision-making.

**LENS** is a personal identity engine for your AI agents. By observing how you naturally communicate across your work sessions and asking occasional, one-sentence trade-off questions, LENS distills **your context**, **your judgment**, and **your voice** into three human-readable YAML files in `~/.lens/`.

> **Prompt (The Request) + LENS (The Trinity Nodes) = Authentic Output.**

## Why LENS Works

- **Zero Manual Configuration:** You never have to write an essay about your "communication style." LENS harvests how you already express yourself and calibrates blind spots through quick, concrete dilemmas.
- **Thought + Voice Together:** Style without judgment is hollow mimicry; facts without style sound like a robot reading your resume. LENS separates *what is true* (`AXIOM`), *how you weigh trade-offs* (`ETHOS`), and *how you phrase things* (`MODUS`) so your AI reasons through your compass before speaking in your voice.
- **One Person, One `~/.lens/`:** Built strictly for a single human identity on a personal machine, never bloated with multi-user profiles or artificial "mode" switching.
- **Agent-Agnostic:** Built on the universal `SKILL.md` standard, working natively across **Google Antigravity**, **Google Gemini CLI**, **OpenClaw**, **Claude Code**, and **OpenAI Codex CLI**.

## The Trinity Nodes

Instead of locking your identity inside an opaque vector database, LENS stores it as three plain-text YAML files in `~/.lens/`, cleanly separating what is true about your life, how you make decisions, and how you write:

### 1. `AXIOM.yaml`: The Truth (What)
**Your history and reality form the silent context.**
Gives your agent situational awareness so you never have to re-explain your background, stack, or environment.
> *Captures:* Biography, chronology, kinship and inner circle, daily tools and hardware, infrastructure, active projects, and professional history.

### 2. `ETHOS.yaml`: The Nature (Who)
**Your values and mental models form the decision engine.**
Governs how your agent evaluates ideas, weighs trade-offs, spots bad logic, and pushes back before a single word is drafted.
> *Captures:* Conditional `decision_heuristics` (*when X conflicts with Y, prioritize X*), core doctrines, risk and reversibility profile, conflict protocol, cultural taste logic, and non-negotiable quality standards.

### 3. `MODUS.yaml`: The Voice (How)
**Your syntax and cadence form the behavioral interface.**
Ensures the final output actually sounds like you wrote it, adapting naturally across contexts while eliminating generic AI filler, robotic transitions, and default list formatting.
> *Captures:* Verbatim 1-2 sentence `voice_anchors`, `contextual_registers` (peer, critique, long-form, diplomatic), sentence rhythm, punctuation habits, rhetorical pacing, and humor triggers.

## Using Your LENS

LENS stays dormant during routine coding and general tasks, activating only when you invoke it:

* **Think, Write, or Evaluate as You:** *"Use my LENS to draft a reply to this proposal"* or *"Looking through my LENS, what is wrong with this architecture?"*
* **Calibrate on Demand:** *"Focus my LENS"* or *"Ask me a LENS question"* asks a single concrete scenario or trade-off question to sharpen an under-defined area.
* **Distill Recent Sessions:** *"Distill my LENS"* harvests and refines insights from your recent conversations on demand.
* **Direct Updates:** *"Add to my LENS that I prefer flat modules over deep class hierarchies"* surgically updates the right node in place.

## Architecture & Directory Layout

LENS cleanly separates your private personal identity files (`~/.lens/` in your home directory) from the universal skill engine (`lens-skill/lens/`):

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

* **Multi-Agent Transcript Harvesting (`scripts/distillation.js`):** A zero-token preflight script collects your raw user messages from the last 24 hours across **Antigravity IDE & CLI** (`~/.gemini/antigravity*/brain/`), **Gemini CLI** (`~/.gemini/tmp/<project>/logs.json` & `chats/session-*.{json,jsonl}`), **OpenClaw** (`~/.openclaw/agents/main/` SQLite & JSONL), **Claude Code** (`~/.claude/projects/`), and **Codex CLI** (`~/.codex/sessions/`). If you haven't chatted recently, it exits silently (`TRACE_EMPTY`) without burning model tokens.
* **High-Threshold Portability Filter (`prompts/distillation.md`):** Strips out assistant replies, pasted logs, rapid bot commands (*"run the build"*), and transient project tasks, retaining only enduring facts (`AXIOM`), transferable mental models (`ETHOS`), and natural human phrasing (`MODUS`).
* **Scenario & Trade-Off Interviews (`prompts/interview.md`):** Progresses through **onboarding** (15 questions), **stabilizing** (22 questions), and **habitual** phases using quick, realistic dilemmas rather than abstract personality questions.
* **Model Inheritance (`~/.lens/SCOPE.json`):** Leave `"model": ""` in `~/.lens/SCOPE.json` (the default) so every platform runs distillation and interviews using its own active default model, or set a specific model string to override it.

## Installation & Onboarding

### 1. Run Bootstrap
```bash
node lens/scripts/bootstrap.js
```
Running `bootstrap.js` automatically:
1. Initializes your private `~/.lens/` directory (`AXIOM.yaml`, `ETHOS.yaml`, `MODUS.yaml`, `README.md`, `SCOPE.json`, `TRACE.txt`), or leaves your existing `~/.lens/` intact if you cloned your personal identity repo from Git.
2. Detects which agent platforms are installed on your machine and creates the skill symlinks automatically:
   * **Google Antigravity:** `~/.gemini/config/skills/lens` (unless already registered in `~/.gemini/config/skills.json`)
   * **Google Gemini CLI:** `~/.gemini/skills/lens`
   * **OpenClaw:** `<workspace>/skills/lens` (via `~/.openclaw/openclaw.json`, or install via [ClawHub](https://clawhub.ai/capachow/lens))
   * **Claude Code:** `~/.claude/skills/lens`
   * **OpenAI Codex CLI:** `~/.codex/skills/lens` (or `$CODEX_HOME/skills/lens`)
3. Pre-configures Google Antigravity Scheduled Automation sidecars (`~/.gemini/config/sidecars/lens-distillation/sidecar.json` and `lens-interview/sidecar.json`) when Antigravity is detected.

### 2. Background Scheduling by Platform

How nightly distillation (`0 3 * * *`) and calibration interviews (`30 11,17 * * *` $\rightarrow$ `30 11 * * *` $\rightarrow$ `30 11 * * 3`) run depends on your host tool:

* **OpenClaw (Automatic via Built-in `cron` Tool):**
  OpenClaw runs a persistent background daemon with a native `cron` tool. On your first LENS interaction (or whenever `preflight` detects missing/outdated schedules in `OPENCLAW_CRON_LIST`), the agent automatically registers and updates `lens-distillation` and `lens-interview` and asks your first calibration question.
* **Google Antigravity (One-Click Enable in Automations Dashboard):**
  `bootstrap.js` automatically writes the **"LENS Nightly Distillation"** and **"LENS Calibration Interview"** scheduled automation definitions to `~/.gemini/config/sidecars/` with scoped permissions for `~/.lens/`. Because Antigravity requires explicit user consent to activate background automations, open the **Automations Dashboard** (`sidecar://dashboard` in Antigravity) to toggle them on.
* **Claude Code, Google Gemini CLI, & OpenAI Codex CLI (Shared `~/.lens/`, On-Demand, or System `crontab`):**
  Terminal CLIs only run while open and do not include a resident background daemon:
  1. **Automatic Cross-Agent Harvesting:** Because all your agents share `~/.lens/`, running OpenClaw or Google Antigravity on the same machine automatically harvests your Claude Code, Gemini CLI, and Codex CLI transcripts overnight.
  2. **On-Demand in Chat:** Prompt *"Distill my LENS"* or *"Focus my LENS"* at any time during a CLI session.
  3. **Optional Standalone System `crontab`:** If you only use a terminal CLI and want unattended 3:00 AM nightly distillation, add the matching zero-token preflight entry to `crontab -e` (it only invokes the model if `distillation.js` outputs `DISTILLATION_READY`):
     * **Claude Code:**
       ```bash
       0 3 * * * node /abs/path/to/lens/scripts/distillation.js | grep -q DISTILLATION_READY && claude -p "Read /abs/path/to/lens/prompts/distillation.md and follow it strictly." --allowedTools "Read,Edit,Write,Bash"
       ```
     * **Google Gemini CLI:**
       ```bash
       0 3 * * * node /abs/path/to/lens/scripts/distillation.js | grep -q DISTILLATION_READY && gemini -p "Read /abs/path/to/lens/prompts/distillation.md and follow it strictly." --yolo
       ```
     * **OpenAI Codex CLI:**
       ```bash
       0 3 * * * node /abs/path/to/lens/scripts/distillation.js | grep -q DISTILLATION_READY && codex exec --full-auto --add-dir "$HOME/.lens" "Read /abs/path/to/lens/prompts/distillation.md and follow it strictly."
       ```

## Privacy & Security

1. **Decoupled Personal Identity (`~/.lens/`):** Because `~/.lens/` lives in your home directory outside the skill repository, you can version it as its own standalone private Git repo (`git clone <your-private-lens-repo> ~/.lens` on a new machine) and update or reinstall the `lens` skill without ever touching your personal data.
2. **The `#private` Scrubber:** Any message containing `#private` is completely skipped before `TRACE.txt` is written.
3. **Native Redaction & Anonymization:** `distillation.js` automatically redacts URLs, API keys, private keys, passwords, SSNs, bank numbers, and IPs before the AI ever reads `TRACE.txt`. Setting `"anonymize": true` in `~/.lens/SCOPE.json` also scrubs emails, phone numbers, street addresses, dates of birth, and social handles.
4. **Exfiltration Guard:** `resolve-protocol.md` strictly blocks private `AXIOM` redlines (biometrics, exact addresses, financial details, medical context) from ever appearing in public-facing drafts.

---
> *Proudly refined through my own LENS.*
