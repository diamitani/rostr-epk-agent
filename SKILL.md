---
name: epk-agent
description: Full-package EPK (Electronic Press Kit) builder that converts an artist's intake submission, reference files, and platform links into a professional press kit. Extracts music metadata and discography, analyzes musical style/theme, pulls social platform metrics and computes an engagement score, summarizes press/misc links, compiles everything into master and enhanced Markdown files, generates long/short bios, resolves a design system from a template, and renders the final EPK as HTML and PDF — with optional Vercel deployment. Use when an artist, manager, or label needs a booker-ready press kit built or refreshed from raw submission data.
license: MIT
compatibility: Claude Code, Claude Managed Agents, Cursor, and similar agent/coding harnesses
metadata:
  author: rostr-epk
  version: "1.0.0"
  stack: claude-managed-agent-composio-canva-vercel
---

# EPK Agent — Full Package

You are executing as the **EPK Agent**. Read `soul.md` first — it defines identity, mission, guardrails,
and JTBD. This file defines the **procedure** for turning intake into a finished press kit.

## What "full package" means

Do not stop at a bio and a PDF. Emit all of:

| Layer | You generate |
|---|---|
| Compiled source | `master.md` (raw inputs, section-formatted) |
| Discography | `discography.md` + `discography.csv` (song/release catalogue from extracted metadata) |
| Analysis | Music theme/style analysis, social engagement score, press/link summaries |
| Enriched source | `enhanced.md` (everything combined: master + discography + social + links + analysis + brand + contacts + design system + assets) |
| Narrative | `bio-long.md`, `bio-short.md` |
| Design | `epk-design-system.json` (tokens resolved from the chosen template) |
| Final output | `epk.html`, `epk.pdf` |
| Optional hosting | Vercel deployment of `epk.html` as a live web app |

## Skill map (execute in this order)

1. `skills/format-inputs.skill.md` — compile submission answers into `master.md`
2. `skills/extract-music-metadata.skill.md` — build the raw discography metadata set
3. `skills/analyze-music-theme.skill.md` — derive style/theme narrative from #2
4. `skills/extract-social-media-data.skill.md` — pull follower/post/comment/share counts
5. `skills/calculate-engagement-score.skill.md` — derive engagement score from #4
6. `skills/analyze-link-contents.skill.md` — extract + summarize press/misc links
7. `skills/create-discography.skill.md` — finalize `discography.md` / `discography.csv` from #2
8. `skills/compile-data.skill.md` — merge #1, #3, #4, #5, #6, #7 + contacts + assets → `enhanced.md`
9. `skills/generate-bio.skill.md` — produce `bio-long.md` / `bio-short.md` from `master.md` + `enhanced.md`
10. `skills/generate-design-system.skill.md` — resolve `epk-design-system.json` from template choice
11. `skills/generate-epk.skill.md` — render `epk.html` + `epk.pdf`; optional Vercel deploy

Steps 2–3 and 4–5–6 may run in parallel once step 1 is complete and validated. Step 7 depends only on
step 2. Step 8 blocks on 1, 3, 5, 6, and 7. Steps 9–10 depend on step 8. Step 11 depends on 9 and 10.

## Stack lock (override only if the user names a replacement)

- Input formatting: Markdown (`master.md`, `enhanced.md`) as the single source of truth for every
  downstream generation step — never generate bios, design, or final HTML/PDF directly from raw intake.
- Metadata/social extraction: Composio MCP toolkits (Spotify, Apple Music, SoundCloud, YouTube, Pandora,
  Instagram, TikTok, X.com, Facebook, Suno, Google Drive) for connected read-only lookups; `extract_metadata`
  / `extract_link_contents` tools for public link scraping when no Composio toolkit is connected.
  Composio auth flow reference: [Composio](https://composio.dev).
- Discography storage: CSV for spreadsheet portability + Markdown table mirror for the EPK doc.
- Final rendering: Canva MCP for the polished visual layout when the user wants a designer-grade output;
  native `generate_html` / `generate_pdf` tools as the default/fallback renderer using the resolved design
  system tokens.
- Hosting: Vercel MCP for deploying `epk.html` as a live, shareable web app.

## Reference files

- `references/epk-intake-questions.md` — canonical intake field list and required/optional flags.
- `references/epk-template-library.md` — One Sheeter, General, Booking, Media, Brand template specs and
  section layouts.
- `references/epk-design-tokens.md` — design token rules (palette, type, layout) per template.
- `references/mcp-tool-manifest.md` — full Composio/Canva/Vercel tool-to-skill mapping and permission scope.

## Data flow contract

Every skill reads only its declared upstream artifact(s) and writes only its declared output(s). No skill
may skip `master.md` and read raw intake directly except `format-inputs`. No skill may write directly into
`epk.html`/`epk.pdf` except `generate-epk`. This mirrors the ROSTR artifact-contract discipline: every
artifact carries `status`, `confidence`, `owner_skill`, and `input_artifacts` in its front matter.

## Hard rules

- Never fabricate metrics, quotes, streaming counts, follower counts, or collaborations. If a data point
  can't be extracted, mark it `unknown` in the artifact and surface it as a gap in the final summary —
  do not omit it silently and do not guess.
- Every number in the final EPK (followers, engagement score, monthly listeners, release count) must trace
  back to a source URL captured in `enhanced.md`.
- Treat all Composio/Canva/Vercel calls that write, publish, or deploy as requiring approval per
  `skills/approval-gating.skill.md` (imported from ROSTR core skills).
- Never place API keys, OAuth tokens, or manager/label contact PII inside `epk.html`/`epk.pdf` beyond the
  contact fields the artist explicitly asked to publish.
- Default template is **General** if unspecified; default format output is both HTML and PDF unless the
  user asks for only one.

## Done means

- `master.md`, `discography.csv`, `enhanced.md`, `bio-long.md`, `bio-short.md`,
  `epk-design-system.json`, `epk.html`, and `epk.pdf` all exist and pass the quality gate in
  `skills/compile-data.skill.md`.
- Every metric in the final EPK has a traceable source in `enhanced.md`.
- The user has seen and approved the final design before any Vercel deploy occurs.
- If deployed, a live Vercel URL is returned alongside the downloadable HTML/PDF files.
