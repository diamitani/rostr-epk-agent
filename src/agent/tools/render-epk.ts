/**
 * EPK Tool: render-epk + deploy-to-vercel
 * Implements skills/generate-epk.skill.md
 *
 * Outputs:
 *   - epk.html (native)
 *   - epk.pdf (via @vercel/sandbox)
 *   - epk-deck.html (Reveal.js)  → src/presentation/revealjs.ts
 *   - epk-deck.pptx              → src/presentation/pptxgenjs.ts
 *   - epk-presenton.pptx         → src/presentation/presenton.ts
 *   - Vercel deploy URL          → Vercel API
 *
 * All renderers below take an assembled EpkContent (see src/types.ts), built by
 * assembleEpkContent() from whatever this run's earlier steps actually stored.
 * Previously this file generated a decorative HTML/deck/PPTX shell that never
 * received the compiled bio/discography/social data at all — every section was
 * a literal bracketed placeholder string regardless of what the pipeline found.
 */

import type {
  ROSTRArtifact,
  PresentationOutputType,
  VercelDeployResult,
  EpkContent,
  EPKIntake,
  DesignTokens,
} from "../../types";
import type { RunStore } from "../store";
import { bodyOf } from "../store";
import type { TrackMetadata } from "./extract-metadata";
import type { SocialProfile, EngagementScore } from "./social-data";
import { buildRevealJSDeck } from "../../presentation/revealjs";
import { buildPPTX } from "../../presentation/pptxgenjs";
import { buildPresentonSlides } from "../../presentation/presenton";

const DEFAULT_TOKENS: DesignTokens = {
  primary_color: "#8b5cf6",
  accent_color: "#f59e0b",
  background_color: "#0a0a0f",
  text_color: "#f8f8ff",
  font_heading: "Outfit",
  font_body: "Inter",
};

function assembleEpkContent(artistSlug: string, store: RunStore): EpkContent {
  const intake = store.getData<EPKIntake>("intake");
  const tracks = store.getData<TrackMetadata[]>("tracks") || [];
  const profiles = store.getData<SocialProfile[]>("profiles") || [];
  const engagement = store.getData<EngagementScore>("engagement");
  const summaries =
    store.getData<Array<{ title: string; publication: string; url: string; summary: string }>>(
      "press_summaries"
    ) || [];

  const bioLong = bodyOf(store.content("bio-long.md"));
  const bioShort = bodyOf(store.content("bio-short.md"));

  return {
    artistName: intake?.artist_name || artistSlug.replace(/-/g, " "),
    genre: intake?.genre || "unknown",
    templateKey: store.getData<string>("templateKey") || intake?.template || "general",
    bioLong: bioLong || "Bio not yet generated for this run.",
    bioShort: bioShort || "",
    discographyLines: tracks
      .filter((t) => t.title !== "unknown")
      .map((t) => `${t.title} — ${t.artist} (${t.platform})`),
    socialLines: profiles
      .filter((p) => !p.error || p.followers)
      .map(
        (p) =>
          `${p.platform}: ${p.followers != null ? p.followers.toLocaleString() + " followers" : p.handle || p.url}`
      ),
    engagementScore: engagement?.score,
    engagementTier: engagement?.tier,
    pressLines: summaries.map((s) => `${s.title} — ${s.publication}`),
    contact: {
      manager: intake?.manager_name,
      booking_email: intake?.booking_email,
      website: intake?.website_url,
    },
    tokens: store.getData<DesignTokens>("tokens") || DEFAULT_TOKENS,
    sections: store.getData<string[]>("sections") || [],
  };
}

export async function renderEPK(
  runId: string,
  artistSlug: string,
  outputs: PresentationOutputType[],
  store: RunStore
): Promise<{
  artifacts: Record<string, ROSTRArtifact>;
  output_urls: Record<string, string>;
}> {
  const now = new Date().toISOString();
  const artifacts: Record<string, ROSTRArtifact> = {};
  const output_urls: Record<string, string> = {};
  const content = assembleEpkContent(artistSlug, store);

  // ── HTML EPK (always generated) ────────────────────────────────────────────
  if (outputs.includes("html")) {
    const html = buildEPKHtml(artistSlug, runId, content);
    artifacts["epk.html"] = makeArtifact(
      "epk.html",
      "generate-epk",
      ["enhanced.md", "bio-long.md", "epk-design-system.json"],
      html,
      now
    );
    // Stored so deploy_to_vercel can reuse the exact rendered page instead of
    // re-rendering a second, possibly-empty copy.
    store.setData("epk.html", html);
  }

  // ── PDF (via Vercel Sandbox) ───────────────────────────────────────────────
  if (outputs.includes("pdf")) {
    const html = store.getData<string>("epk.html") || buildEPKHtml(artistSlug, runId, content);
    const pdfResult = await generatePDFViaSandbox(html);
    artifacts["epk.pdf"] = makeArtifact(
      "epk.pdf",
      "generate-epk",
      ["epk.html"],
      pdfResult.content,
      now
    );
    if (pdfResult.url) output_urls["pdf"] = pdfResult.url;
  }

  // ── Reveal.js deck ────────────────────────────────────────────────────────
  if (outputs.includes("reveal-js")) {
    const deckHtml = await buildRevealJSDeck(artistSlug, runId, content);
    artifacts["epk-deck.html"] = makeArtifact(
      "epk-deck.html",
      "generate-epk",
      ["enhanced.md"],
      deckHtml,
      now
    );
  }

  // ── PPTX ─────────────────────────────────────────────────────────────────
  if (outputs.includes("pptx")) {
    const pptxBuffer = await buildPPTX(artistSlug, runId, content);
    artifacts["epk-deck.pptx"] = makeArtifact(
      "epk-deck.pptx",
      "generate-epk",
      ["enhanced.md"],
      `[binary: ${pptxBuffer.byteLength} bytes]`,
      now
    );
    output_urls["pptx"] = `/api/epk/download/${runId}/epk-deck.pptx`;
  }

  // ── Presenton AI slides ────────────────────────────────────────────────────
  if (outputs.includes("presenton")) {
    const presentonResult = await buildPresentonSlides(artistSlug, runId, content);
    artifacts["epk-presenton.pptx"] = makeArtifact(
      "epk-presenton.pptx",
      "generate-epk",
      ["enhanced.md"],
      presentonResult.content,
      now
    );
    if (presentonResult.download_url)
      output_urls["presenton"] = presentonResult.download_url;
  }

  return { artifacts, output_urls };
}

// ─── Vercel Deploy ────────────────────────────────────────────────────────────
// ROSTR rule: deploy requires approved: true (checked in harness.ts tool def)

export async function deployToVercel(
  runId: string,
  artistSlug: string,
  projectName: string,
  customDomain: string | undefined,
  store: RunStore
): Promise<VercelDeployResult> {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

  // Reuse the HTML this run already rendered (with real content) rather than
  // silently re-rendering a second, blank copy.
  const html =
    store.getData<string>("epk.html") ||
    buildEPKHtml(artistSlug, runId, assembleEpkContent(artistSlug, store));

  // If no Vercel token, return setup instructions (for new users)
  if (!VERCEL_TOKEN) {
    return {
      url: "",
      deployment_id: "",
      status: "error",
      setup_instructions: buildVercelSetupInstructions(
        artistSlug,
        projectName,
        customDomain
      ),
    };
  }

  try {
    // Create Vercel deployment via API
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName.toLowerCase().replace(/\s+/g, "-"),
        files: [
          {
            file: "index.html",
            data: html,
            encoding: "utf-8",
          },
        ],
        projectSettings: {
          framework: null, // Static HTML
        },
        meta: {
          rostr_run_id: runId,
          artist_slug: artistSlug,
        },
      }),
    });

    if (!deployRes.ok) {
      const err = await deployRes.json();
      throw new Error(err.error?.message || "Vercel deploy failed");
    }

    const deploy = await deployRes.json();
    const deployUrl = `https://${deploy.url}`;

    // Optionally add custom domain
    if (customDomain && deploy.projectId) {
      await addVercelDomain(deploy.projectId, customDomain, VERCEL_TOKEN);
    }

    return {
      url: deployUrl,
      deployment_id: deploy.id,
      status: deploy.readyState === "READY" ? "ready" : "building",
    };
  } catch {
    return {
      url: "",
      deployment_id: "",
      status: "error",
      setup_instructions: buildVercelSetupInstructions(
        artistSlug,
        projectName,
        customDomain
      ),
    };
  }
}

async function addVercelDomain(
  projectId: string,
  domain: string,
  token: string
): Promise<void> {
  await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });
}

// ─── Vercel Setup Instructions (for users without a Vercel account) ──────────

function buildVercelSetupInstructions(
  artistSlug: string,
  projectName: string,
  customDomain?: string
) {
  return {
    step_1:
      "🆓 Create a free Vercel account at https://vercel.com/signup (free tier is generous — no credit card required for hobby/personal projects)",
    step_2:
      "⚙️ Install the Vercel CLI: `npm install -g vercel` then run `vercel login` to authenticate",
    step_3: customDomain
      ? `🌐 After deploying, add your custom domain in the Vercel dashboard: Project Settings → Domains → Add ${customDomain}. Point your DNS CNAME to cname.vercel-dns.com`
      : "🌐 Your EPK will get a free .vercel.app subdomain automatically (e.g. my-artist-epk.vercel.app)",
    signup_url: "https://vercel.com/signup",
    cli_commands: [
      "npm install -g vercel",
      "vercel login",
      `vercel --name ${projectName.toLowerCase().replace(/\s+/g, "-")}`,
      ...(customDomain
        ? [
            `vercel domains add ${customDomain}`,
            `# Then update your DNS: CNAME @ → cname.vercel-dns.com`,
          ]
        : []),
    ],
    env_vars: [
      "# After creating your account, get your token from:",
      "# https://vercel.com/account/tokens",
      "VERCEL_TOKEN=your_token_here",
    ],
  };
}

// ─── PDF via Vercel Sandbox ───────────────────────────────────────────────────

async function generatePDFViaSandbox(
  htmlContent: string
): Promise<{ content: string; url?: string }> {
  // Vercel Sandbox is used for secure Puppeteer PDF generation
  // Falls back to instructions if sandbox not configured
  try {
    const { Sandbox } = await import("@vercel/sandbox");
    const sandbox = await Sandbox.create();

    await sandbox.fs.writeFile("/tmp/epk.html", htmlContent);

    const cmd = await sandbox.runCommand("npx puppeteer-cli print /tmp/epk.html /tmp/epk.pdf --format A4");
    await cmd.wait();

    const pdfBuffer = await sandbox.fs.readFile("/tmp/epk.pdf");
    await sandbox.stop();

    return { content: `[PDF generated: ${pdfBuffer ? "ok" : "failed"}]` };
  } catch {
    // Sandbox not available — return PDF generation instructions
    return {
      content:
        "[PDF: Install @vercel/sandbox or use browser print-to-PDF on the rendered EPK HTML]",
    };
  }
}

// ─── HTML EPK renderer ────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p.trim())}</p>`)
    .join("\n");
}

function listOrEmpty(items: string[], emptyLabel: string): string {
  if (!items.length) return `<p><em>${esc(emptyLabel)}</em></p>`;
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function buildEPKHtml(artistSlug: string, runId: string, content: EpkContent): string {
  const t = content.tokens;
  const contactLines = [
    content.contact.manager ? `Manager: ${esc(content.contact.manager)}` : null,
    content.contact.booking_email ? `Booking: ${esc(content.contact.booking_email)}` : null,
    content.contact.website ? `Website: ${esc(content.contact.website)}` : null,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(content.artistName)} — Electronic Press Kit</title>
  <meta name="description" content="Electronic Press Kit for ${esc(content.artistName)}">
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${t.font_heading.replace(/ /g, "+")}:wght@300;400;600;700;900&family=${t.font_body.replace(/ /g, "+")}:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${t.primary_color};
      --accent: ${t.accent_color};
      --bg: ${t.background_color};
      --surface: color-mix(in srgb, ${t.background_color} 85%, white);
      --text: ${t.text_color};
      --muted: #6b7280;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: '${t.font_body}', sans-serif;
      line-height: 1.6;
    }
    .hero {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 4rem 2rem;
      background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--primary) 30%, transparent) 0%, transparent 70%);
    }
    h1 {
      font-family: '${t.font_heading}', sans-serif;
      font-size: clamp(2.5rem, 8vw, 6rem);
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: 0.95;
      background: linear-gradient(135deg, #fff 30%, var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }
    .subtitle { font-size: 1.1rem; color: var(--muted); }
    section {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    section p { margin-bottom: 1rem; opacity: 0.9; }
    h2 {
      font-family: '${t.font_heading}', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1.25rem;
    }
    .badge {
      display: inline-block;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
      color: var(--primary);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
    .stat-strip { display: flex; gap: 2rem; flex-wrap: wrap; }
    .stat { text-align: center; }
    .stat-value { font-family: '${t.font_heading}', sans-serif; font-size: 2rem; font-weight: 900; color: var(--accent); }
    .stat-label { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    ul { list-style: none; }
    ul li { padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    footer { text-align: center; padding: 2rem; color: var(--muted); font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="badge">Electronic Press Kit</div>
    <h1>${esc(content.artistName.toUpperCase())}</h1>
    <p class="subtitle">${esc(content.genre)} · Run ${runId.slice(0, 8)}</p>
  </div>

  <section>
    <h2>Bio</h2>
    ${paragraphs(content.bioLong)}
  </section>

  <section>
    <h2>Discography</h2>
    ${listOrEmpty(content.discographyLines, "No discography links were provided for this run.")}
  </section>

  <section>
    <h2>Social Analytics</h2>
    ${listOrEmpty(content.socialLines, "No social links were provided for this run.")}
    ${
      content.engagementScore != null
        ? `<div class="stat-strip"><div class="stat"><div class="stat-value">${content.engagementScore}</div><div class="stat-label">Engagement Score</div></div><div class="stat"><div class="stat-value">${esc(content.engagementTier || "")}</div><div class="stat-label">Tier</div></div></div>`
        : ""
    }
  </section>

  <section>
    <h2>Press Coverage</h2>
    ${listOrEmpty(content.pressLines, "No press links were provided for this run.")}
  </section>

  <section>
    <h2>Contact</h2>
    ${listOrEmpty(contactLines as string[], "No public contact info was approved for release.")}
  </section>

  <footer>
    Built with ROSTR EPK Agent · <a href="https://github.com/diamitani/rostr-epk-agent" style="color: var(--primary)">Plugin Repo</a>
  </footer>
</body>
</html>`;
}

function makeArtifact(
  type: string,
  skill: string,
  inputs: string[],
  content: string,
  now: string
): ROSTRArtifact {
  return {
    artifact_type: type,
    version: "1.0.0",
    status: "draft",
    owner_skill: skill,
    input_artifacts: inputs,
    confidence: 0.9,
    created_at: now,
    content,
  };
}
