# MCP & Tool Manifest — EPK Agent

Full mapping of tools/MCPs to skills, with permission scope and approval requirements. Follows
`approval-gating.skill.md`: any write/publish/deploy action requires an explicit approval record before
execution.

## Native tools

| Tool | Used by skill(s) | Scope |
|---|---|---|
| `generate_md` | format-inputs, create-discography, compile-data, generate-bio | Write generated artifact files only |
| `generate_html` | generate-epk | Write `epk.html` only |
| `generate_pdf` | generate-epk | Write `epk.pdf` only |
| `generate_design_system` | generate-design-system | Write `epk-design-system.json` only |
| `extract_metadata` | extract-music-metadata | Read-only public link metadata |
| `extract_link_contents` | analyze-link-contents, extract-social-media-data (fallback) | Read-only public page fetch |
| `analyze_link_contents` | analyze-link-contents | Read-only summarization of fetched content |
| `compile_submission_data` | compile-data | Merge upstream artifacts only |
| `create_discography` | create-discography | Write `discography.csv` / `discography.md` only |

## MCP: Composio

**Role:** Any-app connector layer for platform data extraction. Read-only for this agent.

| Toolkit | Used by skill(s) | Scope |
|---|---|---|
| Spotify | extract-music-metadata | Read public artist/track metadata |
| Apple Music | extract-music-metadata | Read public artist/track metadata |
| SoundCloud | extract-music-metadata | Read public track metadata |
| YouTube (Data API) | extract-music-metadata, extract-social-media-data | Read video metadata + channel stats |
| Pandora | extract-music-metadata | Read public artist/track metadata |
| Suno | extract-music-metadata | Read public track metadata if exposed |
| Instagram | extract-social-media-data | Read public profile stats + recent post engagement |
| TikTok | extract-social-media-data | Read public profile stats + recent post engagement |
| X.com | extract-social-media-data | Read public profile stats |
| Facebook | extract-social-media-data | Read public page stats |
| Google Drive | format-inputs (media intake) | Read-only access to artist-shared brand assets/media folder |

**Auth model:** Per-user Composio Tool Router session (`composio.create(userId)`). Default toolkit set is
empty — the artist/manager enables only the toolkits matching their submitted links. Platform API key stays
server-side; end users complete their own OAuth per platform where required.

**Denied:** No Composio toolkit call may post, comment, follow, or modify any connected account. Read-only,
always.

## MCP: Canva

**Role:** Optional designer-grade final rendering layer for `generate-epk`.

| Action | Used by skill(s) | Approval required? |
|---|---|---|
| Create design from template + content | generate-epk | No — draft creation is non-destructive |
| Export design as PDF/PNG/HTML | generate-epk | No — export to agent workspace is non-destructive |
| Publish/share Canva design publicly | generate-epk (only if user asks) | **Yes** — approval required (public visibility change) |

## MCP: Vercel

**Role:** Optional hosting layer to deploy `epk.html` as a live web app.

| Action | Used by skill(s) | Approval required? |
|---|---|---|
| Create/link Vercel project | generate-epk | No — scoped to agent's own project namespace |
| Preview deploy | generate-epk | No — preview URLs are not production-facing |
| Production deploy / domain assignment | generate-epk | **Yes** — approval required per `approval-gating.skill.md` |

## Approval gating summary

Actions requiring an explicit approval record before execution:
- Vercel production deploy or custom domain assignment.
- Canva public publish/share link generation.
- Publishing manager/label phone number or email beyond what the artist explicitly flagged for public
  release.
- Any action that would post/message on the artist's behalf on a connected platform (currently none are in
  scope — flagged here as a standing boundary, not a planned feature).

## Denied tools (agent-wide)

- Any write, delete, or publish action on a connected social/music platform account.
- Any tool that would expose a raw API key, OAuth token, or platform secret in an artifact.
- Any production deploy or public-share action without a corresponding approval record.
