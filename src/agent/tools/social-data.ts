/**
 * EPK Tool: social-data
 * Implements skills/extract-social-media-data.skill.md and
 * skills/calculate-engagement-score.skill.md
 */

import type { ROSTRArtifact } from "../../types";

interface SocialProfile {
  platform: string;
  url: string;
  handle?: string;
  followers?: number;
  following?: number;
  posts?: number;
  avg_likes?: number;
  avg_comments?: number;
  avg_shares?: number;
  engagement_rate?: number;
  confidence: number;
  error?: string;
}

interface EngagementScore {
  score: number; // 0–100
  tier: "emerging" | "growing" | "established" | "major";
  formula: string;
  total_followers: number;
  weighted_engagement_rate: number;
  platform_breakdown: Record<string, number>;
}

export async function extractSocialData(
  socialLinks: string[],
  artistSlug: string
): Promise<{
  artifact: ROSTRArtifact;
  profiles: SocialProfile[];
  engagement: EngagementScore;
}> {
  const now = new Date().toISOString();
  const profiles: SocialProfile[] = [];

  for (const link of socialLinks) {
    const platform = detectSocialPlatform(link);
    profiles.push(await fetchPublicSocialData(link, platform));
  }

  const engagement = calculateEngagementScore(profiles);

  const content = buildSocialArtifact(profiles, engagement, artistSlug, now);

  const artifact: ROSTRArtifact = {
    artifact_type: "social-media-raw",
    version: "1.0.0",
    status: "draft",
    owner_skill: "extract-social-media-data",
    input_artifacts: ["master.md"],
    confidence: avgConfidence(profiles),
    created_at: now,
    content,
  };

  return { artifact, profiles, engagement };
}

// ─── Engagement score (ROSTR formula) ────────────────────────────────────────

function calculateEngagementScore(profiles: SocialProfile[]): EngagementScore {
  const validProfiles = profiles.filter(
    (p) => p.followers && p.followers > 0 && !p.error
  );

  if (validProfiles.length === 0) {
    return {
      score: 0,
      tier: "emerging",
      formula: "No valid social data found",
      total_followers: 0,
      weighted_engagement_rate: 0,
      platform_breakdown: {},
    };
  }

  const totalFollowers = validProfiles.reduce(
    (sum, p) => sum + (p.followers || 0),
    0
  );

  // Weighted engagement: ER = (likes + comments + shares) / followers * 100
  const weightedER = validProfiles.reduce((sum, p) => {
    const interactions =
      (p.avg_likes || 0) + (p.avg_comments || 0) + (p.avg_shares || 0);
    const er = p.followers ? (interactions / p.followers) * 100 : 0;
    const weight = (p.followers || 0) / totalFollowers;
    return sum + er * weight;
  }, 0);

  // Score: log-scaled followers (40%) + weighted ER (60%)
  const followerScore = Math.min(
    40,
    (Math.log10(Math.max(1, totalFollowers)) / Math.log10(1_000_000)) * 40
  );
  const erScore = Math.min(60, weightedER * 10);
  const score = Math.round(followerScore + erScore);

  const tier: EngagementScore["tier"] =
    totalFollowers > 500_000
      ? "major"
      : totalFollowers > 50_000
      ? "established"
      : totalFollowers > 5_000
      ? "growing"
      : "emerging";

  const platform_breakdown: Record<string, number> = {};
  validProfiles.forEach((p) => {
    platform_breakdown[p.platform] = p.followers || 0;
  });

  return {
    score,
    tier,
    formula:
      "score = (log10(followers)/log10(1M) × 40) + (weighted_ER × 10, max 60). Source: extracted social profiles.",
    total_followers: totalFollowers,
    weighted_engagement_rate: Math.round(weightedER * 100) / 100,
    platform_breakdown,
  };
}

// ─── Platform-specific fetchers ───────────────────────────────────────────────

async function fetchPublicSocialData(
  url: string,
  platform: string
): Promise<SocialProfile> {
  // NOTE: Real follower counts require OAuth. Public fallbacks use oEmbed/page scraping.
  // Composio MCP handles authenticated reads when available.
  // These are best-effort public extractions; confidence reflects reliability.

  try {
    if (platform === "youtube") {
      return await fetchYouTubeChannelData(url);
    }
    // For Instagram, TikTok, etc — public data is heavily restricted
    // Return with low confidence and instruct user to connect Composio
    return {
      platform,
      url,
      handle: extractHandle(url),
      confidence: 0.2,
      error:
        `${platform} requires Composio OAuth for follower counts. ` +
        `Connect at https://composio.dev to enable.`,
    };
  } catch (err) {
    return {
      platform,
      url,
      confidence: 0,
      error: `Extraction failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}

async function fetchYouTubeChannelData(url: string): Promise<SocialProfile> {
  const oembed = await fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
  ).then((r) => r.json());

  return {
    platform: "youtube",
    url,
    handle: oembed.author_name || extractHandle(url),
    // Subscriber counts not available via oEmbed — requires Data API
    confidence: 0.4,
    error:
      "Subscriber count requires YouTube Data API key (COMPOSIO_API_KEY → YouTube toolkit).",
  };
}

function detectSocialPlatform(url: string): string {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "unknown";
}

function extractHandle(url: string): string {
  const match = url.match(/(?:@|\/)([\w.]+)\/?$/);
  return match ? `@${match[1]}` : url;
}

function avgConfidence(profiles: SocialProfile[]): number {
  if (profiles.length === 0) return 0;
  return (
    profiles.reduce((s, p) => s + p.confidence, 0) / profiles.length
  );
}

function buildSocialArtifact(
  profiles: SocialProfile[],
  engagement: EngagementScore,
  artistSlug: string,
  now: string
): string {
  return [
    "---",
    `artifact_type: social-media-raw`,
    `version: "1.0.0"`,
    `status: draft`,
    `owner_skill: extract-social-media-data`,
    `input_artifacts: ["master.md"]`,
    `confidence: ${avgConfidence(profiles).toFixed(2)}`,
    `created_at: ${now}`,
    "---",
    "",
    `# Social Media Data — ${artistSlug}`,
    "",
    "## Profiles",
    "",
    profiles
      .map(
        (p) =>
          `### ${p.platform}\n- URL: ${p.url}\n- Handle: ${p.handle || "unknown"}\n- Followers: ${p.followers ?? "unknown"}\n- Engagement Rate: ${p.engagement_rate?.toFixed(2) ?? "unknown"}%\n- Confidence: ${p.confidence}\n${p.error ? `- ⚠️ Note: ${p.error}` : ""}`
      )
      .join("\n\n"),
    "",
    "## Engagement Score",
    "",
    `- **Score:** ${engagement.score}/100`,
    `- **Tier:** ${engagement.tier}`,
    `- **Total Followers:** ${engagement.total_followers.toLocaleString()}`,
    `- **Weighted ER:** ${engagement.weighted_engagement_rate}%`,
    `- **Formula:** ${engagement.formula}`,
  ].join("\n");
}
