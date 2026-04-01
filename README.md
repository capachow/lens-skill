# 🧐 LENS

[View on ClawHub](https://clawhub.ai/capachow/lens)

A skill engineered for when you need your agent to see the world through your LENS. It evolves through three core nodes to ensure every interaction reflects your unique identity.

> **Prompt (The Request) + LENS (The Trinity Nodes) = Authentic Output.**

## The Philosophy

A digital shadow should not be a burden to maintain. Most persona systems require manual adjustment and complex prompt-engineering. LENS is a passive, effortless implementation that grows sharper with use.

By observing interactions and distilling the essence of identity, the system mirrors the subject with zero-point objectivity. The architecture is token-efficient, separating identity into three surgical nodes to ensure the agent only carries the context required for authentic manifestation.

## The Trinity Nodes

Complexity is mapped into three distinct nodes. These anchors define the subject's identity through specific, immutable parameters.

### 1. `AXIOM.yaml`: The Truth (What)
**History and reality form the Cognitive Bedrock.** Identity is grounded in the immutable facts of existence.

> Chronology, Kinship, Assets, Professional Credentials, and Immutable History.

### 2. `ETHOS.yaml`: The Nature (Who)
**Values and character form the Internal Compass.** Identity is defined by how the world is weighed.

> Decision-Logic, Aesthetic Triggers, Philosophical Alignment, and Priority Traits.

### 3. `MODUS.yaml`: The Voice (How)
**Style and expression form the Behavioral Interface.** Identity is rendered through the nuance of delivery.

> Cadence Velocity, Punctuation Density, Lexical Gravity, Tone Temperature, and Linguistic Markers.

## Orchestration & State

To keep the Trinity Nodes pure, the LENS uses an isolated configuration layer:

*   **`package.json`**: The single source of truth for the system version. Decoupling this from the execution logic ensures updates are structurally clean and risk-free.
*   **`SCOPE.json`**: Manages the "State Machine." This file tracks your lifecycle phase, question counts, and model preferences. This separation ensures that skill updates never overwrite your identity or your settings.

## Evolution & Calibration

The LENS is not static; it is an evolving digital shadow.

*   **The Interview Protocol:** The system progresses through **onboarding** (2x daily for 1 week), **stabilizing** (1x daily for 3 weeks), and **habitual** (1x weekly) schedules to calibrate your digital shadow.
*   **The Distillation Loop:** The engine of evolution. A zero-token background script parses your raw OpenClaw session transcripts every night. If you haven't spoken, it quietly shuts down without waking the AI or burning tokens.
*   **Contextual Isolation:** To prevent "AI-muddiness," the distillation engine extracts only the messages tagged with your user role, completely discarding assistant replies, system logs, and operational noise. A strict "High-Threshold Filter" ensures only rare, meaningful facts enter AXIOM and ETHOS, while MODUS captures your raw written patterns.
*   **Silence Toggle:** You have total control. Setting `questions` to `false` in `SCOPE.json` silences the interview routine while keeping the identity engine active.
*   **Refinement on Demand:** You can proactively sharpen the LENS at any time. Simply say **"Focus my LENS"** or **"Ask me a LENS question"** to trigger an immediate calibration.
*   **Self-Healing Architecture:** The system features an automated repair engine. Every time a LENS script runs, the zero-token preflight logic compares your `SCOPE.json` state against the core `package.json` version and current cron configurations. If it detects a legacy configuration or a phase transition (questions reaching 0), it triggers a silent, instant migration to ensure your LENS remains performant and perfectly aligned without manual intervention.

## Structural Peace

LENS utilizes three flat YAML files and a single JSON state file instead of a complex vector store. This approach is lightweight, token-efficient, and human-readable. By treating identity as structured Operating System nodes, we have made the perspective of the subject computable without the need for heavy databases. YAML provides the perfect balance between structure for the engine and readability for the human.

## Privacy & Security

LENS is designed to mirror you organically. This requires broad, automated access to your daily interactions to extract your true Voice (MODUS) rather than a curated summary. 

To achieve this, the installation registers two background **cron jobs** and the distillation script natively parses your **last 24 hours of OpenClaw session transcripts** (`~/.openclaw/agents/main/sessions/*.jsonl`). 

We have built strict safeguards to protect your data during this process:
1.  **The `#private` Scrubber:** If you type `#private` anywhere in a message, the zero-token preflight script will completely skip that message.
2.  **Native Redaction & Anonymization:** The distillation script automatically redacts sensitive patterns—such as API keys, private keys, bank details, and SSNs—before the AI ever sees the transcript. Users can further opt-in to full PII anonymization (scrubbing emails, phone numbers, and street addresses) by setting `"anonymize": true` in `.lens/SCOPE.json`.
3.  **The Privacy Guard:** The distillation prompt is strictly instructed to **never** extract raw credentials, specific addresses, or sensitive health data. If such data slips through, the LENS will only extract the *conceptual logic* (e.g., "The subject prefers 1Password for security") rather than the data itself.
4.  **Opt-in Transparency:** The skill explicitly requires the `HOME` environment variable to locate your session transcripts. If you prefer not to use the automated distillation loop, you can simply delete the `lens-distillation` cron job after installation; the Trinity Nodes will still function as a manual perspective engine for your agent.

---
> *Proudly refined through my own LENS.*
