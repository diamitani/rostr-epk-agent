/**
 * EPK Tool: compile-data + analyze-press-links
 * Implements skills/compile-data.skill.md and skills/analyze-link-contents.skill.md
 */

import type { ROSTRArtifact, EPKIntake } from "../../types";
import type { RunStore } from "../store";
import { bodyOf } from "../store";
import type { TrackMetadata } from "./extract-metadata";
import type { SocialProfile, EngagementScore } from "./social-data";

export async function analyzePressLinks(
  pressLinks: string[],
  artistName: string
): Promise<{ artifact: ROSTRArtifact; summaries: PressSummary[] }> {
  const now = new Date().toISOString();
  const summaries: PressSummary[] = [];

  for (const link of pressLinks) {
    try {
      const summary = await fetchAndSummarizePressLink(link, artistName);
      summaries.push(summary);
    } catch {
      summaries.push({
        url: link,
        title: "unknown",
        publication: "unknown",
        summary: "Could not fetch — mark for manual review",
        confidence: 0,
        error: true,
      });
    }
  }

  const content = [
    "---",
    `artifact_type: press-link-summary`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: analyze-link-contents`,
    `input_artifacts: ["master.md"]`,
    `confidence: ${summaries.length > 0 ? 0.7 : 0}`,
    `created_at: ${now}`,
    "---",
    "",
    `# Press Link Summaries — ${artistName}`,
    "",
    summaries
      .map(
        (s) =>
          `## ${s.title}\n- **Publication:** ${s.publication}\n- **URL:** ${s.url}\n- **Confidence:** ${s.confidence}\n\n${s.summary}\n${s.error ? "\n⚠️ Fetch failed — verify manually" : ""}`
      )
      .join("\n\n---\n\n"),
  ].join("\n");

  return {
    artifact: {
      artifact_type: "press-link-summary",
      version: "1.0.0",
      status: "draft",
      owner_skill: "analyze-link-contents",
      input_artifacts: ["master.md"],
      confidence: summaries.length > 0 ? 0.7 : 0,
      created_at: now,
      content,
    },
    summaries,
  };
}

async function fetchAndSummarizePressLink(
  url: string,
  artistName: string
): Promise<PressSummary> {
  const res = await fetch(url, {
    headers: { "User-Agent": "rostr-epk-agent/2.0 (press-link-analyzer)" },
    signal: AbortSignal.timeout(10000),
  });

  const html = await res.text();

  // Extract structured data
  const titleMatch =
    html.match(/<meta property="og:title" content="([^"]+)"/) ||
    html.match(/<title>([^<]+)<\/title>/);
  const descMatch = html.match(
    /<meta property="og:description" content="([^"]+)"/
  );
  const siteMatch = html.match(
    /<meta property="og:site_name" content="([^"]+)"/
  );

  const title = titleMatch?.[1] || "unknown";
  const description = descMatch?.[1] || "";
  const publication = siteMatch?.[1] || new URL(url).hostname;

  // Strip HTML for body text summary
  const bodyText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);

  const summary =
    description ||
    `${bodyText.slice(0, 300)}...` ||
    `Press feature mentioning ${artistName}`;

  return {
    url,
    title,
    publication,
    summary,
    confidence: 0.7,
    error: false,
  };
}

export interface PressSummary {
  url: string;
  title: string;
  publication: string;
  summary: string;
  confidence: number;
  error: boolean;
}

// ─── compile-data skill ───────────────────────────────────────────────────────
//
// Reads every upstream artifact this run has actually produced (via RunStore)
// and merges their real content into enhanced.md. Previously this returned a
// static template with "_Populated by X_" placeholders regardless of what the
// earlier steps found — nothing was ever actually merged.

function trackLine(t: TrackMetadata): string {
  const bits = [t.title, t.artist !== "unknown" ? `by ${t.artist}` : null, `(${t.platform})`]
    .filter(Boolean)
    .join(" ");
  return t.error
    ? `- ${t.source_url} — ⚠️ ${t.error}`
    : `- **${bits}** — ${t.source_url}`;
}

function socialLine(p: SocialProfile): string {
  const followers = p.followers != null ? p.followers.toLocaleString() : "unknown";
  return `- **${p.platform}** (${p.handle || p.url}): ${followers} followers${
    p.error ? ` — ⚠️ ${p.error}` : ""
  }`;
}

function pressLine(s: { title: string; publication: string; url: string; summary: string; error: boolean }): string {
  return `- **${s.title}** (${s.publication}) — ${s.url}${
    s.error ? " — ⚠️ fetch failed, verify manually" : `\n  ${s.summary}`
  }`;
}

export async function compileData(
  runId: string,
  artistSlug: string,
  store: RunStore
): Promise<{ artifact: ROSTRArtifact; enhanced_md: string }> {
  const now = new Date().toISOString();

  const masterBody = bodyOf(store.content("master.md")) || "_master.md not yet generated for this run_";
  const tracks = store.getData<TrackMetadata[]>("tracks") || [];
  const profiles = store.getData<SocialProfile[]>("profiles") || [];
  const engagement = store.getData<EngagementScore>("engagement");
  const summaries =
    store.getData<Array<{ title: string; publication: string; url: string; summary: string; error: boolean }>>(
      "press_summaries"
    ) || [];
  const intake = store.getData<EPKIntake>("intake");

  const discographySection = tracks.length
    ? tracks.map(trackLine).join("\n")
    : "_No music links were supplied or extract-music-metadata has not run yet._";

  const socialSection = profiles.length
    ? profiles.map(socialLine).join("\n") +
      (engagement
        ? `\n\n**Engagement score:** ${engagement.score}/100 (${engagement.tier}) — ${engagement.formula}`
        : "")
    : "_No social links were supplied or extract-social-media-data has not run yet._";

  const pressSection = summaries.length
    ? summaries.map(pressLine).join("\n\n")
    : "_No press links were supplied or analyze-link-contents has not run yet._";

  const themeSection =
    bodyOf(store.content("music-theme-analysis.md")) ||
    "_analyze-music-theme has not run yet for this run._";

  const discographyMdSection =
    bodyOf(store.content("discography.md")) || "_create-discography has not run yet for this run._";

  const collaborationsSection = intake?.past_collaborations || "none provided";
  const performancesSection = intake?.performances || "none provided";
  const technicalRiderSection = intake?.technical_rider || "none provided";
  const performanceRiderSection = intake?.performance_rider || "none provided";

  const inputArtifacts = ["master.md"];
  if (tracks.length) inputArtifacts.push("discography-raw");
  if (store.content("discography.md")) inputArtifacts.push("discography.md");
  if (profiles.length) inputArtifacts.push("social-media-raw");
  if (summaries.length) inputArtifacts.push("press-link-summary");
  if (store.content("music-theme-analysis.md")) inputArtifacts.push("music-theme-analysis.md");

  const enhanced_md = [
    "---",
    `artifact_type: enhanced.md`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: compile-data`,
    `input_artifacts: [${inputArtifacts.map((i) => `"${i}"`).join(", ")}]`,
    `confidence: 0.9`,
    `created_at: ${now}`,
    "---",
    "",
    `# Enhanced EPK Data — ${artistSlug}`,
    "",
    "<!-- Single source of truth for bio generation, design, and rendering. -->",
    "",
    "## Master Intake",
    "",
    masterBody,
    "",
    "## Discography (raw extraction)",
    "",
    discographySection,
    "",
    "## Discography (finalized catalogue)",
    "",
    discographyMdSection,
    "",
    "## Social Analytics & Engagement Score",
    "",
    socialSection,
    "",
    "## Press Coverage",
    "",
    pressSection,
    "",
    "## Music Theme Analysis",
    "",
    themeSection,
    "",
    "## Collaborations",
    "",
    collaborationsSection,
    "",
    "## Performances",
    "",
    performancesSection,
    "",
    "## Technical Rider",
    "",
    technicalRiderSection,
    "",
    "## Performance Rider",
    "",
    performanceRiderSection,
    "",
    `## Run Metadata`,
    `- run_id: ${runId}`,
    `- compiled_at: ${now}`,
  ].join("\n");

  const artifact: ROSTRArtifact = {
    artifact_type: "enhanced.md",
    version: "1.0.0",
    status: "draft",
    owner_skill: "compile-data",
    input_artifacts: inputArtifacts,
    confidence: 0.9,
    created_at: now,
    content: enhanced_md,
  };

  return { artifact, enhanced_md };
}
