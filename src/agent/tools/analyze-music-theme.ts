/**
 * EPK Tool: analyze-music-theme
 * Implements skills/analyze-music-theme.skill.md — previously this skill had
 * no code behind it at all; compile-data just emitted a "no analysis has run
 * yet" note regardless of what data was available.
 *
 * No audio-analysis tool is connected (per the skill's own guardrail: "Do not
 * analyze actual audio waveforms/acoustic features unless an audio-analysis
 * tool is explicitly connected"), so this works from metadata + the artist's
 * own words only, exactly as the skill specifies — genre tags, track titles,
 * and the artist's self-described theme/influences from intake.
 */
import { generateText, createGateway } from "ai";
import type { ROSTRArtifact, EPKIntake } from "../../types";
import type { TrackMetadata } from "./extract-metadata";

const gateway = createGateway({
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY || process.env.ANTHROPIC_API_KEY,
});
const model = gateway(process.env.DEFAULT_MODEL || "anthropic/claude-sonnet-4-5");

function deterministicFallback(intake: EPKIntake, tracks: TrackMetadata[]): string {
  const known = tracks.filter((t) => t.title !== "unknown");
  const lines = [
    `**Self-described genre:** ${intake.genre}${intake.subgenre ? ` / ${intake.subgenre}` : ""}`,
    intake.influences ? `**Self-described influences:** ${intake.influences}` : null,
    intake.music_theme_notes ? `**Artist's own theme/style description:** ${intake.music_theme_notes}` : null,
    known.length
      ? `**Track titles on file:** ${known.map((t) => t.title).join(", ")}`
      : "**Track titles on file:** none resolved",
    "",
    "_No LLM-backed theme narrative was generated for this run (model call unavailable or failed) — the lines above are the raw signal only, not a synthesized style description._",
  ].filter(Boolean);
  return lines.join("\n");
}

export async function analyzeMusicTheme(
  intake: EPKIntake,
  tracks: TrackMetadata[]
): Promise<{ artifact: ROSTRArtifact; theme_md: string }> {
  const now = new Date().toISOString();
  const known = tracks.filter((t) => t.title !== "unknown");

  const hasSignal =
    known.length > 0 || intake.influences || intake.music_theme_notes || intake.genre;

  let narrative: string;
  let confidence: number;

  if (!hasSignal) {
    narrative = "_No genre, influence, or track metadata was available to analyze for this run._";
    confidence = 0;
  } else {
    try {
      const { text } = await generateText({
        model,
        system: `You are a music journalist analyzing an artist's sonic identity.
Rules:
- Only describe themes, moods, or motifs directly evidenced by the source material below.
- Never invent lyrical content, acoustic features, or influences not stated.
- If track titles are the only signal, say so explicitly and keep claims conservative.
- Explicitly note which claims come from the artist's own words vs. platform/track metadata.`,
        prompt: `Write a short (120-180 word) style/theme profile for this artist, from this source material only:

Self-described genre: ${intake.genre}${intake.subgenre ? ` / ${intake.subgenre}` : ""}
Self-described influences: ${intake.influences || "none provided"}
Artist's own theme/style description: ${intake.music_theme_notes || "none provided"}
Track titles on file: ${known.length ? known.map((t) => t.title).join(", ") : "none resolved"}

Structure: primary genre + fusion elements (if evidenced), a one-paragraph style narrative, and a one-line note on which parts are self-described vs. inferred.`,
      });
      narrative = text;
      confidence = intake.music_theme_notes || intake.influences ? 0.7 : 0.4;
    } catch {
      // No model/API key configured, or the call failed — degrade to the raw
      // signal rather than fail the whole pipeline or fabricate a narrative.
      narrative = deterministicFallback(intake, tracks);
      confidence = 0.3;
    }
  }

  const content = [
    "---",
    `artifact_type: music-theme-analysis.md`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: analyze-music-theme`,
    `input_artifacts: ["discography-raw", "master.md"]`,
    `confidence: ${confidence}`,
    `created_at: ${now}`,
    "---",
    "",
    "# Music Theme & Style Analysis",
    "",
    narrative,
  ].join("\n");

  const artifact: ROSTRArtifact = {
    artifact_type: "music-theme-analysis.md",
    version: "1.0.0",
    status: "draft",
    owner_skill: "analyze-music-theme",
    input_artifacts: ["discography-raw", "master.md"],
    confidence,
    created_at: now,
    content,
  };

  return { artifact, theme_md: content };
}
