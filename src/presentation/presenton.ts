/**
 * Presentation Layer: Presenton
 *
 * Presenton is an open-source, self-hosted AI presentation generator.
 * Apache 2.0 — https://github.com/Presenton-ai/presenton
 *
 * Supports:
 *   - Self-hosted Docker: http://localhost:8080
 *   - Cloud hosted: https://api.presenton.ai
 *   - MCP server for agent-native invocation
 *
 * Setup (self-hosted):
 *   docker pull presenton/presenton
 *   docker run -p 8080:8080 -e OPENAI_API_KEY=... presenton/presenton
 *   # or with local Ollama:
 *   docker run -p 8080:8080 -e OLLAMA_BASE_URL=http://host.docker.internal:11434 presenton/presenton
 */

import type { EpkContent } from "../types";

export interface PresentonResult {
  content: string;
  download_url?: string;
  pptx_url?: string;
  pdf_url?: string;
  status: "success" | "error" | "not_configured";
  setup_instructions?: PresentonSetupInstructions;
}

export interface PresentonSetupInstructions {
  description: string;
  docker_command: string;
  api_url: string;
  env_var: string;
  repo: string;
}

/**
 * Builds the per-slide markdown Presenton's own `slides_markdown` input expects
 * (see github.com/presenton/presenton — passing this array skips Presenton's own
 * outline-generation LLM call and rephrase step, since our pipeline already
 * compiled real, sourced content; Presenton still selects/renders layouts from
 * its `layouts.json` template set).
 */
function buildSlidesMarkdown(content: EpkContent): string[] {
  const slides = [
    `# ${content.artistName}\n\n${content.genre}`,
    `## Bio\n\n${content.bioShort || content.bioLong || "Bio not yet generated for this run."}`,
    `## Discography\n\n${
      content.discographyLines.length
        ? content.discographyLines.map((l) => `- ${l}`).join("\n")
        : "No discography links were provided for this run."
    }`,
    `## Social Reach\n\n${
      content.socialLines.length
        ? content.socialLines.map((l) => `- ${l}`).join("\n")
        : "No social links were provided for this run."
    }${content.engagementScore != null ? `\n\n**Engagement score:** ${content.engagementScore}/100 (${content.engagementTier})` : ""}`,
    `## Press Coverage\n\n${
      content.pressLines.length
        ? content.pressLines.map((l) => `- ${l}`).join("\n")
        : "No press links were provided for this run."
    }`,
    `## Contact\n\n${
      [content.contact.booking_email, content.contact.manager, content.contact.website]
        .filter(Boolean)
        .join("  ·  ") || "No public contact info was approved for release."
    }`,
  ];
  return slides;
}

export async function buildPresentonSlides(
  artistSlug: string,
  runId: string,
  content: EpkContent
): Promise<PresentonResult> {
  const PRESENTON_URL = process.env.PRESENTON_API_URL;
  const PRESENTON_KEY = process.env.PRESENTON_API_KEY;

  if (!PRESENTON_URL) {
    return {
      content: "[Presenton: not configured — see setup_instructions]",
      status: "not_configured",
      setup_instructions: buildSetupInstructions(),
    };
  }

  try {
    // ── Step 1: Generate presentation via Presenton REST API ─────────────────
    // slides_markdown carries our already-compiled, sourced content — Presenton
    // maps it to layouts/theme rather than inventing its own outline from a topic.
    const generateRes = await fetch(`${PRESENTON_URL}/api/v1/presentations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PRESENTON_KEY ? { Authorization: `Bearer ${PRESENTON_KEY}` } : {}),
      },
      body: JSON.stringify({
        slides_markdown: buildSlidesMarkdown(content),
        n_slides: 6,
        theme: "dark",
        language: "en",
      }),
      signal: AbortSignal.timeout(60000), // Presenton can take 30-60s
    });

    if (!generateRes.ok) {
      const err = await generateRes.text();
      throw new Error(`Presenton API error: ${generateRes.status} — ${err}`);
    }

    const presentation = await generateRes.json();

    // ── Step 2: Export to PPTX ────────────────────────────────────────────────
    const exportRes = await fetch(
      `${PRESENTON_URL}/api/v1/presentations/${presentation.id}/export`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PRESENTON_KEY ? { Authorization: `Bearer ${PRESENTON_KEY}` } : {}),
        },
        body: JSON.stringify({ format: "pptx" }),
      }
    );

    const exported = exportRes.ok ? await exportRes.json() : null;

    return {
      content: JSON.stringify(presentation, null, 2),
      status: "success",
      download_url: exported?.download_url || `${PRESENTON_URL}/api/v1/presentations/${presentation.id}/download`,
      pptx_url: exported?.pptx_url,
      pdf_url: exported?.pdf_url,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    // If Presenton isn't reachable, return graceful setup instructions
    return {
      content: `[Presenton: ${msg}]`,
      status: "error",
      setup_instructions: buildSetupInstructions(),
    };
  }
}

// ─── MCP-native invocation (for ROSTR runtime with MCP server) ───────────────

export async function invokePresentonMCP(
  artistSlug: string,
  runId: string,
  content: EpkContent
): Promise<PresentonResult> {
  // When the ROSTR runtime has Presenton's MCP server connected,
  // this is the preferred invocation path.
  //
  // Presenton MCP tool: "create_presentation"
  // See: https://presenton.ai/mcp
  //
  // The MCP server is configured in mcp_config.json:
  // {
  //   "presenton": {
  //     "command": "npx",
  //     "args": ["-y", "@presenton/mcp-server"],
  //     "env": { "PRESENTON_API_URL": "http://localhost:8080" }
  //   }
  // }

  // Fallback to REST API if MCP not available
  return buildPresentonSlides(artistSlug, runId, content);
}

function buildSetupInstructions(): PresentonSetupInstructions {
  return {
    description:
      "Presenton is a free, open-source AI presentation generator. Run it locally with Docker (no account needed) or use the hosted version at presenton.ai.",
    docker_command:
      "docker run -d -p 8080:8080 -e OPENAI_API_KEY=your_key presenton/presenton\n# OR with local Ollama (free, no API key):\ndocker run -d -p 8080:8080 -e OLLAMA_BASE_URL=http://host.docker.internal:11434 presenton/presenton",
    api_url: "http://localhost:8080",
    env_var: "PRESENTON_API_URL=http://localhost:8080",
    repo: "https://github.com/Presenton-ai/presenton",
  };
}
