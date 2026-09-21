/**
 * EPK Tool: extract-metadata + format-inputs
 * Implements skills/extract-music-metadata.skill.md and skills/format-inputs.skill.md
 * via Composio MCP and public link scraping.
 */

import type { EPKIntake, ROSTRArtifact } from "../../types";

// ─── format-inputs skill ──────────────────────────────────────────────────────

export async function formatInputs(intake: EPKIntake): Promise<{
  artifact: ROSTRArtifact;
  master_md: string;
}> {
  const now = new Date().toISOString();

  const sections: string[] = [
    frontmatter("master.md", "format-inputs", [], 1.0, now),
    `# Master EPK — ${intake.artist_name}`,
    ``,
    `## Identity`,
    `- **Artist name:** ${intake.artist_name}`,
    `- **Legal name:** ${intake.legal_name || "unknown"}`,
    `- **Genre:** ${intake.genre}`,
    `- **Subgenre:** ${intake.subgenre || "unknown"}`,
    `- **Location:** ${[intake.city, intake.state, intake.country].filter(Boolean).join(", ")}`,
    `- **Pronouns:** ${intake.pronouns || "not specified"}`,
    ``,
    `## Bio Seeds`,
    `${intake.bio_notes || "none provided"}`,
    ``,
    `### Career Highlights`,
    `${intake.career_highlights || "none provided"}`,
    ``,
    `### Influences`,
    `${intake.influences || "none provided"}`,
    ``,
    `### Goals`,
    `${intake.goals || "none provided"}`,
    ``,
    `## Music Platform Links`,
    linkTable({
      Spotify: intake.spotify_url,
      "Apple Music": intake.apple_music_url,
      SoundCloud: intake.soundcloud_url,
      YouTube: intake.youtube_url,
      Pandora: intake.pandora_url,
      Suno: intake.suno_url,
    }),
    ``,
    `## Social Platform Links`,
    linkTable({
      Instagram: intake.instagram_url,
      TikTok: intake.tiktok_url,
      Twitter: intake.twitter_url,
      Facebook: intake.facebook_url,
      Website: intake.website_url,
    }),
    ``,
    `## Press Links`,
    (intake.press_links || []).map((l) => `- ${l}`).join("\n") ||
      "none provided",
    ``,
    `## Misc Links`,
    (intake.misc_links || []).map((l) => `- ${l}`).join("\n") ||
      "none provided",
    ``,
    `## Contacts`,
    `- **Manager:** ${intake.manager_name || "unknown"} — ${intake.manager_email || "unknown"}`,
    `- **Label:** ${intake.label_name || "independent"}`,
    `- **Booking:** ${intake.booking_email || "unknown"}`,
    ``,
    `## EPK Config`,
    `- **Template:** ${intake.template || "general"}`,
    `- **Presentation outputs:** ${(intake.presentation_output || ["html", "pdf"]).join(", ")}`,
    `- **Vercel deploy:** ${intake.deploy_to_vercel ? "yes" : "no"}`,
    `- **Custom domain:** ${intake.custom_domain || "none"}`,
  ];

  const master_md = sections.join("\n");

  const artifact: ROSTRArtifact = {
    artifact_type: "master.md",
    version: "1.0.0",
    status: "approved",
    owner_skill: "format-inputs",
    input_artifacts: ["intake-submission"],
    confidence: 1.0,
    created_at: now,
    content: master_md,
  };

  return { artifact, master_md };
}

// ─── extract-music-metadata skill ────────────────────────────────────────────

export async function extractMusicMetadata(
  musicLinks: string[],
  artistSlug: string
): Promise<{
  artifact: ROSTRArtifact;
  tracks: TrackMetadata[];
}> {
  const now = new Date().toISOString();
  const tracks: TrackMetadata[] = [];

  for (const link of musicLinks) {
    try {
      const meta = await fetchPublicMusicMetadata(link);
      if (meta) tracks.push(meta);
    } catch {
      // Mark unknown per ROSTR guardrails — never fabricate
      tracks.push({
        source_url: link,
        title: "unknown",
        artist: artistSlug,
        platform: detectPlatform(link),
        error: "Could not extract metadata — mark for manual review",
        confidence: 0,
      });
    }
  }

  const content = [
    frontmatter("discography-raw.json", "extract-music-metadata", ["master.md"], 0.8, now),
    "# Raw Discography Metadata",
    "",
    `Extracted from ${musicLinks.length} music platform links.`,
    "",
    "```json",
    JSON.stringify(tracks, null, 2),
    "```",
  ].join("\n");

  const artifact: ROSTRArtifact = {
    artifact_type: "discography-raw",
    version: "1.0.0",
    status: "draft",
    owner_skill: "extract-music-metadata",
    input_artifacts: ["master.md"],
    confidence: tracks.length > 0 ? 0.8 : 0.2,
    created_at: now,
    content,
  };

  return { artifact, tracks };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

export interface TrackMetadata {
  source_url: string;
  title: string;
  artist: string;
  platform: string;
  album?: string;
  release_date?: string;
  duration_ms?: number;
  bpm?: number;
  key?: string;
  isrc?: string;
  monthly_listeners?: number;
  streams?: number;
  confidence: number;
  error?: string;
}

async function fetchPublicMusicMetadata(
  url: string
): Promise<TrackMetadata | null> {
  const platform = detectPlatform(url);

  // Composio MCP is the preferred path when available
  // Fallback: public oEmbed / open metadata endpoints
  if (platform === "spotify") {
    return fetchSpotifyOEmbed(url);
  }
  if (platform === "soundcloud") {
    return fetchSoundCloudOEmbed(url);
  }
  if (platform === "youtube") {
    return fetchYouTubeOEmbed(url);
  }

  // Generic fallback — scrape open graph tags
  return fetchOpenGraph(url, platform);
}

async function fetchSpotifyOEmbed(url: string): Promise<TrackMetadata> {
  const oembed = await fetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
  ).then((r) => r.json());

  return {
    source_url: url,
    title: oembed.title || "unknown",
    artist: oembed.provider_name || "unknown",
    platform: "spotify",
    confidence: 0.9,
  };
}

async function fetchSoundCloudOEmbed(url: string): Promise<TrackMetadata> {
  const oembed = await fetch(
    `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
  ).then((r) => r.json());

  return {
    source_url: url,
    title: oembed.title || "unknown",
    artist: oembed.author_name || "unknown",
    platform: "soundcloud",
    confidence: 0.85,
  };
}

async function fetchYouTubeOEmbed(url: string): Promise<TrackMetadata> {
  const oembed = await fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
  ).then((r) => r.json());

  return {
    source_url: url,
    title: oembed.title || "unknown",
    artist: oembed.author_name || "unknown",
    platform: "youtube",
    confidence: 0.85,
  };
}

async function fetchOpenGraph(
  url: string,
  platform: string
): Promise<TrackMetadata> {
  const res = await fetch(url, {
    headers: { "User-Agent": "rostr-epk-agent/2.0 (metadata-extractor)" },
  });
  const html = await res.text();
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  const authorMatch = html.match(/<meta property="og:site_name" content="([^"]+)"/);

  return {
    source_url: url,
    title: titleMatch?.[1] || "unknown",
    artist: authorMatch?.[1] || "unknown",
    platform,
    confidence: 0.5,
  };
}

function detectPlatform(url: string): string {
  if (url.includes("spotify.com")) return "spotify";
  if (url.includes("soundcloud.com")) return "soundcloud";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("music.apple.com")) return "apple-music";
  if (url.includes("pandora.com")) return "pandora";
  if (url.includes("suno.ai") || url.includes("suno.com")) return "suno";
  return "unknown";
}

function frontmatter(
  type: string,
  owner: string,
  inputs: string[],
  confidence: number,
  now: string
): string {
  return [
    "---",
    `artifact_type: ${type}`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: ${owner}`,
    `input_artifacts: [${inputs.map((i) => `"${i}"`).join(", ")}]`,
    `confidence: ${confidence}`,
    `created_at: ${now}`,
    "---",
    "",
  ].join("\n");
}

function linkTable(links: Record<string, string | undefined>): string {
  const rows = Object.entries(links)
    .map(([platform, url]) => `| ${platform} | ${url || "unknown"} |`)
    .join("\n");
  return `| Platform | URL |\n|---|---|\n${rows}`;
}
