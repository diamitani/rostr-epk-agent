# Skill — Generate Design System

**Purpose:** Resolve a concrete design system (palette, typography, layout grid, section order) for the
final EPK based on the selected template and any brand assets/guidelines supplied.

**Trigger:** Template selection is known (from intake or default) and `enhanced.md` exists.

**Inputs:** `references/epk-template-library.md`, `references/epk-design-tokens.md`, brand assets/brand
guidelines from `master.md` → `## Media & Uploads`, template choice (One Sheeter, General, Booking, Media,
Brand).

**Procedure:**
1. Load the base token set for the selected template family from `references/epk-design-tokens.md`.
2. If the artist supplied brand assets (logo, brand guideline doc, color palette), extract dominant colors
   and any stated brand fonts/voice, and override the template's default palette/type with the artist's
   brand where provided — template structure (layout/section order) stays fixed, brand identity overrides
   surface styling.
3. Resolve final tokens: color palette (primary/secondary/accent/background/text), type scale (display,
   heading, body), spacing/grid rules, and section order for the chosen template.
4. Record every override decision and its source (brand asset vs. template default).

**Output:** `epk-design-system.json` — resolved token set + section order + provenance notes.

**Guardrails:** Never invent a brand color/font not evidenced by supplied assets — fall back to the
template default and note the assumption. Section order/required sections come from the template spec and
are not user-overridable without an explicit request.
