/**
 * EPK Tool: generate-bio
 * Implements skills/generate-bio.skill.md
 * Uses Vercel AI SDK generateText for bio generation from enhanced.md.
 */

import { generateText, createGateway } from "ai";
import type { ROSTRArtifact } from "../../types";

const gateway = createGateway({
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY || process.env.ANTHROPIC_API_KEY,
});

const model = gateway(
  process.env.DEFAULT_MODEL || "anthropic/claude-sonnet-4-5"
);

export async function generateBio(
  runId: string,
  artistSlug: string,
  tone: "press" | "booking" | "social"
): Promise<{
  bio_long: ROSTRArtifact;
  bio_short: ROSTRArtifact;
}> {
  const now = new Date().toISOString();

  const toneInstructions = {
    press:
      "Write in a third-person journalist tone. Lead with the artist's sonic identity, then career highlights, then forward momentum.",
    booking:
      "Write for talent buyers and venue managers. Lead with live performance credentials, draw/reach, and what makes this artist bookable.",
    social:
      "Write in a friendly, first-person tone suitable for an Instagram bio and website About page.",
  };

  // Long bio (400 words)
  const { text: bioLongText } = await generateText({
    model,
    system: `You are a music industry press kit writer. 
Rules:
- Never fabricate quotes, metrics, streaming numbers, or collaborations
- Only use facts present in the source material
- If a fact is missing, omit it — do not invent it
- ${toneInstructions[tone]}`,
    prompt: `Write a professional 400-word artist bio for run_id: ${runId}, artist: ${artistSlug}.
Use only the information in the enhanced.md artifact for this run.
Tone: ${tone}

Structure:
1. Opening hook — artist's sonic identity in 1-2 sentences
2. Career narrative — origin, key releases, milestones
3. Sound/style — musical influences and sonic characteristics
4. Social proof — press mentions and collaborations (only if available)
5. Current momentum — recent releases, upcoming projects
6. Call to action — booking/contact`,
  });

  // Short bio (150 words)
  const { text: bioShortText } = await generateText({
    model,
    system: `You are a music industry press kit writer. Never fabricate facts. Only use provided information.`,
    prompt: `Condense the following bio to exactly 150 words, keeping the most impactful facts:

${bioLongText}`,
  });

  const longArtifact: ROSTRArtifact = {
    artifact_type: "bio-long.md",
    version: "1.0.0",
    status: "draft",
    owner_skill: "generate-bio",
    input_artifacts: ["master.md", "enhanced.md"],
    confidence: 0.85,
    created_at: now,
    content: [
      "---",
      `artifact_type: bio-long.md`,
      `version: "1.0.0"`,
      `status: draft`,
      `owner_skill: generate-bio`,
      `input_artifacts: ["master.md", "enhanced.md"]`,
      `confidence: 0.85`,
      `created_at: ${now}`,
      "---",
      "",
      `# Artist Bio (Long) — ${artistSlug}`,
      "",
      bioLongText,
    ].join("\n"),
  };

  const shortArtifact: ROSTRArtifact = {
    artifact_type: "bio-short.md",
    version: "1.0.0",
    status: "draft",
    owner_skill: "generate-bio",
    input_artifacts: ["master.md", "enhanced.md"],
    confidence: 0.85,
    created_at: now,
    content: [
      "---",
      `artifact_type: bio-short.md`,
      `version: "1.0.0"`,
      `status: draft`,
      `owner_skill: generate-bio`,
      `input_artifacts: ["master.md", "enhanced.md"]`,
      `confidence: 0.85`,
      `created_at: ${now}`,
      "---",
      "",
      `# Artist Bio (Short) — ${artistSlug}`,
      "",
      bioShortText,
    ].join("\n"),
  };

  return { bio_long: longArtifact, bio_short: shortArtifact };
}
