/**
 * Presentation Layer: Reveal.js
 * Builds a responsive, animated HTML5 presentation deck from enhanced.md
 * using Reveal.js v5 (CDN — no build step required).
 */

import type { SlideContent, PresentationSpec } from "../types";

export async function buildRevealJSDeck(
  artistSlug: string,
  runId: string,
  spec?: Partial<PresentationSpec>
): Promise<string> {
  const slides: SlideContent[] = [
    {
      type: "cover",
      title: artistSlug.replace(/-/g, " ").toUpperCase(),
      subtitle: spec?.slides?.[0]?.subtitle || "Electronic Press Kit",
    },
    {
      type: "bio",
      title: "Artist Bio",
      body: "[Long bio from bio-long.md]",
    },
    {
      type: "discography",
      title: "Discography",
      body: "[Track catalog from discography.md]",
    },
    {
      type: "social",
      title: "Social Reach",
      stat_label: "Engagement Score",
      stat_value: "[score from engagement-score.md]",
    },
    {
      type: "press",
      title: "Press Coverage",
      bullets: ["[Press item 1]", "[Press item 2]", "[Press item 3]"],
    },
    {
      type: "contact",
      title: "Contact & Booking",
      body: "[Contact info from master.md]",
    },
  ];

  return generateRevealHTML(artistSlug, slides, spec);
}

function generateRevealHTML(
  artistSlug: string,
  slides: SlideContent[],
  spec?: Partial<PresentationSpec>
): string {
  const primary = spec?.theme?.primary_color || "#8b5cf6";
  const accent = spec?.theme?.accent_color || "#f59e0b";
  const bg = spec?.theme?.background_color || "#0a0a0f";
  const text = spec?.theme?.text_color || "#f8f8ff";
  const fontHeading = spec?.theme?.font_heading || "Outfit";
  const fontBody = spec?.theme?.font_body || "Inter";

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
  switch (slide.type) {
    case "cover":
      return `<section class="cover-slide" data-transition="zoom">
  <div class="badge">Electronic Press Kit</div>
  <h1>${slide.title}</h1>
  ${slide.subtitle ? `<p style="font-size:1.3rem;margin-top:1rem;color:rgba(255,255,255,0.5)">${slide.subtitle}</p>` : ""}
</section>`;

    case "bio":
      return `<section data-transition="slide">
  <h2>${slide.title}</h2>
  <p style="max-width:700px">${slide.body || ""}</p>
</section>`;

    case "discography":
      return `<section data-transition="slide">
  <h2>${slide.title}</h2>
  <p>${slide.body || ""}</p>
</section>`;

    case "social":
      return `<section data-transition="slide">
  <h2>${slide.title}</h2>
  <div class="stat-box">
    <div class="stat-value">${slide.stat_value || "—"}</div>
    <div class="stat-label">${slide.stat_label || ""}</div>
  </div>
</section>`;

    case "press":
      return `<section data-transition="slide">
  <h2>${slide.title}</h2>
  <ul>
    ${(slide.bullets || []).map((b) => `<li>✦ ${b}</li>`).join("\n    ")}
  </ul>
</section>`;

    case "contact":
    case "cta":
      return `<section data-transition="fade" style="background:radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.3) 0%, transparent 70%)">
  <h2>${slide.title}</h2>
  <p>${slide.body || ""}</p>
</section>`;

    default:
      return `<section><h2>${slide.title}</h2><p>${slide.body || ""}</p></section>`;
  }
}
