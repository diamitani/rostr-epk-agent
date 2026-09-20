# Skill — Extract Social Media Data

**Purpose:** Pull follower counts, post counts, comment counts, and share/like metrics from every submitted
social platform link.

**Trigger:** `master.md` contains at least one social link (Instagram, TikTok, YouTube, Facebook, X.com).

**Inputs:** Social links from `master.md` → `## Platform Links` section.

**Procedure:**
1. For each social link, call the matching Composio toolkit (Instagram, TikTok, YouTube Data API, X.com,
   Facebook) using read-only profile/content scopes.
2. Extract, per platform: follower/subscriber count, total post/video count, average and most-recent-N-post
   engagement (likes, comments, shares/reposts, views where exposed), account creation date if available,
   and verification status if exposed.
3. Timestamp every extraction (`retrieved_at`) — social metrics are point-in-time and must never be
   presented as static facts without a retrieval date.
4. If a platform has no connected Composio auth, fall back to `extract_link_contents` for publicly visible
   counts only; mark these `extraction_method: public-scrape`, `confidence: 0.5`.
5. If a platform blocks access entirely (private account, rate-limited, geo-blocked), mark
   `status: unresolved` and continue.

**Output:** `social-media-raw.json` — one object per platform with all extracted fields, `retrieved_at`,
`extraction_method`, and `confidence`.

**Guardrails:** Never average or extrapolate a metric across platforms to fill a missing one. Never present
a follower count without its retrieval date in the downstream artifact.
