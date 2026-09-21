/**
 * EPK Tool: generate-design-system
 * Implements skills/generate-design-system.skill.md, using the template/token
 * rules already specified in references/epk-template-library.md and
 * references/epk-design-tokens.md — this is the code that was missing; the
 * docs described the resolution logic but nothing executed it.
 *
 * Theme-as-configuration pattern (a named palette registry per template,
 * selected rather than hand-coded) and the explicit section/layout list per
 * template are patterns pulled from two open-source presentation generators
 * evaluated for this project — Presenton (github.com/presenton/presenton,
 * see its layouts.json) and ALLWEONE presentation-ai (github.com/allweonedev/
 * presentation-ai, see its 38-theme registry). Neither is a runtime
 * dependency here; only the pattern was adopted, translated into the EPK
 * domain's own template/section vocabulary.
 */

import type { DesignTokens, ROSTRArtifact, EPKIntake } from "../../types";

interface TemplatePalette {
  name: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

interface TemplateSpec {
  sections: string[];
  density: string;
  font_heading: string;
  font_body: string;
  palettes: TemplatePalette[];
  default_palette: string;
}

export const TEMPLATE_LIBRARY: Record<string, TemplateSpec> = {
  "one-sheeter": {
    sections: ["hero", "bio-short", "genre-tags", "discography-top3", "stat-strip", "contact"],
    density: "dense",
    font_heading: "Outfit",
    font_body: "Inter",
    default_palette: "high-contrast-dark",
    palettes: [
      { name: "high-contrast-dark", primary_color: "#8b5cf6", accent_color: "#f59e0b", background_color: "#0a0a0f", text_color: "#f8f8ff" },
      { name: "high-contrast-light", primary_color: "#6d28d9", accent_color: "#d97706", background_color: "#fafafa", text_color: "#111114" },
    ],
  },
  general: {
    sections: ["hero", "bio-long", "theme-analysis", "discography-full", "social-engagement", "press", "collaborations", "contact", "media-gallery"],
    density: "editorial",
    font_heading: "Outfit",
    font_body: "Inter",
    default_palette: "neutral-default",
    palettes: [
      { name: "neutral-default", primary_color: "#8b5cf6", accent_color: "#a78bfa", background_color: "#0a0a0f", text_color: "#f8f8ff" },
      { name: "neutral-warm", primary_color: "#c2410c", accent_color: "#f59e0b", background_color: "#120d0a", text_color: "#f8f5f0" },
      { name: "neutral-cool", primary_color: "#6366f1", accent_color: "#22d3ee", background_color: "#0a0a12", text_color: "#f0f0ff" },
    ],
  },
  booking: {
    sections: ["hero", "bio-short", "performances", "discography-highlights", "social-engagement", "technical-rider", "performance-rider", "contact"],
    density: "professional",
    font_heading: "Inter",
    font_body: "Inter",
    default_palette: "professional-muted",
    palettes: [
      { name: "professional-muted", primary_color: "#475569", accent_color: "#0ea5e9", background_color: "#0b0e14", text_color: "#e5e7eb" },
    ],
  },
  media: {
    sections: ["hero", "bio-long", "theme-analysis", "press-full", "discography-full", "collaborations", "media-gallery", "contact"],
    density: "photo-forward",
    font_heading: "Outfit",
    font_body: "Inter",
    default_palette: "editorial-low-chroma",
    palettes: [
      { name: "editorial-low-chroma", primary_color: "#1f2937", accent_color: "#e11d48", background_color: "#fafaf9", text_color: "#111114" },
    ],
  },
  brand: {
    sections: ["hero", "identity-statement", "brand-analysis", "social-engagement-expanded", "discography-highlights", "collaborations", "contact"],
    density: "data-forward",
    font_heading: "Outfit",
    font_body: "Inter",
    default_palette: "brand-default",
    palettes: [
      { name: "brand-default", primary_color: "#8b5cf6", accent_color: "#f59e0b", background_color: "#0a0a0f", text_color: "#f8f8ff" },
    ],
  },
};

// Genre-typical accent — ONLY applied when no brand asset is supplied to override it,
// and always logged as an assumption (never presented as a fact). Per
// references/epk-design-tokens.md: "warmer accents for R&B/soul, cooler/neon for EDM".
const GENRE_PALETTE_HINTS: Record<string, string> = {
  "r&b": "neutral-warm",
  soul: "neutral-warm",
  "hip-hop": "neutral-warm",
  "hip hop": "neutral-warm",
  rap: "neutral-warm",
  edm: "neutral-cool",
  electronic: "neutral-cool",
  house: "neutral-cool",
  techno: "neutral-cool",
  dance: "neutral-cool",
};

export async function generateDesignSystem(intake: EPKIntake): Promise<{
  artifact: ROSTRArtifact;
  tokens: DesignTokens;
  sections: string[];
  templateKey: string;
}> {
  const now = new Date().toISOString();
  const templateKey = intake.template && TEMPLATE_LIBRARY[intake.template] ? intake.template : "general";
  const spec = TEMPLATE_LIBRARY[templateKey];

  const provenance: string[] = [];
  let palette =
    spec.palettes.find((p) => p.name === spec.default_palette) || spec.palettes[0];

  // Only the General template currently varies by genre — Booking/Media/Brand/One
  // Sheeter keep a single professional default rather than guessing a mood from genre.
  if (templateKey === "general") {
    const genreKey = (intake.genre || "").toLowerCase();
    const hintedKey = Object.keys(GENRE_PALETTE_HINTS).find((g) => genreKey.includes(g));
    const hintedPalette = hintedKey
      ? spec.palettes.find((p) => p.name === GENRE_PALETTE_HINTS[hintedKey])
      : undefined;

    if (hintedPalette) {
      palette = hintedPalette;
      provenance.push(
        `Palette "${palette.name}" chosen from genre-typical default for genre "${intake.genre}" — no brand asset was supplied to override it. This is a stylistic assumption, not a brand fact.`
      );
    } else {
      provenance.push(`Palette "${palette.name}" is the template default — no brand asset or genre hint applied.`);
    }
  } else {
    provenance.push(`Palette "${palette.name}" is the fixed default for the "${templateKey}" template.`);
  }

  // TODO(brand assets): once intake carries logo/brand-guideline uploads, extract
  // dominant colors/fonts here and override `palette`/fonts — never fabricate a
  // brand color that wasn't evidenced by a supplied asset (see skill guardrails).

  const tokens: DesignTokens = {
    primary_color: palette.primary_color,
    accent_color: palette.accent_color,
    background_color: palette.background_color,
    text_color: palette.text_color,
    font_heading: spec.font_heading,
    font_body: spec.font_body,
  };

  const content = [
    "---",
    `artifact_type: epk-design-system.json`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: generate-design-system`,
    `input_artifacts: ["enhanced.md"]`,
    `confidence: 1.0`,
    `created_at: ${now}`,
    "---",
    "",
    `# Design System — ${templateKey}`,
    "",
    "```json",
    JSON.stringify(
      { template: templateKey, density: spec.density, sections: spec.sections, tokens },
      null,
      2
    ),
    "```",
    "",
    "## Provenance",
    "",
    provenance.map((p) => `- ${p}`).join("\n"),
  ].join("\n");

  const artifact: ROSTRArtifact = {
    artifact_type: "epk-design-system.json",
    version: "1.0.0",
    status: "draft",
    owner_skill: "generate-design-system",
    input_artifacts: ["enhanced.md"],
    confidence: 1.0,
    created_at: now,
    content,
  };

  return { artifact, tokens, sections: spec.sections, templateKey };
}
