# 🧐 `~/.lens` — Personal Identity

This directory holds your **LENS** personal identity, generated and maintained by the [LENS](https://github.com/capachow/lens-skill) agent skill.

While the `lens-skill` repository contains the universal skill engine, prompts, and transcript harvesters, `~/.lens/` stores **your** live, evolving context, judgment, and voice across every supported AI platform (**Google Antigravity**, **Google Gemini CLI**, **OpenClaw**, **Claude Code**, and **OpenAI Codex CLI**).

> **Keep `~/.lens/` Private:** If you back up or sync this directory with Git, always use a **private** repository.

## Identity & State Files

| File | Role | Description |
| :--- | :--- | :--- |
| **`AXIOM.yaml`** | **The Truth (What)** | What is true about your life and work: biography, inner circle, daily hardware and tools, infrastructure, active projects, and career history. Gives agents silent situational awareness. |
| **`ETHOS.yaml`** | **The Nature (Who)** | How you think and judge: core beliefs, conditional `decision_heuristics` (*when X conflicts with Y, prioritize X*), risk tolerance, conflict style, taste, and quality bar. |
| **`MODUS.yaml`** | **The Voice (How)** | How you write and speak: verbatim `voice_anchors`, `contextual_registers` (peer, critique, long-form, diplomatic), sentence rhythm, punctuation habits, and humor. |
| **`SCOPE.json`** | **State & Settings** | Tracks your LENS version, installation date, PII anonymization toggle, interview calibration lifecycle, and optional model overrides. |
| **`TRACE.txt`** | **Scrubbed Buffer** | Ephemeral 24-hour buffer of your redacted user messages harvested across your local AI sessions by `distillation.js`. |

## Configuring `SCOPE.json`

You can edit `SCOPE.json` at any time to customize how LENS evolves:

```json
{
  "meta": {
    "version": "2.0.0",
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

* **`meta.anonymize`** (`false` by default): URLs, API keys, private keys, passwords, SSNs, bank numbers, and IPs are always redacted before writing `TRACE.txt`. Set `"anonymize": true` to also redact emails, phone numbers, street addresses, dates of birth, and social handles.
* **`interview.phase` & `interview.questions`**: Tracks calibration progression from `onboarding` (15 questions, 2x daily) $\rightarrow$ `stabilizing` (22 questions, 1x daily) $\rightarrow$ `habitual` (`true`, 1x weekly).
* **`interview.model` & `distillation.model`**: Leave as `""` (recommended) so each platform uses its active default model, or set a specific model identifier to override scheduled runs.

## Syncing Across Machines

Because `~/.lens/` is completely decoupled from the `lens-skill` code repository, you can version and clone your identity across machines without losing calibration when upgrading or reinstalling the skill:

```bash
git clone <your-private-lens-repo-url> ~/.lens
node /path/to/lens-skill/lens/scripts/bootstrap.js
```

---
*Powered by [LENS (`capachow/lens-skill`)](https://github.com/capachow/lens-skill).*
