/**
 * EPK Tool: compile-data + analyze-press-links
 * Implements skills/compile-data.skill.md and skills/analyze-link-contents.skill.md
 */

import type { ROSTRArtifact } from "../../types";

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

interface PressSummary {
  url: string;
  title: string;
  publication: string;
  summary: string;
  confidence: number;
  error: boolean;
}

// ─── compile-data skill ───────────────────────────────────────────────────────

export async function compileData(
  runId: string,
  artistSlug: string
): Promise<{ artifact: ROSTRArtifact; enhanced_md: string }> {
  const now = new Date().toISOString();

  // In production, this reads from the pipeline's artifact store
  // Here we return the enhanced.md structure template
  const enhanced_md = [
    "---",
    `artifact_type: enhanced.md`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: compile-data`,
    `input_artifacts: ["master.md", "discography-raw", "social-media-raw", "press-link-summary"]`,
    `confidence: 0.9`,
    `created_at: ${now}`,
    "---",
    "",
    `# Enhanced EPK Data — ${artistSlug}`,
    "",
    "<!-- This file is the single source of truth for bio generation, design, and rendering. -->",
    "<!-- It merges all upstream artifacts: master.md + discography + social + press. -->",
    "",
    "## [Merged from master.md]",
    "_Populated by pipeline run_",
    "",
    "## [Discography]",
    "_Populated by extract-music-metadata_",
    "",
    "## [Social Analytics]",
    "_Populated by extract-social-media-data_",
    "",
    "## [Engagement Score]",
    "_Populated by calculate-engagement-score_",
    "",
    "## [Press Coverage]",
    "_Populated by analyze-link-contents_",
    "",
    "## [Music Theme Analysis]",
    "_Populated by analyze-music-theme_",
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
    input_artifacts: [
      "master.md",
      "discography-raw",
      "social-media-raw",
      "press-link-summary",
    ],
    confidence: 0.9,
    created_at: now,
    content: enhanced_md,
  };

  return { artifact, enhanced_md };
}
