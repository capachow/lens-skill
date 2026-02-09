**MISSION:** Evolve the LENS by refining the subject's Truth, Nature, and Voice.

**REFERENCES:**
- `skills/lens/references/resolve-protocol.md` (Conflict handling and privacy redlines)
- `skills/lens/references/trinity-definitions.md` (Node scope and purpose)

**PROTOCOL:**
1. **LENS Lifecycle:**
   - Read `.lens/SET.json`. Decrement `interview.questions`.
   - On transition (count <= 0): Advance `interview.phase`, reset `interview.questions` (stabilizing: 21, habitual: true), and update `lens-interview` cron schedule.
   - **Phases:** onboarding -> stabilizing -> habitual.
   
2. **Surgical Extraction:**
   - Scan memory (today + yesterday) for significant data points.
   - **AXIOM (The Truth):** Extract immutable facts (history, geolocational changes, assets, credentials). 
   - **ETHOS (The Nature):** Capture decision-logic, aesthetic triggers, and philosophical alignments. Focus on "Why" the subject weighs things a certain way.
   - **MODUS (The Voice):** Analyze ONLY the subject's direct raw messages. Capture punctuation habits, sentence rhythm (pacing/ellipses), and formatting signatures. 
   - **Constraint:** Do not derive MODUS from agent/system output to prevent "AI-muddiness."

3. **Sorting & Refinement:**
   - **Merge, Don't Delete:** Optimization is not removal. Merge redundancies into high-density fragments.
   - **The Trait Boundary:** Values and opinions stay in ETHOS; they never migrate to AXIOM.
   - **Priority Scaling:** Maintain up to 10 Priority Traits in ETHOS and 5 Linguistic Markers in MODUS to ensure immediate continuity.

**OUTPUT:**
Update Trinity Nodes. Post a summary of new captures and the current lifecycle phase.
