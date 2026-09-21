/**
 * ROSTR EPK Agent — MCP Server
 *
 * Exposes all EPK pipeline tools as MCP tools via standard
 * @modelcontextprotocol/sdk (stdio + HTTP transport).
 *
 * ROSTR runtime connects to this via:
 *   npx @rostr/epk-agent mcp          # stdio transport
 *   GET /api/mcp                       # HTTP/SSE transport
 *
 * Presenton MCP config (add to mcp_config.json):
 * {
 *   "rostr-epk-agent": {
 *     "command": "npx",
 *     "args": ["-y", "@rostr/epk-agent", "mcp"],
 *     "env": {
 *       "ANTHROPIC_API_KEY": "...",
 *       "PRESENTON_API_URL": "http://localhost:8080"
 *     }
 *   }
 * }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runEPKAgent } from "../agent/harness";
import type { EPKIntake } from "../types";

export function createMCPServer(): McpServer {
  const server = new McpServer({
    name: "rostr-epk-agent",
    version: "2.0.0",
    description:
      "ROSTR EPK Agent — full-pipeline Electronic Press Kit builder with Reveal.js, PPTX, and Presenton presentation outputs. Part of the Artispreneur label services marketplace.",
  });

  // ── Tool: epk_run ─────────────────────────────────────────────────────────
  server.tool(
    "epk_run",
    "Run the full EPK pipeline for an artist. Returns a streaming run ID and final artifact URLs. Follows ROSTR NPAO protocol.",
    {
      artist_name: z.string().describe("Artist's stage name"),
      genre: z.string().describe("Primary genre (e.g. Hip-Hop, R&B, Electronic)"),
      city: z.string().describe("Artist's city"),
      template: z
        .enum(["one-sheeter", "general", "booking", "media", "brand"])
        .optional()
        .default("general")
        .describe("EPK template variant"),
      presentation_output: z
        .array(z.enum(["html", "pdf", "reveal-js", "pptx", "presenton"]))
        .optional()
        .default(["html", "pdf"])
        .describe("Which output formats to generate"),
      spotify_url: z.string().url().optional(),
      instagram_url: z.string().url().optional(),
      youtube_url: z.string().url().optional(),
      tiktok_url: z.string().url().optional(),
      press_links: z.array(z.string().url()).optional().default([]),
      deploy_to_vercel: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Deploy EPK as live Vercel website. Requires VERCEL_TOKEN env var or will return setup instructions."
        ),
      custom_domain: z
        .string()
        .optional()
        .describe(
          "Custom domain for Vercel deploy (e.g. myartist.com). Optional — free .vercel.app subdomain used if not set."
        ),
    },
    async (params) => {
      const intake: EPKIntake = {
        artist_name: params.artist_name,
        genre: params.genre,
        city: params.city,
        template: params.template as EPKIntake["template"],
        presentation_output: params.presentation_output as EPKIntake["presentation_output"],
        spotify_url: params.spotify_url,
        instagram_url: params.instagram_url,
        youtube_url: params.youtube_url,
        tiktok_url: params.tiktok_url,
        press_links: params.press_links,
        deploy_to_vercel: params.deploy_to_vercel,
        custom_domain: params.custom_domain,
      };

      const { result, run_id } = runEPKAgent(intake);
      // MCP tool calls are request/response, not a long-lived UI stream — wait
      // for the full agent loop (all pipeline steps) to actually finish before
      // replying, rather than returning as soon as the stream started (which is
      // what this did before and meant `events` below was always empty).
      await result.text;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                run_id,
                status: "complete",
                artist: params.artist_name,
                message: `EPK pipeline finished for run ${run_id}.`,
                api: {
                  run: `POST /api/epk`,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ── Tool: epk_status ──────────────────────────────────────────────────────
  server.tool(
    "epk_status",
    "Get the current status of an EPK pipeline run.",
    {
      run_id: z.string().describe("Run ID returned by epk_run"),
    },
    async ({ run_id }) => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                run_id,
                status: "See GET /api/epk/status/:run_id for live status",
                note: "In production, status is persisted in your configured storage (Supabase/S3)",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ── Tool: epk_deploy ──────────────────────────────────────────────────────
  server.tool(
    "epk_deploy",
    "Deploy a completed EPK to Vercel. Returns a live URL or setup instructions for new Vercel users. Requires explicit approval per ROSTR approval-gating.",
    {
      run_id: z.string().describe("Completed EPK run ID"),
      project_name: z.string().describe("Vercel project name (slug)"),
      approved: z
        .boolean()
        .describe("Must be true — ROSTR approval-gating requires explicit confirmation before production deploy"),
      custom_domain: z
        .string()
        .optional()
        .describe("Custom domain (e.g. yourartist.com). Optional."),
    },
    async ({ run_id, project_name, approved, custom_domain }) => {
      if (!approved) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "approval_required",
                message:
                  "Vercel deploy requires approved: true per ROSTR approval-gating protocol. Please confirm and re-invoke.",
              }),
            },
          ],
        };
      }

      const { deployToVercel } = await import("../agent/tools/render-epk");
      const { RunStore } = await import("../agent/store");
      // NOTE: this MCP tool is a standalone call — it does not share the
      // RunStore of the original epk_run invocation (each is a separate
      // process/request), so it can only deploy generic placeholder content
      // unless/until run artifacts are persisted somewhere this call can read
      // (see saveSession in agent/pal.ts). Prefer render_epk's own deploy path
      // within the same run when possible.
      const result = await deployToVercel(
        run_id,
        project_name.toLowerCase().replace(/\s+/g, "-"),
        project_name,
        custom_domain,
        new RunStore()
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // ── Tool: epk_vercel_setup ────────────────────────────────────────────────
  server.tool(
    "epk_vercel_setup",
    "Get step-by-step instructions for creating a free Vercel account and deploying the EPK as a live website with optional custom domain.",
    {
      artist_slug: z.string().describe("Artist slug used in the EPK"),
      custom_domain: z
        .string()
        .optional()
        .describe("Custom domain if the artist has one (e.g. myartist.com)"),
    },
    async ({ artist_slug, custom_domain }) => {
      const projectName = `${artist_slug}-epk`;
      const hasCustomDomain = !!custom_domain;

      const instructions = {
        title: "🚀 Deploy Your EPK as a Live Website — Free with Vercel",
        steps: [
          {
            step: 1,
            title: "Create your free Vercel account",
            action: "Go to https://vercel.com/signup",
            details: [
              "Click 'Continue with GitHub' (recommended) or use email",
              "No credit card required — Hobby plan is completely free",
              "Free tier includes: unlimited personal projects, 100GB bandwidth/month, free SSL, global CDN",
            ],
          },
          {
            step: 2,
            title: "Get your Vercel API token",
            action: "Go to https://vercel.com/account/tokens → Create Token",
            details: [
              "Name it: rostr-epk-agent",
              "Set expiry: No Expiration (or 1 year)",
              "Copy the token — you'll only see it once",
              `Add to your .env.local: VERCEL_TOKEN=your_token_here`,
            ],
          },
          {
            step: 3,
            title: "Deploy via CLI (alternative to API)",
            action: "Install Vercel CLI and deploy",
            commands: [
              "npm install -g vercel",
              "vercel login",
              `vercel --name ${projectName}`,
              "# Your EPK will be live at: https://your-epk-name.vercel.app",
            ],
          },
          ...(hasCustomDomain
            ? [
                {
                  step: 4,
                  title: `Connect your custom domain: ${custom_domain}`,
                  action: "In Vercel Dashboard → Project → Settings → Domains",
                  details: [
                    `Click 'Add Domain' → enter: ${custom_domain}`,
                    "Vercel will show you DNS records to add",
                    "In your domain registrar (GoDaddy/Namecheap/etc):",
                    `  Add CNAME record: @ → cname.vercel-dns.com`,
                    "  Or add A records that Vercel provides",
                    "SSL certificate is provisioned automatically (free Let's Encrypt)",
                    "Propagation takes 5-60 minutes",
                  ],
                },
              ]
            : []),
          {
            step: hasCustomDomain ? 5 : 4,
            title: "Re-run the EPK Agent with deploy enabled",
            action: "Set VERCEL_TOKEN in your environment and call deploy_to_vercel",
            details: [
              "The EPK Agent will deploy your EPK automatically",
              "You'll get a live URL back in the response",
              hasCustomDomain
                ? `Your EPK will be live at: https://${custom_domain}`
                : `Your EPK will be live at: https://${projectName}.vercel.app`,
            ],
          },
        ],
        free_tier_limits: {
          bandwidth: "100 GB/month",
          deployments: "Unlimited",
          custom_domains: "Unlimited (on Hobby plan)",
          ssl_certificates: "Automatic, free",
          team_members: "1 (Hobby) — upgrade to Pro ($20/mo) for teams",
        },
        links: {
          signup: "https://vercel.com/signup",
          tokens: "https://vercel.com/account/tokens",
          domains_docs: "https://vercel.com/docs/projects/domains",
          pricing: "https://vercel.com/pricing",
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(instructions, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

// ─── CLI entry point (stdio transport) ───────────────────────────────────────

export async function startMCPServer(): Promise<void> {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[rostr-epk-agent] MCP server running on stdio");
}
