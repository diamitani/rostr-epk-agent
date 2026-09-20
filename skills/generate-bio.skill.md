# Skill — Generate Bio

**Purpose:** Generate a long-form and short-form artist bio grounded strictly in `master.md` and
`enhanced.md`.

**Trigger:** `enhanced.md` exists and has passed the compile-data quality gate.

**Inputs:** `master.md`, `enhanced.md`.

**Procedure:**
1. Draft the long bio (250–450 words): origin/hometown, artist type and genre, theme/style narrative,
   career timeline highlights, discography/catalogue highlights, notable press or collaborations, and a
   closing line on current direction/availability.
2. Draft the short bio (40–75 words): a booking-ready condensed version usable in a lineup blurb or press
   release, hitting genre, one standout credibility signal (press mention, engagement score tier, notable
   collaboration), and current city/availability.
3. Every factual claim in either bio must map to a specific line in `master.md` or `enhanced.md` — no
   embellishment, no invented accolades, no vague superlatives ("world-class," "unmatched") unless the
   artist's own submitted brand language used that phrasing.
4. If the artist submitted their own bio draft, treat it as a strong style/voice reference and preserve
   distinctive phrasing where accurate, rather than fully rewriting from scratch.

**Output:** `bio-long.md`, `bio-short.md`, each with front matter noting `input_artifacts` and confidence.

**Guardrails:** Never state a metric (follower count, engagement score, release count) in the bio without
it existing verbatim in `enhanced.md`. Never name a venue, collaborator, or press outlet not present in the
source artifacts.
