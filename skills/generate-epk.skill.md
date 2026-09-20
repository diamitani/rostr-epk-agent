# Skill — Generate EPK

**Purpose:** Render the final EPK using `bio-long.md`/`bio-short.md`, `enhanced.md`, and
`epk-design-system.json`, output as HTML and PDF, and optionally deploy the HTML build.

**Trigger:** `bio-long.md`, `bio-short.md`, and `epk-design-system.json` all exist and reference the same
`enhanced.md` version.

**Inputs:** `bio-long.md`, `bio-short.md`, `enhanced.md`, `epk-design-system.json`,
`references/epk-template-library.md`.

**Procedure:**
1. Populate the template's section layout with: hero (artist name, tagline/short bio, hero image), long
   bio, genre/style/theme analysis, discography (table + cover art), social & engagement score (with
   disclosure of formula/recency), press/"as seen in," collaborations & performances, contact &
   representation, riders (if Booking template), and media assets gallery.
2. Render `epk.html` using `generate_html` with the resolved design system tokens; if the user requested a
   Canva-polished output, hand the same content + tokens to the Canva MCP renderer and use its export as
   the final HTML/PDF source instead.
3. Render `epk.pdf` from the same populated content (`generate_pdf`), preserving section order and design
   tokens for visual consistency between HTML and PDF.
4. Run a final consistency check: every number/claim in the rendered output still matches its source in
   `enhanced.md`; no `[MISSING: ...]` marker was silently dropped — genuinely missing fields should render
   as omitted sections, not as fabricated filler.
5. If the user requests deployment, package `epk.html` for Vercel and route the deploy through
   `skills/approval-gating.skill.md` before executing — do not deploy without an approval record.

**Output:** `epk.html`, `epk.pdf`, and (if approved) a live Vercel deployment URL.

**Guardrails:** This is the only skill allowed to produce the final `epk.html`/`epk.pdf`. Any content gap
must be visibly handled (e.g., section omitted or marked "coming soon") rather than invented. Deployment is
gated; rendering to file is not.
