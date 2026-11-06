# 🧐 `~/.lens`: Personal Identity

This directory holds your live identity for the [LENS](https://github.com/capachow/lens-skill) agent skill across **Google Antigravity**, **OpenClaw**, **Claude Code**, and **OpenAI Codex CLI**. You can edit the YAML files by hand at any time, or update them in chat (*"Add to my LENS that..."*, *"Focus my LENS"*, *"Distill my LENS"*).

> **Keep `~/.lens/` Private:** If you back up or sync this directory with Git, always use a **private** repository.

## Identity & State Files

| File | Role | Description |
| :--- | :--- | :--- |
| **`AXIOM.yaml`** | **The Truth (What)** | Objective facts about your life and work: biography, inner circle, daily hardware and tools, infrastructure, active projects, and career history. |
| **`ETHOS.yaml`** | **The Nature (Who)** | How you think and weigh trade-offs: core doctrines, conditional `decision_heuristics` (*when X conflicts with Y, prioritize X*), risk boundaries, conflict style, taste, and quality standards. |
| **`MODUS.yaml`** | **The Voice (How)** | How you write and speak: verbatim `voice_anchors`, `contextual_registers` (peer, critique, long-form, diplomatic), sentence rhythm, punctuation habits, and humor. |
| **`SCOPE.json`** | **State & Settings** | Tracks your LENS version, installation date, PII anonymization toggle, interview calibration phase, and optional model overrides. |
| **`TRACE.txt`** | **Scrubbed Buffer** | Rolling 24-hour buffer of your recent user messages harvested across local AI sessions by `distillation.js` (any message tagged with `#private` is skipped). |

## Configuring `SCOPE.json`

Edit `SCOPE.json` to change how LENS harvests and calibrates:

```json
{
  "meta": {
    "version": "2.1.0",
    "installed": "2026-02-07",
    "anonymize": false
  },
  "interview": {
    "phase": "onboarding",
    "questions": 15,
    "model": ""
  },
  "distillation": {
    "model": ""
  }
}
```

* **`meta.anonymize`** (`false` by default): URLs, API keys, private keys, passwords, SSNs, bank numbers, and IPs are always scrubbed before writing `TRACE.txt`. Set `"anonymize": true` to also strip emails, phone numbers, street addresses, dates of birth, and social handles.
* **`interview.phase` & `interview.questions`**: `questions` counts down remaining calibration questions across `onboarding` (`15`, 2x daily) and `stabilizing` (`22`, 1x daily) before switching to `habitual` (`"questions": true`, 1x weekly).
* **`interview.model` & `distillation.model`**: Leave empty (`""`) so each platform uses its active default model, or set a specific model identifier to override scheduled runs.

## Syncing Across Machines

Because `~/.lens/` lives outside the `lens-skill` repository, you can track it in its own private Git repo and upgrade or reinstall the skill without touching your data. On a new machine, clone `~/.lens/` first and then run `bootstrap.js` (which links the skill while leaving your existing `~/.lens/` files intact):

```bash
git clone <your-private-lens-repo-url> ~/.lens
node /path/to/lens-skill/lens/scripts/bootstrap.js
```
