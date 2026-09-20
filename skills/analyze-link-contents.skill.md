# Skill — Analyze Link Contents

**Purpose:** Extract and summarize the content of press links and miscellaneous links submitted in intake,
producing a press narrative section for the EPK.

**Trigger:** `master.md` contains links under `## Press` or `## Additional Links`.

**Inputs:** Press/misc links from `master.md`.

**Procedure:**
1. Fetch each link's content (`extract_link_contents` tool, or a general web fetch if the link is a public
   article/page).
2. Classify each link: press feature/review, interview, playlist placement, award/nomination, event
   recap, or other.
3. Summarize each in 1–3 sentences: publication/source name, date, and the specific claim or coverage
   relevant to the artist's credibility (quote directly where useful, with attribution).
4. Aggregate into a chronological press summary and a short "as seen in" source list suitable for a Media
   or Booking template.
5. If a link is dead, paywalled, or unreachable, mark it `status: unresolved` and list it separately rather
   than dropping it — the artist may still want the citation listed even without full-text extraction.

**Output:** `press-link-summary.md` — chronological summary table (source, date, type, 1–3 sentence
summary, link) plus an "as seen in" list.

**Guardrails:** Never paraphrase a quote in a way that changes its meaning. Never present a summary of an
unreachable link as if it were verified content — mark it explicitly as unresolved.
