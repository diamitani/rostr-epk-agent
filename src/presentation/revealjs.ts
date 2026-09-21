/**
 * Presentation Layer: Reveal.js
 * Builds a responsive, animated HTML5 presentation deck from enhanced.md
 * using Reveal.js v5 (CDN — no build step required).
 */

import type { SlideContent, EpkContent } from "../types";

export async function buildRevealJSDeck(
  artistSlug: string,
  runId: string,
  content: EpkContent
): Promise<string> {
  const slides: SlideContent[] = [
    {
      type: "cover",
      title: content.artistName.toUpperCase(),
      subtitle: content.genre || "Electronic Press Kit",
    },
    {
      type: "bio",
      title: "Artist Bio",
      body: content.bioShort || content.bioLong || "Bio not yet generated for this run.",
    },
    {
      type: "discography",
      title: "Discography",
      body: content.discographyLines.length
        ? content.discographyLines.join(" · ")
        : "No discography links were provided for this run.",
    },
    {
      type: "social",
      title: "Social Reach",
      stat_label: content.engagementTier ? `Tier: ${content.engagementTier}` : "Engagement Score",
      stat_value: content.engagementScore != null ? String(content.engagementScore) : "—",
    },
    {
      type: "press",
      title: "Press Coverage",
      bullets: content.pressLines.length ? content.pressLines : ["No press links were provided for this run."],
    },
    {
      type: "contact",
      title: "Contact & Booking",
      body:
        [content.contact.booking_email, content.contact.manager, content.contact.website]
          .filter(Boolean)
          .join(" · ") || "No public contact info was approved for release.",
    },
  ];

  return generateRevealHTML(content, slides);
}

function generateRevealHTML(content: EpkContent, slides: SlideContent[]): string {
  const primary = content.tokens.primary_color;
  const accent = content.tokens.accent_color;
  const bg = content.tokens.background_color;
  const text = content.tokens.text_color;
  const fontHeading = content.tokens.font_heading;
  const fontBody = content.tokens.font_body;
  const artistSlug = content.artistName;

  const slidesHTML = slides.map((s) => generateSlide(s, primary, accent)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artistSlug.replace(/-/g, " ")} — EPK Deck</title>
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${fontHeading.replace(/ /g, "+")}:wght@400;700;900&family=${fontBody.replace(/ /g, "+")}:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <style>
    :root {
      --r-background-color: ${bg};
      --r-main-color: ${text};
      --r-heading-color: ${text};
      --r-heading-font: '${fontHeading}', sans-serif;
      --r-main-font: '${fontBody}', sans-serif;
      --r-link-color: ${primary};
      --primary: ${primary};
      --accent: ${accent};
    }
    .reveal { background: ${bg}; }
    .reveal .slides section {
      height: 100%;
      display: flex !important;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 2rem;
    }
    .reveal h1 {
      font-family: var(--r-heading-font);
      font-size: clamp(2rem, 8vw, 5rem);
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: 0.9;
      background: linear-gradient(135deg, #fff 30%, ${primary});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .reveal h2 {
      font-family: var(--r-heading-font);
      font-size: 1.25rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${primary};
      margin-bottom: 1.5rem;
    }
    .reveal p { color: rgba(255,255,255,0.8); font-size: 1.1rem; line-height: 1.7; }
    .reveal ul { list-style: none; padding: 0; }
    .reveal ul li {
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.8);
      font-size: 1rem;
    }
    .stat-box {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 3rem;
      background: rgba(139,92,246,0.1);
      border: 1px solid rgba(139,92,246,0.3);
      border-radius: 1rem;
      margin: 1rem;
    }
    .stat-value {
      font-family: var(--r-heading-font);
      font-size: 3rem;
      font-weight: 900;
      color: ${accent};
    }
    .stat-label { font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 0.5rem; }
    .badge {
      display: inline-block;
      background: rgba(139,92,246,0.15);
      border: 1px solid rgba(139,92,246,0.4);
      color: ${primary};
      padding: 0.3rem 1rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
    }
    /* Slide backgrounds */
    .cover-slide { background: radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.4) 0%, transparent 70%); }
    .progress-bar { height: 3px !important; background: ${primary} !important; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slidesHTML}
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      transition: 'fade',
      transitionSpeed: 'slow',
      backgroundTransition: 'fade',
      progress: true,
      controls: true,
      center: true,
      width: 1200,
      height: 700,
      margin: 0.04,
      plugins: []
    });
  </script>
</body>
</html>`;
}

function generateSlide(
  slide: SlideContent,
  primary: string,
  accent: string
): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const title = esc(slide.title);
  const body = esc(slide.body || "");

  switch (slide.type) {
    case "cover":
      return `<section class="cover-slide" data-transition="zoom">
  <div class="badge">Electronic Press Kit</div>
  <h1>${title}</h1>
  ${slide.subtitle ? `<p style="font-size:1.3rem;margin-top:1rem;color:rgba(255,255,255,0.5)">${esc(slide.subtitle)}</p>` : ""}
</section>`;

    case "bio":
      return `<section data-transition="slide">
  <h2>${title}</h2>
  <p style="max-width:700px">${body}</p>
</section>`;

    case "discography":
      return `<section data-transition="slide">
  <h2>${title}</h2>
  <p>${body}</p>
</section>`;

    case "social":
      return `<section data-transition="slide">
  <h2>${title}</h2>
  <div class="stat-box">
    <div class="stat-value">${esc(slide.stat_value || "—")}</div>
    <div class="stat-label">${esc(slide.stat_label || "")}</div>
  </div>
</section>`;

    case "press":
      return `<section data-transition="slide">
  <h2>${title}</h2>
  <ul>
    ${(slide.bullets || []).map((b) => `<li>✦ ${esc(b)}</li>`).join("\n    ")}
  </ul>
</section>`;

    case "contact":
    case "cta":
      return `<section data-transition="fade" style="background:radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.3) 0%, transparent 70%)">
  <h2>${title}</h2>
  <p>${body}</p>
</section>`;

    default:
      return `<section><h2>${title}</h2><p>${body}</p></section>`;
  }
}
