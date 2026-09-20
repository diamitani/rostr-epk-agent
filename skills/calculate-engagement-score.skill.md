# Skill — Calculate Engagement Score

**Purpose:** Derive a single, explainable engagement score from `social-media-raw.json` that talent bookers
can use as a quick credibility signal.

**Trigger:** `social-media-raw.json` exists with at least one resolved platform.

**Inputs:** `social-media-raw.json`.

**Procedure:**
1. Per platform, compute an engagement rate: `(avg_likes + avg_comments + avg_shares) / followers`, using
   the most recent N posts available (state N used).
2. Normalize each platform's rate to a 0–100 sub-score using platform-typical engagement bands (e.g.,
   Instagram organic engagement bands differ from TikTok's) — document the band source and thresholds used.
3. Compute a weighted composite score across platforms, weighting by platform relevance to music discovery
   (e.g., weight Instagram/TikTok/YouTube higher than Facebook for a touring artist) — state the weights
   used.
4. Output both the composite score and every per-platform sub-score and raw ratio so a reader can audit the
   number, not just trust it.
5. If fewer than two platforms resolved, still compute the score but flag `confidence: low` and state that
   the score reflects limited platform coverage.

**Output:** `engagement-score.md` — composite score, per-platform breakdown table, formula used, weights
used, and data recency (oldest `retrieved_at` among inputs).

**Guardrails:** Never present the composite score without the breakdown. Never compare the artist's score to
named competitor artists unless the user explicitly supplied competitor data.
