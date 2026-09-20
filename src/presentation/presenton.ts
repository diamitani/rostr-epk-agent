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

export async function buildPresentonSlides(
  artistSlug: string,
  runId: string
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
    const generateRes = await fetch(`${PRESENTON_URL}/api/v1/presentations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PRESENTON_KEY ? { Authorization: `Bearer ${PRESENTON_KEY}` } : {}),
      },
      body: JSON.stringify({
        topic: buildPresentationTopic(artistSlug),
        n_slides: 8,
        theme: "dark",
        language: "en",
        extra_info: buildExtraInfo(artistSlug, runId),
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
  runId: string
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
  return buildPresentonSlides(artistSlug, runId);
}

function buildPresentationTopic(artistSlug: string): string {
  return `Electronic Press Kit for music artist: ${artistSlug.replace(/-/g, " ")}. Create a professional EPK presentation for music industry professionals including talent buyers, promoters, and press.`;
}

function buildExtraInfo(artistSlug: string, runId: string): string {
  return `
Artist: ${artistSlug.replace(/-/g, " ")}
Run ID: ${runId}

Slide structure:
1. Cover — Artist name, genre badge
2. Artist Biography — Narrative overview
3. Discography — Key releases and catalog highlights
4. Social Analytics — Follower counts, engagement score
5. Press Coverage — Notable features and reviews
6. Live Performance — Tour history and notable venues
7. Contact & Booking — Manager info, booking email
8. Call to Action — Next steps for industry professionals

Style: Dark, premium, music industry aesthetic. Clean typography, minimal text per slide.
Do NOT fabricate statistics, press quotes, or streaming numbers. Use placeholder brackets for unknown data.
  `.trim();
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
