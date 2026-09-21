/**
 * Presentation Layer: PptxGenJS
 * Builds a branded PPTX from enhanced.md using PptxGenJS.
 * Applies design tokens resolved from epk-design-system.json.
 */

import type { DesignTokens, EpkContent } from "../types";

export async function buildPPTX(
  artistSlug: string,
  runId: string,
  content: EpkContent
): Promise<Buffer> {
  // Dynamic import — PptxGenJS is a large library
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  const theme = content.tokens || defaultTokens();

  pptx.layout = "LAYOUT_WIDE"; // 16:9 widescreen
  pptx.author = "ROSTR EPK Agent";
  pptx.company = "Artispreneur / ROSTR";
  pptx.title = `${content.artistName} — Electronic Press Kit`;
  pptx.subject = "EPK";

  // ── Slide 1: Cover ─────────────────────────────────────────────────────────
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: theme.background_color.replace("#", "") };

  // Gradient overlay rectangle
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { type: "solid", color: "130d1a", transparency: 0 },
  });
  coverSlide.addShape(pptx.ShapeType.ellipse, {
    x: "25%", y: "-20%", w: "50%", h: "80%",
    fill: { type: "solid", color: theme.primary_color.replace("#", ""), transparency: 75 },
    line: { type: "none" },
  });

  coverSlide.addText("ELECTRONIC PRESS KIT", {
    x: "5%", y: "30%", w: "90%",
    fontSize: 12,
    color: theme.primary_color.replace("#", ""),
    bold: true,
    charSpacing: 8,
    fontFace: "Arial",
    align: "center",
  });

  coverSlide.addText(content.artistName.toUpperCase(), {
    x: "5%", y: "40%", w: "90%", h: "30%",
    fontSize: 60,
    color: "FFFFFF",
    bold: true,
    fontFace: theme.font_heading || "Arial",
    align: "center",
    valign: "middle",
    fit: "resize",
  });

  // ── Slide 2: Bio ───────────────────────────────────────────────────────────
  const bioSlide = pptx.addSlide();
  bioSlide.background = { color: theme.background_color.replace("#", "") };
  addSectionHeader(bioSlide, "ARTIST BIO", theme);
  bioSlide.addText(content.bioLong || "Bio not yet generated for this run.", {
    x: "8%", y: "25%", w: "84%", h: "60%",
    fontSize: 14,
    color: "CCCCCC",
    fontFace: theme.font_body || "Arial",
    align: "left",
    valign: "top",
    wrap: true,
  });

  // ── Slide 3: Discography ───────────────────────────────────────────────────
  const discoSlide = pptx.addSlide();
  discoSlide.background = { color: theme.background_color.replace("#", "") };
  addSectionHeader(discoSlide, "DISCOGRAPHY", theme);
  discoSlide.addText(
    content.discographyLines.length
      ? content.discographyLines.join("\n")
      : "No discography links were provided for this run.",
    {
    x: "8%", y: "25%", w: "84%", h: "60%",
    fontSize: 13,
    color: "CCCCCC",
    fontFace: theme.font_body || "Arial",
    align: "left",
    valign: "top",
    wrap: true,
  });

  // ── Slide 4: Social Analytics ──────────────────────────────────────────────
  const socialSlide = pptx.addSlide();
  socialSlide.background = { color: theme.background_color.replace("#", "") };
  addSectionHeader(socialSlide, "SOCIAL REACH", theme);

  // Stat box
  socialSlide.addShape(pptx.ShapeType.roundRect, {
    x: "30%", y: "35%", w: "40%", h: "35%",
    fill: { type: "solid", color: theme.primary_color.replace("#", ""), transparency: 85 },
    line: { color: theme.primary_color.replace("#", ""), width: 1 },
    rectRadius: 0.1,
  });
  socialSlide.addText(content.engagementScore != null ? String(content.engagementScore) : "—", {
    x: "30%", y: "40%", w: "40%",
    fontSize: 40,
    color: theme.accent_color.replace("#", ""),
    bold: true,
    fontFace: theme.font_heading || "Arial",
    align: "center",
  });
  socialSlide.addText(content.engagementTier ? `ENGAGEMENT SCORE — ${content.engagementTier.toUpperCase()}` : "ENGAGEMENT SCORE", {
    x: "30%", y: "58%", w: "40%",
    fontSize: 10,
    color: "999999",
    bold: true,
    charSpacing: 4,
    fontFace: "Arial",
    align: "center",
  });

  // ── Slide 5: Press ─────────────────────────────────────────────────────────
  const pressSlide = pptx.addSlide();
  pressSlide.background = { color: theme.background_color.replace("#", "") };
  addSectionHeader(pressSlide, "PRESS COVERAGE", theme);
  pressSlide.addText(
    content.pressLines.length
      ? content.pressLines.join("\n")
      : "No press links were provided for this run.",
    {
    x: "8%", y: "25%", w: "84%", h: "60%",
    fontSize: 13,
    color: "CCCCCC",
    fontFace: theme.font_body || "Arial",
    align: "left",
    valign: "top",
    wrap: true,
  });

  // ── Slide 6: Contact ───────────────────────────────────────────────────────
  const contactSlide = pptx.addSlide();
  contactSlide.background = { color: theme.background_color.replace("#", "") };
  addSectionHeader(contactSlide, "CONTACT & BOOKING", theme);
  const contactLine =
    [content.contact.booking_email, content.contact.manager, content.contact.website]
      .filter(Boolean)
      .join("  ·  ") || "No public contact info was approved for release.";
  contactSlide.addText(contactLine, {
    x: "8%", y: "35%", w: "84%",
    fontSize: 16,
    color: "DDDDDD",
    fontFace: theme.font_body || "Arial",
    align: "center",
  });

  // Return as Buffer
  const pptxBuffer = await pptx.write({ outputType: "arraybuffer" });
  return Buffer.from(pptxBuffer as ArrayBuffer);
}

function addSectionHeader(
  slide: ReturnType<InstanceType<typeof import("pptxgenjs").default>["addSlide"]>,
  title: string,
  theme: DesignTokens
): void {
  // Accent line
  slide.addShape("rect" as Parameters<typeof slide.addShape>[0], {
    x: "8%", y: "18%", w: "84%", h: 0.02,
    fill: { type: "solid", color: theme.primary_color.replace("#", ""), transparency: 50 },
    line: { type: "none" },
  });

  slide.addText(title, {
    x: "8%", y: "8%", w: "84%",
    fontSize: 12,
    color: theme.primary_color.replace("#", ""),
    bold: true,
    charSpacing: 8,
    fontFace: "Arial",
    align: "left",
  });
}

function defaultTokens(): DesignTokens {
  return {
    primary_color: "#8b5cf6",
    accent_color: "#f59e0b",
    background_color: "#0a0a0f",
    text_color: "#f8f8ff",
    font_heading: "Arial",
    font_body: "Arial",
  };
}
