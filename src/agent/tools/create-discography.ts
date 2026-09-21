/**
 * EPK Tool: create-discography
 * Implements skills/create-discography.skill.md — finalizes the raw metadata
 * extract-music-metadata produced into a presentation-ready catalogue.
 *
 * Previously this skill had no code behind it at all; discography.md/.csv
 * were listed as pipeline outputs (manifest.json, pal.ts) but nothing
 * produced them.
 */
import type { ROSTRArtifact } from "../../types";
import type { TrackMetadata } from "./extract-metadata";

export interface DiscographyStats {
  release_count: number;
  resolved_count: number;
  years_active: string; // "unknown" if no release_date is available on any resolved track
  most_recent_release: string; // "unknown" if unavailable
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function createDiscography(
  tracks: TrackMetadata[]
): Promise<{
  artifact: ROSTRArtifact;
  discography_md: string;
  discography_csv: string;
  stats: DiscographyStats;
}> {
  const now = new Date().toISOString();

  // Guardrail: never include an entry whose metadata extraction failed in the
  // primary catalogue — those go in a separate "unverified" list instead.
  const resolved = tracks.filter((t) => t.title !== "unknown" && !t.error);
  const unresolved = tracks.filter((t) => t.title === "unknown" || t.error);

  // Sort newest-first by release_date when we have it; entries without a
  // release_date are never guessed at — they sort to the end, order-preserved.
  const dated = resolved.filter((t) => t.release_date);
  const undated = resolved.filter((t) => !t.release_date);
  dated.sort((a, b) => (b.release_date! > a.release_date! ? 1 : -1));
  const catalogue = [...dated, ...undated];

  const stats: DiscographyStats = {
    release_count: tracks.length,
    resolved_count: resolved.length,
    years_active:
      dated.length > 0
        ? `${dated[dated.length - 1].release_date!.slice(0, 4)}–${dated[0].release_date!.slice(0, 4)}`
        : "unknown",
    most_recent_release: dated.length > 0 ? dated[0].release_date! : "unknown",
  };

  const csvHeader = "title,artist,platform,album,release_date,duration_ms,bpm,key,isrc,source_url,confidence";
  const csvRows = catalogue.map((t) =>
    [
      t.title,
      t.artist,
      t.platform,
      t.album || "",
      t.release_date || "",
      t.duration_ms ?? "",
      t.bpm ?? "",
      t.key || "",
      t.isrc || "",
      t.source_url,
      t.confidence,
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );
  const discography_csv = [csvHeader, ...csvRows].join("\n");

  const mdRows = catalogue.map(
    (t) =>
      `| ${t.title} | ${t.artist} | ${t.platform} | ${t.release_date || "unknown"} | [link](${t.source_url}) |`
  );
  const discography_md_table =
    catalogue.length > 0
      ? [
          "| Title | Artist | Platform | Release Date | Link |",
          "|---|---|---|---|---|",
          ...mdRows,
        ].join("\n")
      : "_No resolved releases for this run._";

  const unresolvedSection =
    unresolved.length > 0
      ? [
          "",
          "## Additional Releases (unverified)",
          "",
          "_Metadata extraction failed or was incomplete for these links — verify manually before including in the final EPK._",
          "",
          ...unresolved.map((t) => `- ${t.source_url} — ⚠️ ${t.error || "unresolved"}`),
        ].join("\n")
      : "";

  const content = [
    "---",
    `artifact_type: discography.md`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: create-discography`,
    `input_artifacts: ["discography-raw"]`,
    `confidence: ${resolved.length > 0 ? 0.85 : 0.2}`,
    `created_at: ${now}`,
    "---",
    "",
    "# Discography",
    "",
    `**Total releases:** ${stats.release_count} · **Resolved:** ${stats.resolved_count} · **Years active:** ${stats.years_active} · **Most recent:** ${stats.most_recent_release}`,
    "",
    discography_md_table,
    unresolvedSection,
  ].join("\n");

  const artifact: ROSTRArtifact = {
    artifact_type: "discography.md",
    version: "1.0.0",
    status: "draft",
    owner_skill: "create-discography",
    input_artifacts: ["discography-raw"],
    confidence: resolved.length > 0 ? 0.85 : 0.2,
    created_at: now,
    content,
  };

  return { artifact, discography_md: content, discography_csv, stats };
}
