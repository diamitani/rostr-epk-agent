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
 */

import type {
  ROSTRArtifact,
  PresentationOutputType,
  VercelDeployResult,
} from "../../types";
import { buildRevealJSDeck } from "../../presentation/revealjs";
import { buildPPTX } from "../../presentation/pptxgenjs";
import { buildPresentonSlides } from "../../presentation/presenton";

export async function renderEPK(
  runId: string,
  artistSlug: string,
  outputs: PresentationOutputType[]
): Promise<{
  artifacts: Record<string, ROSTRArtifact>;
  output_urls: Record<string, string>;
}> {
  const now = new Date().toISOString();
  const artifacts: Record<string, ROSTRArtifact> = {};
  const output_urls: Record<string, string> = {};

  // ── HTML EPK (always generated) ────────────────────────────────────────────
  if (outputs.includes("html")) {
    const html = buildEPKHtml(artistSlug, runId);
    artifacts["epk.html"] = makeArtifact(
      "epk.html",
      "generate-epk",
      ["enhanced.md", "bio-long.md", "epk-design-system.json"],
      html,
      now
    );
  }

  // ── PDF (via Vercel Sandbox) ───────────────────────────────────────────────
  if (outputs.includes("pdf")) {
    const pdfResult = await generatePDFViaSandbox(artistSlug, runId);
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
    const deckHtml = await buildRevealJSDeck(artistSlug, runId);
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
    const pptxBuffer = await buildPPTX(artistSlug, runId);
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
    const presentonResult = await buildPresentonSlides(artistSlug, runId);
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
  customDomain?: string
): Promise<VercelDeployResult> {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

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
            data: buildEPKHtml(artistSlug, runId),
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
  } catch (err) {
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
  artistSlug: string,
  runId: string
): Promise<{ content: string; url?: string }> {
  // Vercel Sandbox is used for secure Puppeteer PDF generation
  // Falls back to instructions if sandbox not configured
  try {
    const { Sandbox } = await import("@vercel/sandbox");
    const sandbox = await Sandbox.create();

    const htmlContent = buildEPKHtml(artistSlug, runId);
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

function buildEPKHtml(artistSlug: string, runId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPK — ${artistSlug}</title>
  <meta name="description" content="Electronic Press Kit for ${artistSlug}">
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #8b5cf6;
      --accent: #f59e0b;
      --bg: #0a0a0f;
      --surface: #13131a;
      --text: #f8f8ff;
      --muted: #6b7280;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
    }
    .hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 4rem 2rem;
      background: radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 70%);
    }
    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(3rem, 10vw, 8rem);
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: 0.9;
      background: linear-gradient(135deg, #fff 30%, var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1.5rem;
    }
    .subtitle {
      font-size: 1.25rem;
      color: var(--muted);
      margin-bottom: 3rem;
    }
    section {
      max-width: 900px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
    }
    .badge {
      display: inline-block;
      background: rgba(139,92,246,0.15);
      border: 1px solid rgba(139,92,246,0.4);
      color: #a78bfa;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
    footer {
      text-align: center;
      padding: 2rem;
      color: var(--muted);
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="badge">Electronic Press Kit</div>
    <h1>${artistSlug.replace(/-/g, " ").toUpperCase()}</h1>
    <p class="subtitle">Generated by ROSTR EPK Agent · Run ${runId.slice(0, 8)}</p>
  </div>

  <section>
    <h2>Bio</h2>
    <p><em>[Bio populated from bio-long.md artifact]</em></p>
  </section>

  <section>
    <h2>Discography</h2>
    <p><em>[Discography populated from discography.md artifact]</em></p>
  </section>

  <section>
    <h2>Social Analytics</h2>
    <p><em>[Engagement score and platform data from social-media-raw artifact]</em></p>
  </section>

  <section>
    <h2>Press Coverage</h2>
    <p><em>[Press summaries from press-link-summary artifact]</em></p>
  </section>

  <section>
    <h2>Contact</h2>
    <p><em>[Contact info from master.md — only fields approved for public release]</em></p>
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
