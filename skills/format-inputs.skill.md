# Skill — Format Inputs

**Purpose:** Compile raw EPK intake submission answers into a single canonical `master.md`, organized by
section, with zero inference and zero omission.

**Trigger:** A new or updated EPK intake submission is received (form answers + uploaded reference files).

**Inputs:** Raw intake answers mapped to `references/epk-intake-questions.md` field list; uploaded files
(photos, riders, existing bio draft, brand assets).

**Procedure:**
1. Map every answered field to its canonical section using `references/epk-intake-questions.md`:
   Identity, Genre & Style, Career Timeline, Influences, Collaborations & Performances, Press, Platform
   Links, Contact & Representation, Riders, Additional Links, Media/Uploads.
2. Preserve the artist's own wording verbatim for narrative fields (theme/style description, artist
   identity/brand, existing bio). Do not paraphrase or embellish at this stage.
3. For every unanswered required field, insert `[MISSING: <field name>]` — never leave a silent blank and
   never invent a plausible-sounding value.
4. List every uploaded file under a `## Media & Uploads` section with filename, type, and intended use if
   stated (e.g., "press photo," "technical rider").
5. List every submitted link under its own labeled subsection (do not yet fetch or analyze link content —
   that belongs to downstream skills).

**Output:** `master.md` with YAML front matter (`artifact_type: epk-master`, `status`, `confidence: 1.0`
since it is a direct compilation, `input_artifacts: [intake-submission]`), followed by the section-formatted
Markdown body.

**Guardrails:** No enrichment, no metadata extraction, no bio writing happens here. This skill is purely a
lossless transcription/organization step. If more than 30% of required fields are missing, flag the
submission as `status: blocked` and request the missing fields before continuing the pipeline.
