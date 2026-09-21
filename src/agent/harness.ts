// @ts-nocheck — Vercel AI SDK v7 tool() generics; runtime types are correct
import { streamText, generateText, tool, createGateway } from "ai";

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type {
  EPKIntake,
  EPKPipelineState,
  EPKPipelineEvent,
  ROSTRArtifact,
} from "../types";
import { RunStore } from "./store";
import type { TrackMetadata } from "./tools/extract-metadata";

// ─── AI Gateway model (routes through Vercel AI Gateway) ─────────────────────

const gateway = createGateway({
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY || process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = gateway(
  process.env.DEFAULT_MODEL || "anthropic/claude-sonnet-4-5"
);

// ─── Tool definitions (Vercel AI SDK v7 tool schema) ─────────────────────────
// AI SDK v7: execute(input: INPUT, options: ToolExecutionOptions) — two args

/**
 * buildEpkTools — one RunStore per pipeline run, closed over by every tool's
 * execute() below. This is what lets compile_data/generate_bio/render_epk
 * actually see what format_inputs / extract_music_metadata / extract_social_data
 * / analyze_press_links / generate_design_system produced
 * earlier in the SAME run, instead of each tool call being an island whose
 * result only the LLM's transcript ever saw. ctx.intake/ctx.runId/ctx.artistSlug
 * are the authoritative values (set once from the actual API/MCP call) — tool
 * parameters that duplicate them (e.g. `artist_slug` on extract_music_metadata)
 * are accepted for prompt-compatibility but the trusted ctx values are what
 * get stored, so a model mistake in one arg can't desync the run.
 */
function buildEpkTools(ctx: { runId: string; artistSlug: string; intake: EPKIntake; store: RunStore }) {
  const { runId, artistSlug, intake, store } = ctx;
  store.setData("intake", intake);

  return {
    format_inputs: tool({
      description:
        "Compile raw EPK intake answers into a structured master.md artifact. Always the first skill to run.",
      parameters: z.object({
        intake: z.record(z.unknown()).describe("Raw EPK intake form data"),
      }),
      execute: async (_input: { intake: Record<string, unknown> }, _opts: ToolExecutionOptions) => {
        const { formatInputs } = await import("./tools/extract-metadata");
        const result = await formatInputs(intake);
        store.setArtifact("master.md", result.artifact);
        return result;
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
      execute: async (input: { music_links: string[]; artist_slug: string }, _opts: ToolExecutionOptions) => {
        const { extractMusicMetadata } = await import("./tools/extract-metadata");
        const result = await extractMusicMetadata(input.music_links, artistSlug);
        store.setArtifact("discography-raw", result.artifact);
        store.setData("tracks", result.tracks);
        return result;
      },
    }),

    extract_social_data: tool({
      description:
        "Pull follower counts, post engagement, and reach from Instagram, TikTok, YouTube, X, Facebook profiles.",
      parameters: z.object({
        social_links: z.array(z.string().url()),
        artist_slug: z.string(),
      }),
      execute: async (input: { social_links: string[]; artist_slug: string }, _opts: ToolExecutionOptions) => {
        const { extractSocialData } = await import("./tools/social-data");
        const result = await extractSocialData(input.social_links, artistSlug);
        store.setArtifact("social-media-raw", result.artifact);
        store.setData("profiles", result.profiles);
        store.setData("engagement", result.engagement);
        return result;
      },
    }),

    analyze_press_links: tool({
      description:
        "Fetch and summarize press articles, features, interviews linked in the EPK intake.",
      parameters: z.object({
        press_links: z.array(z.string().url()),
        artist_name: z.string(),
      }),
      execute: async (input: { press_links: string[]; artist_name: string }, _opts: ToolExecutionOptions) => {
        const { analyzePressLinks } = await import("./tools/compile-data");
        const result = await analyzePressLinks(input.press_links, intake.artist_name);
        store.setArtifact("press-link-summary", result.artifact);
        store.setData("press_summaries", result.summaries);
        return result;
      },
    }),

    create_discography: tool({
      description:
        "Finalize the raw discography extraction into a presentation-ready catalogue (discography.md + stats). Run after extract_music_metadata.",
      parameters: z.object({}),
      execute: async (_input: Record<string, never>, _opts: ToolExecutionOptions) => {
        const { createDiscography } = await import("./tools/create-discography");
        const tracks = store.getData<TrackMetadata[]>("tracks") || [];
        const result = await createDiscography(tracks);
        store.setArtifact("discography.md", result.artifact);
        store.setData("discography_csv", result.discography_csv);
        store.setData("discography_stats", result.stats);
        return result;
      },
    }),

    analyze_music_theme: tool({
      description:
        "Analyze the artist's musical theme/style from track metadata, genre, and their own influence/theme descriptions. Run after extract_music_metadata (or with an empty track list if no music links were supplied — it still uses the intake's genre/influences).",
      parameters: z.object({}),
      execute: async (_input: Record<string, never>, _opts: ToolExecutionOptions) => {
        const { analyzeMusicTheme } = await import("./tools/analyze-music-theme");
        const tracks = store.getData<TrackMetadata[]>("tracks") || [];
        const result = await analyzeMusicTheme(intake, tracks);
        store.setArtifact("music-theme-analysis.md", result.artifact);
        return result;
      },
    }),

    generate_design_system: tool({
      description:
        "Resolve the EPK design system (palette, type, section order) for the selected template. Run any time after intake is known — compile_data and render_epk both depend on it.",
      parameters: z.object({}),
      execute: async (_input: Record<string, never>, _opts: ToolExecutionOptions) => {
        const { generateDesignSystem } = await import("./tools/generate-design-system");
        const result = await generateDesignSystem(intake);
        store.setArtifact("epk-design-system.json", result.artifact);
        store.setData("tokens", result.tokens);
        store.setData("sections", result.sections);
        store.setData("templateKey", result.templateKey);
        return result;
      },
    }),

    compile_data: tool({
      description:
        "Merge master.md, discography, social data, engagement score, and press summaries into enhanced.md. Run after format_inputs and whichever of extract_music_metadata/extract_social_data/analyze_press_links were used.",
      parameters: z.object({
        run_id: z.string(),
        artist_slug: z.string(),
      }),
      execute: async (_input: { run_id: string; artist_slug: string }, _opts: ToolExecutionOptions) => {
        const { compileData } = await import("./tools/compile-data");
        const result = await compileData(runId, artistSlug, store);
        store.setArtifact("enhanced.md", result.artifact);
        return result;
      },
    }),

    generate_bio: tool({
      description:
        "Generate long-form (400w) and short-form (150w) artist bios from master.md and enhanced.md. Never fabricates facts. Run compile_data first.",
      parameters: z.object({
        run_id: z.string(),
        artist_slug: z.string(),
        tone: z
          .enum(["press", "booking", "social"])
          .default("press")
          .optional(),
      }),
      execute: async (input: { run_id: string; artist_slug: string; tone?: "press" | "booking" | "social" }, _opts: ToolExecutionOptions) => {
        const { generateBio } = await import("./tools/generate-bio");
        const result = await generateBio(runId, artistSlug, input.tone ?? "press", store);
        store.setArtifact("bio-long.md", result.bio_long);
        store.setArtifact("bio-short.md", result.bio_short);
        return result;
      },
    }),

    render_epk: tool({
      description:
        "Render final EPK as HTML, PDF, Reveal.js deck, PPTX, and/or Presenton AI slides. Run generate_bio and generate_design_system first — this pulls their real output from the run's artifact store.",
      parameters: z.object({
        run_id: z.string(),
        artist_slug: z.string(),
        outputs: z
          .array(z.enum(["html", "pdf", "reveal-js", "pptx", "presenton"]))
          .default(["html", "pdf"]),
      }),
      execute: async (input: { run_id: string; artist_slug: string; outputs: Array<"html" | "pdf" | "reveal-js" | "pptx" | "presenton"> }, _opts: ToolExecutionOptions) => {
        const { renderEPK } = await import("./tools/render-epk");
        return renderEPK(runId, artistSlug, input.outputs, store);
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
      execute: async (input: { run_id: string; artist_slug: string; project_name: string; custom_domain?: string; approved: boolean }, _opts: ToolExecutionOptions) => {
        if (!input.approved) {
          return {
            status: "approval_required",
            message:
              "Vercel production deploy requires explicit approval. Set approved: true to confirm.",
          };
        }
        const { deployToVercel } = await import("./tools/render-epk");
        return deployToVercel(runId, artistSlug, input.project_name, input.custom_domain, store);
      },
    }),
  };
}

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

  // One store per run — closed over by every tool below, so later steps
  // (compile_data, generate_bio, render_epk) can read what earlier steps in
  // THIS run actually produced instead of starting from nothing.
  const store = new RunStore();
  const epkTools = buildEpkTools({ runId: run_id, artistSlug: artist_slug, intake, store });

  // Run through Vercel AI SDK streamText with EPK tools
  const { fullStream } = streamText({
    model: DEFAULT_MODEL,
    system: systemPrompt,
    prompt: buildUserPrompt(intake, run_id, artist_slug),
    tools: epkTools,
    onStepFinish: ({ toolCalls, toolResults }) => {
      toolCalls?.forEach((tc, i) => {
        const result = toolResults?.[i];
        emit({
          type: result ? "skill_complete" : "skill_start",
          skill: tc.toolName,
          message: result
            ? `✅ ${tc.toolName} complete`
            : `▶️ Running ${tc.toolName}...`,
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
              JSON.stringify({ type: "text", delta: (chunk as { textDelta?: string }).textDelta ?? "" })
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
2. extract_music_metadata → discography-raw (skip if no music links were supplied)
3. In parallel: create_discography + analyze_music_theme + extract_social_data + analyze_press_links + generate_design_system
   (create_discography and analyze_music_theme depend on extract_music_metadata's output, or run with an
   empty track list if no music links were supplied; generate_design_system only needs intake, so it can
   run any time)
4. compile_data → enhanced.md (depends on format_inputs and whichever of the above ran)
5. generate_bio → bio-long.md + bio-short.md (depends on compile_data)
6. render_epk → html + pdf + reveal-js + pptx + presenton (depends on generate_bio and generate_design_system)
7. deploy_to_vercel (only if user requested, with approval)

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
