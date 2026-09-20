/**
 * ROSTR PAL Engine — EPK Agent Integration
 *
 * PAL = Prompt Abstraction Layer
 * Source: github.com/diamitani/rostr-pal-skill
 * Canonical: rostr-paper.vercel.app/#pal
 *
 * PAL compiles natural language intent into structured agent manifests.
 * The five stages: Parse → Ambiguity Scan → Latent Intent → Expand → Compile
 *
 * ROSTR Hub (R-O-S-T-R):
 *   R — Runtime: PAL-compiled config that runs (this file)
 *   O — Orchestration: sequential pipeline w/ parallel fan-outs
 *   S — State: ContextEngine flat-file persistence
 *   T — Tools: Composio, Canva, Vercel, Presenton
 *   R — Reference: soul.md + SKILL.md + references/
 *
 * ContextEngine: flat-file session persistence at
 *   .context-engine/sessions/[artist-slug]/[run-id]-session.md
 */

import * as fs from "fs/promises";
import * as path from "path";
import type { EPKIntake, EPKPipelineState, ROSTRArtifact } from "../types";

// ─── PAL Stage Types ──────────────────────────────────────────────────────────

export interface PALManifest {
  /** P — Parse: explicit intent from user input */
  intent: {
    action: string;
    subject: string;
    outputs: string[];
    constraints: string[];
  };
  /** A — Ambiguity Scan: what's missing */
  ambiguities: AmbiguityFlag[];
  /** L — Latent Intent: the real job-to-be-done */
  jtbd: {
    primary: string;
    success_metric: string;
  };
  /** E — Expand: full artifact + tool plan */
  plan: {
    skills: SkillStep[];
    tools: string[];
    parallel_groups: string[][];
  };
  /** C — Compile: executable manifest */
  compiled: {
    system_prompt_source: string;
    model_routing: ModelRouting;
    tool_bindings: string[];
    artifact_contract: ArtifactContract;
  };
}

interface AmbiguityFlag {
  field: string;
  severity: "blocking" | "warning" | "info";
  message: string;
  default?: string;
}

interface SkillStep {
  skill: string;
  depends_on: string[];
  parallel_with?: string[];
  inputs: string[];
  outputs: string[];
}

interface ModelRouting {
  intake: string;
  generation: string;
  enrichment: string;
}

interface ArtifactContract {
  required: string[];
  optional: string[];
  approval_required: string[];
}

// ─── PAL Compiler ────────────────────────────────────────────────────────────

export function compilePAL(intake: EPKIntake): PALManifest {
  // P — Parse
  const intent = {
    action: "build",
    subject: `EPK for ${intake.artist_name}`,
    outputs: intake.presentation_output || ["html", "pdf"],
    constraints: [
      "no fabricated metrics",
      "approval required for vercel deploy",
      "all facts trace to source",
    ],
  };

  // A — Ambiguity Scan
  const ambiguities: AmbiguityFlag[] = [];
  if (!intake.genre || intake.genre.trim() === "") {
    ambiguities.push({
      field: "genre",
      severity: "blocking",
      message: "Genre is required — ask once before starting pipeline",
    });
  }
  if (!intake.spotify_url && !intake.soundcloud_url && !intake.apple_music_url) {
    ambiguities.push({
      field: "music_links",
      severity: "warning",
      message: "No music platform links — discography will be empty",
      default: "skip extract-music-metadata",
    });
  }
  if (!intake.instagram_url && !intake.tiktok_url && !intake.youtube_url) {
    ambiguities.push({
      field: "social_links",
      severity: "warning",
      message: "No social links — engagement score will be 0",
      default: "skip extract-social-media-data",
    });
  }
  if (intake.deploy_to_vercel && !process.env.VERCEL_TOKEN) {
    ambiguities.push({
      field: "vercel_token",
      severity: "warning",
      message: "VERCEL_TOKEN not set — deploy will return setup instructions",
      default: "return setup instructions",
    });
  }

  // L — Latent Intent
  const jtbd = {
    primary: `Help ${intake.artist_name} credibly and persuasively connect with talent bookers, promoters, and press`,
    success_metric: "Booker-ready EPK in all requested formats with every metric traceable to a source",
  };

  // E — Expand
  const plan = {
    skills: [
      { skill: "format-inputs", depends_on: [], inputs: ["intake"], outputs: ["master.md"] },
      { skill: "extract-music-metadata", depends_on: ["format-inputs"], parallel_with: ["extract-social-media-data", "analyze-link-contents"], inputs: ["master.md"], outputs: ["discography-raw.json"] },
      { skill: "analyze-music-theme", depends_on: ["extract-music-metadata"], inputs: ["discography-raw.json"], outputs: ["music-theme-analysis.md"] },
      { skill: "create-discography", depends_on: ["extract-music-metadata"], inputs: ["discography-raw.json"], outputs: ["discography.md", "discography.csv"] },
      { skill: "extract-social-media-data", depends_on: ["format-inputs"], parallel_with: ["extract-music-metadata", "analyze-link-contents"], inputs: ["master.md"], outputs: ["social-media-raw.json"] },
      { skill: "calculate-engagement-score", depends_on: ["extract-social-media-data"], inputs: ["social-media-raw.json"], outputs: ["engagement-score.md"] },
      { skill: "analyze-link-contents", depends_on: ["format-inputs"], parallel_with: ["extract-music-metadata", "extract-social-media-data"], inputs: ["master.md"], outputs: ["press-link-summary.md"] },
      { skill: "compile-data", depends_on: ["format-inputs", "analyze-music-theme", "calculate-engagement-score", "analyze-link-contents", "create-discography"], inputs: ["master.md", "discography.md", "social-media-raw.json", "engagement-score.md", "press-link-summary.md"], outputs: ["enhanced.md"] },
      { skill: "generate-bio", depends_on: ["compile-data"], inputs: ["master.md", "enhanced.md"], outputs: ["bio-long.md", "bio-short.md"] },
      { skill: "generate-design-system", depends_on: ["compile-data"], inputs: ["enhanced.md"], outputs: ["epk-design-system.json"] },
      { skill: "generate-epk", depends_on: ["generate-bio", "generate-design-system"], inputs: ["enhanced.md", "bio-long.md", "epk-design-system.json"], outputs: ["epk.html", "epk.pdf", "epk-deck.html", "epk-deck.pptx", "epk-presenton.pptx"] },
    ],
    tools: ["composio", "canva", "vercel", "presenton", "pptxgenjs", "revealjs"],
    parallel_groups: [
      ["extract-music-metadata", "extract-social-media-data", "analyze-link-contents"],
      ["generate-bio", "generate-design-system"],
    ],
  };

  // C — Compile
  const compiled = {
    system_prompt_source: "soul.md",
    model_routing: {
      intake: "anthropic/claude-haiku-4-5",      // fast, cheap for formatting
      generation: "anthropic/claude-sonnet-4-5", // bio + EPK generation
      enrichment: "anthropic/claude-sonnet-4-5", // analysis + theme
    },
    tool_bindings: [
      "mcp__composio",
      "mcp__canva",
      "mcp__vercel",
      "presenton_rest",
      "pptxgenjs_native",
      "revealjs_native",
    ],
    artifact_contract: {
      required: ["master.md", "enhanced.md", "bio-long.md", "bio-short.md", "epk.html"],
      optional: ["epk.pdf", "epk-deck.html", "epk-deck.pptx", "epk-presenton.pptx", "vercel-url"],
      approval_required: ["vercel-production-deploy", "canva-public-share"],
    },
  };

  return { intent, ambiguities, jtbd, plan, compiled };
}

// ─── ROSTR ContextEngine — flat-file session persistence ─────────────────────

const CONTEXT_ENGINE_ROOT = ".context-engine";

export interface EPKSession {
  project_id: string;
  project_name: string;
  project_type: "epk";
  submission_date: string;
  raw_input_summary: string;
  artist_slug: string;
  template: string;
  artifact_paths: Record<string, string>;
  quality_gate_status: "pending" | "passed" | "failed";
  vercel_url?: string;
  tags: string[];
}

export async function saveSession(
  runId: string,
  artistSlug: string,
  intake: EPKIntake,
  state: Partial<EPKPipelineState>
): Promise<void> {
  const sessionDir = path.join(
    process.cwd(),
    CONTEXT_ENGINE_ROOT,
    "sessions",
    artistSlug
  );

  try {
    await fs.mkdir(sessionDir, { recursive: true });

    const session: EPKSession = {
      project_id: runId,
      project_name: intake.artist_name,
      project_type: "epk",
      submission_date: new Date().toISOString(),
      raw_input_summary: JSON.stringify(intake).slice(0, 500),
      artist_slug: artistSlug,
      template: intake.template || "general",
      artifact_paths: state.artifacts
        ? Object.fromEntries(
            Object.entries(state.artifacts).map(([k, v]) => [k, v.artifact_type])
          )
        : {},
      quality_gate_status: state.status === "complete" ? "passed" : "pending",
      vercel_url: state.vercel_url,
      tags: [
        "epk",
        intake.genre?.toLowerCase().replace(/\s+/g, "-") || "unknown-genre",
        intake.template || "general",
      ],
    };

    const sessionPath = path.join(sessionDir, `${runId}-session.md`);
    await fs.writeFile(sessionPath, serializeSession(session), "utf-8");

    // Update CONTEXT.md index
    await updateContextIndex(session);
  } catch {
    // ContextEngine is best-effort — never block pipeline on persistence failure
    console.warn("[ContextEngine] Could not save session — continuing without persistence");
  }
}

export async function retrieveSession(
  artistSlug: string
): Promise<EPKSession | null> {
  const sessionDir = path.join(
    process.cwd(),
    CONTEXT_ENGINE_ROOT,
    "sessions",
    artistSlug
  );

  try {
    const files = await fs.readdir(sessionDir);
    const latest = files.sort().pop();
    if (!latest) return null;

    const content = await fs.readFile(path.join(sessionDir, latest), "utf-8");
    return parseSession(content);
  } catch {
    return null;
  }
}

async function updateContextIndex(session: EPKSession): Promise<void> {
  const indexPath = path.join(process.cwd(), CONTEXT_ENGINE_ROOT, "CONTEXT.md");

  let existing = "";
  try {
    existing = await fs.readFile(indexPath, "utf-8");
  } catch {
    existing = "# ROSTR ContextEngine — EPK Agent Index\n\n";
  }

  const entry = `| ${session.project_id.slice(0, 8)} | ${session.project_name} | ${session.template} | ${session.submission_date.slice(0, 10)} | ${session.quality_gate_status} | ${session.vercel_url || "—"} |\n`;

  if (!existing.includes("| Run | Artist |")) {
    existing += "\n## Sessions\n\n| Run | Artist | Template | Date | QA | URL |\n|---|---|---|---|---|---|\n";
  }

  await fs.writeFile(indexPath, existing + entry, "utf-8");
}

function serializeSession(session: EPKSession): string {
  return [
    "---",
    `project_id: ${session.project_id}`,
    `project_name: ${session.project_name}`,
    `project_type: ${session.project_type}`,
    `submission_date: ${session.submission_date}`,
    `artist_slug: ${session.artist_slug}`,
    `template: ${session.template}`,
    `quality_gate_status: ${session.quality_gate_status}`,
    `tags: [${session.tags.join(", ")}]`,
    "---",
    "",
    `# EPK Session — ${session.project_name}`,
    "",
    `**Run ID:** ${session.project_id}`,
    `**Date:** ${session.submission_date}`,
    `**Template:** ${session.template}`,
    `**Vercel URL:** ${session.vercel_url || "not deployed"}`,
    "",
    "## Input Summary",
    `\`\`\`\n${session.raw_input_summary}\n\`\`\``,
    "",
    "## Artifacts",
    Object.entries(session.artifact_paths)
      .map(([k, v]) => `- \`${k}\`: ${v}`)
      .join("\n"),
  ].join("\n");
}

function parseSession(content: string): EPKSession | null {
  try {
    const lines = content.split("\n");
    const projectId = lines.find((l) => l.startsWith("project_id:"))?.split(": ")[1]?.trim();
    const projectName = lines.find((l) => l.startsWith("project_name:"))?.split(": ")[1]?.trim();
    if (!projectId || !projectName) return null;

    return {
      project_id: projectId,
      project_name: projectName,
      project_type: "epk",
      submission_date: lines.find((l) => l.startsWith("submission_date:"))?.split(": ")[1]?.trim() || "",
      raw_input_summary: "",
      artist_slug: lines.find((l) => l.startsWith("artist_slug:"))?.split(": ")[1]?.trim() || "",
      template: lines.find((l) => l.startsWith("template:"))?.split(": ")[1]?.trim() || "general",
      artifact_paths: {},
      quality_gate_status: (lines.find((l) => l.startsWith("quality_gate_status:"))?.split(": ")[1]?.trim() || "pending") as EPKSession["quality_gate_status"],
      tags: [],
    };
  } catch {
    return null;
  }
}
