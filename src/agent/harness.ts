/**
 * ROSTR EPK Agent — Vercel AI SDK Harness
 *
 * Wires the EPK pipeline to the Vercel AI SDK (streamText + tool calling)
 * through AI Gateway for model routing. Follows ROSTR NPAO pattern:
 *   P (Parse) → A (Approve) → L (Launch) → O (Observe)
 *
 * ROSTR runtime invokes this via:
 *   POST /api/epk  { intake, options }
 *   or MCP tool: epk_agent_run
 */

import { streamText, generateText, tool, createGateway } from "ai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type {
  EPKIntake,
  EPKPipelineState,
  EPKPipelineEvent,
  ROSTRArtifact,
} from "../types";
import { runPipeline } from "./pipeline";

// ─── AI Gateway model (routes through Vercel AI Gateway) ─────────────────────

const gateway = createGateway({
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY || process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = gateway(
  process.env.DEFAULT_MODEL || "anthropic/claude-sonnet-4-5"
);

// ─── Tool definitions (Vercel AI SDK tool schema) ────────────────────────────

const epkTools = {
  format_inputs: tool({
    description:
      "Compile raw EPK intake answers into a structured master.md artifact. Always the first skill to run.",
    parameters: z.object({
      intake: z.record(z.unknown()).describe("Raw EPK intake form data"),
    }),
    execute: async ({ intake }) => {
      const { formatInputs } = await import("./tools/extract-metadata");
      return formatInputs(intake as EPKIntake);
    },
  }),

  extract_music_metadata: tool({
    description:
      "Extract track metadata (ISRC, BPM, key, duration, release date) from Spotify, Apple Music, SoundCloud, YouTube, Pandora, Suno links.",
    parameters: z.object({
      music_links: z
        .array(z.string().url())
        .describe("Music platform URLs to extract metadata from"),
      artist_slug: z.string(),
    }),
    execute: async ({ music_links, artist_slug }) => {
      const { extractMusicMetadata } = await import("./tools/extract-metadata");
      return extractMusicMetadata(music_links, artist_slug);
    },
  }),

  extract_social_data: tool({
    description:
      "Pull follower counts, post engagement, and reach from Instagram, TikTok, YouTube, X, Facebook profiles.",
    parameters: z.object({
      social_links: z.array(z.string().url()),
      artist_slug: z.string(),
    }),
    execute: async ({ social_links, artist_slug }) => {
      const { extractSocialData } = await import("./tools/social-data");
      return extractSocialData(social_links, artist_slug);
    },
  }),

  analyze_press_links: tool({
    description:
      "Fetch and summarize press articles, features, interviews linked in the EPK intake.",
    parameters: z.object({
      press_links: z.array(z.string().url()),
      artist_name: z.string(),
    }),
    execute: async ({ press_links, artist_name }) => {
      const { analyzePressLinks } = await import("./tools/compile-data");
      return analyzePressLinks(press_links, artist_name);
    },
  }),

  compile_data: tool({
    description:
      "Merge master.md, discography, social data, engagement score, press summaries, contacts, and design tokens into enhanced.md.",
    parameters: z.object({
      run_id: z.string(),
      artist_slug: z.string(),
    }),
    execute: async ({ run_id, artist_slug }) => {
      const { compileData } = await import("./tools/compile-data");
      return compileData(run_id, artist_slug);
    },
  }),

  generate_bio: tool({
    description:
      "Generate long-form (400w) and short-form (150w) artist bios from master.md and enhanced.md. Never fabricates facts.",
    parameters: z.object({
      run_id: z.string(),
      artist_slug: z.string(),
      tone: z
        .enum(["press", "booking", "social"])
        .default("press")
        .optional(),
    }),
    execute: async ({ run_id, artist_slug, tone }) => {
      const { generateBio } = await import("./tools/generate-bio");
      return generateBio(run_id, artist_slug, tone || "press");
    },
  }),

  render_epk: tool({
    description:
      "Render final EPK as HTML, PDF, Reveal.js deck, PPTX, and/or Presenton AI slides from enhanced.md and design tokens.",
    parameters: z.object({
      run_id: z.string(),
      artist_slug: z.string(),
      outputs: z
        .array(
          z.enum(["html", "pdf", "reveal-js", "pptx", "presenton"])
        )
        .default(["html", "pdf"]),
    }),
    execute: async ({ run_id, artist_slug, outputs }) => {
      const { renderEPK } = await import("./tools/render-epk");
      return renderEPK(run_id, artist_slug, outputs);
    },
  }),

  deploy_to_vercel: tool({
    description:
      "Deploy the EPK HTML to Vercel as a live web app. Requires explicit approval. Also provides setup instructions for users who need to create a Vercel account.",
    parameters: z.object({
      run_id: z.string(),
      artist_slug: z.string(),
      project_name: z.string(),
      custom_domain: z
        .string()
        .optional()
        .describe(
          "Optional custom domain (e.g. myartist.com). If not set, uses Vercel subdomain."
        ),
      approved: z
        .boolean()
        .describe(
          "Must be true — explicit user approval required per ROSTR approval-gating."
        ),
    }),
    execute: async ({ run_id, artist_slug, project_name, custom_domain, approved }) => {
      if (!approved) {
        return {
          status: "approval_required",
          message:
            "Vercel production deploy requires explicit approval. Set approved: true to confirm.",
        };
      }
      const { deployToVercel } = await import("./tools/render-epk");
      return deployToVercel(run_id, artist_slug, project_name, custom_domain);
    },
  }),
};

// ─── ROSTR-compatible agent harness ──────────────────────────────────────────

export interface EPKAgentOptions {
  onEvent?: (event: EPKPipelineEvent) => void;
  onApprovalRequired?: (action: string) => Promise<boolean>;
}

/**
 * streamEPKAgent — main entry point for ROSTR runtime and API routes.
 * Returns an async generator of EPKPipelineEvents + a readable stream.
 */
export async function streamEPKAgent(
  intake: EPKIntake,
  options: EPKAgentOptions = {}
): Promise<{
  stream: ReadableStream;
  run_id: string;
}> {
  const run_id = uuidv4();
  const artist_slug = intake.artist_name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const emit = (event: EPKPipelineEvent) => {
    options.onEvent?.(event);
  };

  emit({
    type: "progress",
    message: `🎵 EPK Agent activated for ${intake.artist_name} [run: ${run_id}]`,
    data: { run_id, artist_slug, template: intake.template || "general" },
    timestamp: new Date().toISOString(),
  });

  // Build the system prompt from soul.md conventions
  const systemPrompt = buildSystemPrompt(intake);

  // Run through Vercel AI SDK streamText with EPK tools
  const { textStream, fullStream } = streamText({
    model: DEFAULT_MODEL,
    system: systemPrompt,
    prompt: buildUserPrompt(intake, run_id, artist_slug),
    tools: epkTools,
    maxSteps: 20, // Allow full pipeline depth
    onStepFinish: ({ toolCalls, toolResults }) => {
      toolCalls?.forEach((tc, i) => {
        const result = toolResults?.[i];
        emit({
          type: result ? "skill_complete" : "skill_start",
          skill: tc.toolName,
          message: result
            ? `✅ ${tc.toolName} complete`
            : `▶️ Running ${tc.toolName}...`,
          data: result ? { result: toolResults?.[i]?.result } : undefined,
          timestamp: new Date().toISOString(),
        });
      });
    },
  });

  // Convert to a ReadableStream of SSE-formatted events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendSSE = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        for await (const chunk of fullStream) {
          if (chunk.type === "text-delta") {
            sendSSE(
              JSON.stringify({ type: "text", delta: chunk.textDelta })
            );
          } else if (chunk.type === "tool-call") {
            sendSSE(
              JSON.stringify({
                type: "skill_start",
                skill: chunk.toolName,
                message: `▶️ Running ${chunk.toolName}...`,
                timestamp: new Date().toISOString(),
              })
            );
          } else if (chunk.type === "tool-result") {
            sendSSE(
              JSON.stringify({
                type: "skill_complete",
                skill: chunk.toolName,
                timestamp: new Date().toISOString(),
              })
            );
          } else if (chunk.type === "finish") {
            sendSSE(
              JSON.stringify({
                type: "pipeline_complete",
                message: `🎉 EPK complete for ${intake.artist_name}`,
                run_id,
                timestamp: new Date().toISOString(),
              })
            );
          }
        }
      } catch (err) {
        sendSSE(
          JSON.stringify({
            type: "error",
            message: err instanceof Error ? err.message : "Pipeline error",
            timestamp: new Date().toISOString(),
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  return { stream, run_id };
}

// ─── ROSTR-compliant system prompt (from soul.md) ────────────────────────────

function buildSystemPrompt(intake: EPKIntake): string {
  return `You are the EPK Agent for the ROSTR runtime — part of the Artispreneur label services marketplace.

## Identity
You are the best in the world at transforming an artist's raw submission into a professional, booker-ready Electronic Press Kit (EPK). You operate under the ROSTR soul/skill/artifact conventions.

## ROSTR Protocol
- NPAO Phase: P (Parse → compile intake → validate → run pipeline)
- Every output artifact carries: artifact_type, version, status, owner_skill, input_artifacts, confidence
- Never fabricate metrics, quotes, streaming counts, follower counts, or collaborations
- Mark unknown data points as \`unknown\` — never guess
- Approval gating: any Vercel production deploy requires explicit approval

## Pipeline order (execute tools in this sequence)
1. format_inputs → master.md
2. In parallel: extract_music_metadata + extract_social_data + analyze_press_links
3. compile_data → enhanced.md
4. generate_bio → bio-long.md + bio-short.md
5. render_epk → html + pdf + reveal-js + pptx + presenton
6. deploy_to_vercel (only if user requested, with approval)

## Artist context
Name: ${intake.artist_name}
Genre: ${intake.genre}
Template: ${intake.template || "general"}
Requested outputs: ${intake.presentation_output?.join(", ") || "html, pdf"}
Vercel deploy: ${intake.deploy_to_vercel ? "YES — user requested (approval still required)" : "no"}

## Done means
All artifacts exist, every metric traces to a source, user has seen the EPK before any deploy.`;
}

function buildUserPrompt(
  intake: EPKIntake,
  run_id: string,
  artist_slug: string
): string {
  return `Run the full EPK pipeline for artist: "${intake.artist_name}"

Run ID: ${run_id}
Artist slug: ${artist_slug}

Intake data:
${JSON.stringify(intake, null, 2)}

Execute each pipeline step in order using the available tools. Start with format_inputs, then run the parallel extraction steps, then compile_data, generate_bio, and finally render_epk with all requested output formats: ${(intake.presentation_output || ["html", "pdf"]).join(", ")}.

${intake.deploy_to_vercel ? `After rendering is complete, use deploy_to_vercel with approved: true — the user has requested Vercel deployment.` : ""}`;
}
