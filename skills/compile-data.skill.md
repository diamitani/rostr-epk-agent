# Skill — Compile Data

**Purpose:** Merge every upstream artifact into a single `enhanced.md` — the complete enriched source of
truth for bio generation, design, and final rendering.

**Trigger:** `master.md`, `music-theme-analysis.md`, `engagement-score.md`, `press-link-summary.md`,
`discography.md`, contact info, and (if applicable) brand assets/design template selection are all
available.

**Inputs:** All upstream artifacts listed above, plus `references/epk-template-library.md` for the chosen
template's required sections.

**Procedure:**
1. Assemble `enhanced.md` in this section order: Artist Identity → Genre & Theme/Style Analysis →
   Discography → Social Media & Engagement Score → Press & Media Coverage → Brand Analysis (derived from
   social bio/visual metadata if available) → Collaborations & Performances → Contact & Representation →
   Riders → Design System Reference → Media Assets Manifest.
2. Carry forward every `[MISSING: ...]` marker from `master.md` unresolved — do not silently drop gaps.
3. Attach provenance to every derived section: which skill/artifact produced it and its `confidence`.
4. Run the quality gate: verify every numeric claim (followers, engagement score, release count) traces to
   a source artifact; verify every required template section has content or an explicit gap marker; verify
   no raw credentials or tokens are present.
5. If the quality gate fails, return the artifact to the owning skill with a specific remediation request
   rather than patching it directly in `compile-data`.

**Output:** `enhanced.md` with full front matter (`input_artifacts: [...]`, `status: draft|approved`,
`confidence`) — the single file that `generate-bio`, `generate-design-system`, and `generate-epk` all read
from.

**Guardrails:** This is the only skill allowed to merge multiple artifacts into one file. No downstream
skill may re-read raw upstream artifacts directly once `enhanced.md` exists — they read `enhanced.md` only.
