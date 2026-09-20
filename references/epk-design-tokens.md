# EPK Design Tokens — Per Template

Used by `skills/generate-design-system.skill.md`. Brand assets (logo/colors/fonts) override these defaults
when explicitly supplied in intake; template layout/section order is not overridable by brand assets.

## Shared base tokens
- Type scale: Display 48/36 (desktop/mobile), H1 32/24, H2 24/20, Body 16/15, Caption 13/12.
- Grid: 12-column, 24px gutter (HTML); mirrored margins for PDF at Letter/A4.
- Image treatment: hero image full-bleed on One Sheeter/Booking; framed with caption on Media/General.

## One Sheeter
- Palette: high-contrast, one accent color, dark or light background — optimized for quick scanning.
- Density: tight vertical rhythm, minimal whitespace, stat strip uses monospace or tabular numerals.

## General
- Palette: neutral background, one primary + one accent color derived from brand assets or genre-typical
  mood (e.g., warmer accents for R&B/soul, cooler/neon for EDM) — only apply genre-typical defaults when no
  brand asset is supplied, and note this as an assumption.
- Density: generous section spacing, standard editorial rhythm.

## Booking
- Palette: professional, muted, high-legibility — riders rendered in a monospace or tabular block for
  scannability by production staff.
- Density: performance history and riders get the most visual weight; bio is condensed.

## Media
- Palette: editorial, photo-first, low-chroma UI so photography and press quotes stand out.
- Density: generous whitespace, large pull-quotes for press mentions.

## Brand
- Palette: strictly derived from supplied brand assets when available; if none supplied, fall back to
  General palette and flag the fallback.
- Density: data-visualization-forward (engagement score breakdown gets a chart/table treatment).
