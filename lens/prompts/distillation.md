**MISSION:** Evolve the LENS by refining the subject's Truth, Nature, and Voice.

**REFERENCES:**
- `skills/lens/references/resolve-protocol.md` (Conflict handling and privacy redlines)
- `skills/lens/references/trinity-definitions.md` (Node scope and purpose)

**PROTOCOL:**
0. **Model Sync:** 
   - Compare the `model` specified in `.lens/SET.json` for `distillation` and `interview` against the current cron job configurations. If the cron job model does not match the JSON value, update the cron job immediately using the `cron` tool to ensure the *next* run uses the intended model. Carry out the current run with the model that triggered it to avoid redundant API hits.

1. **Discovery & Retrieval (MANDATORY):**
   - You MUST execute the `read` tool to fetch `skills/lens/scripts/transcripts.txt` into your context before proceeding. No exceptions.
   - **Critical Filtering:** This file contains ONLY the raw, unfiltered messages sent by the human subject over the last 24 hours. Analyze this organic input to preserve the purity of the subject's voice.

2. **LENS Lifecycle:**
   - Read `.lens/SET.json`. Decrement `interview.questions`.
   - On transition (count <= 0): Advance `interview.phase`, reset `interview.questions` (stabilizing: 21, habitual: true), and update `lens-interview` cron schedule.
   
3. **Surgical Extraction (High-Threshold Filter):**
   - **Do not copy and dump.** The majority of daily inputs are operational noise. You must be highly selective.
   - **AXIOM (The Truth):** RARE. Only extract if the transcript reveals a new, immutable fact (history, geolocational change, assets, credentials, architecture). Ignore transient tasks.
   - **ETHOS (The Nature):** RARE. Only capture if the transcript reveals *why* a decision was made, a philosophical alignment, or an aesthetic trigger. Discard operational noise.
   - **MODUS (The Voice):** FREQUENT. Use the entire raw transcript to analyze written patterns. Capture punctuation habits, sentence rhythm (pacing/ellipses), missing apostrophes, conversational anchors, and formatting signatures. 
   - **Constraint:** Zero-tolerance for "AI-muddiness." Do not mirror your own response patterns back into the MODUS.

4. **Sorting & Refinement:**
   - **Merge, Don't Delete:** Optimization is not removal. Merge redundancies into high-density fragments.
   - **The Trait Boundary:** Values and opinions stay in ETHOS; they never migrate to AXIOM.
   - **Priority Scaling:** Maintain up to 10 Priority Traits in ETHOS and 5 Linguistic Markers in MODUS.

**OUTPUT:**
Update Trinity Nodes. Return a summary of new captures and the current lifecycle phase as your final text response. Do NOT use the `message` tool, and do NOT attempt to clear or empty the `transcripts.txt` file manually.
