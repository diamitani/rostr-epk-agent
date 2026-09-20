# Skill — Create Discography

**Purpose:** Finalize the artist's catalogue into a clean, presentation-ready discography from raw
extracted metadata.

**Trigger:** `discography-raw.json` exists.

**Inputs:** `discography-raw.json`.

**Procedure:**
1. Sort all resolved releases chronologically (newest first) and drop `unresolved` entries into a separate
   "additional releases (unverified)" list rather than the main catalogue.
2. Normalize the final catalogue schema: title, type (single/EP/album), release date, primary platform
   links, featured artists, and cover art reference.
3. Generate `discography.csv` for spreadsheet portability (one row per release) and a mirrored
   `discography.md` Markdown table for direct embedding in the EPK.
4. Compute simple catalogue stats: total releases, years active (from earliest to latest release date),
   most recent release date — for use in the bio and booking sections.

**Output:** `discography.csv`, `discography.md`, and a small `discography-stats.json` (release count, years
active, most recent release).

**Guardrails:** Never include a release in the primary catalogue if its metadata extraction was
`status: unresolved`. Never guess a release date — omit the date field rather than approximate it.
