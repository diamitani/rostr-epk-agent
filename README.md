# ROSTR EPK Agent

> Full-pipeline Electronic Press Kit builder — drop-in plugin for the [ROSTR runtime](https://github.com/diamitani/rostr-skills).

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ROSTR Plugin](https://img.shields.io/badge/ROSTR-Plugin-8b5cf6)](https://github.com/diamitani/rostr-skills)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI-SDK-black)](https://ai-sdk.dev)
[![MCP Ready](https://img.shields.io/badge/MCP-Ready-10b981)](https://modelcontextprotocol.io)

---

## What this is

The **EPK Agent** turns an artist's raw intake (form answers + links + files) into a complete, booker-ready Electronic Press Kit in one pipeline run. It lives in the ROSTR runtime as a `@epk-agent` subagent and implements all five ROSTR Hub layers (R-O-S-T-R).

**Outputs:**
| Format | How |
|---|---|
| `epk.html` | Dark-mode, responsive web EPK |
| `epk.pdf` | Via Vercel Sandbox + Puppeteer |
| `epk-deck.html` | Reveal.js animated HTML5 deck |
| `epk-deck.pptx` | PptxGenJS branded PowerPoint |
| `epk-presenton.pptx` | AI-generated via [Presenton](https://github.com/Presenton-ai/presenton) |
| Live URL | Vercel deploy (free tier supported) |

---

## How it works — ROSTR R-O-S-T-R Hub

This plugin implements the five ROSTR Hub layers:

| Layer | What this plugin does |
|---|---|
| **R**untime | `soul.md` → system prompt. AI Gateway routes Haiku (formatting) vs Sonnet (generation) |
| **O**rchestration | Sequential pipeline with 2 parallel fan-outs (music+social+press extract concurrently) |
| **S**tate | ContextEngine flat-file persistence at `.context-engine/sessions/[artist-slug]/` |
| **T**ools | Composio (read-only platform data) · Canva MCP · Vercel API · Presenton REST/MCP · PptxGenJS · Reveal.js |
| **R**eference | `soul.md` + `SKILL.md` + 11 sub-skills + 4 reference docs |

### PAL Compilation

Every run starts with **PAL (Prompt Abstraction Layer)**:

```
Parse → Ambiguity Scan → Latent Intent → Expand → Compile
```

PAL flags missing fields, routes models by task complexity, and emits a full artifact contract before the pipeline starts.

### Pipeline

```
intake
  → format-inputs                     → master.md
  ┌─────────────────────────────────────────────┐
  │ (parallel)                                  │
  │ extract-music-metadata → discography-raw    │
  │   → analyze-music-theme                     │
  │   → create-discography → discography.md     │
  │ extract-social-media-data → social-raw      │
  │   → calculate-engagement-score              │
  │ analyze-link-contents → press-summary       │
  └─────────────────────────────────────────────┘
  → compile-data                      → enhanced.md
  ┌──────────────────────────────────┐
  │ (parallel)                       │
  │ generate-bio → bio-long + short  │
  │ generate-design-system → tokens  │
  └──────────────────────────────────┘
  → generate-epk → html + pdf + reveal-js + pptx + presenton
  → deploy-to-vercel [approval required] → live URL
```

---

## Install

### Option A — Claude Code Plugin

```bash
git clone https://github.com/diamitani/rostr-epk-agent
# In Claude Code:
/plugin add ./rostr-epk-agent
```

All 11 EPK skills load immediately. The agent picks up `create-an-epk` invocations automatically.

### Option B — MCP Server (stdio)

Add to your `mcp_config.json` (Claude Desktop, any MCP client):

```json
{
  "rostr-epk-agent": {
    "command": "npx",
    "args": ["-y", "@rostr/epk-agent", "mcp"],
    "env": {
      "ANTHROPIC_API_KEY": "your_key",
      "PRESENTON_API_URL": "http://localhost:8080"
    }
  }
}
```

MCP tools exposed: `epk_run` · `epk_status` · `epk_deploy` · `epk_vercel_setup`

### Option C — REST API (self-hosted)

```bash
git clone https://github.com/diamitani/rostr-epk-agent
cd rostr-epk-agent
cp .env.example .env.local
# Fill in your keys
npm install
npm run dev
# → http://localhost:3000
```

```bash
curl -X POST http://localhost:3000/api/epk \
  -H "Content-Type: application/json" \
  -d '{
    "intake": {
      "artist_name": "Nova Ray",
      "genre": "Electronic R&B",
      "city": "Chicago",
      "spotify_url": "https://open.spotify.com/artist/...",
      "instagram_url": "https://instagram.com/novaray",
      "presentation_output": ["html", "pdf", "reveal-js", "pptx", "presenton"],
      "deploy_to_vercel": true
    }
  }'
```

Response streams as Server-Sent Events. The `X-ROSTR-Run-ID` header contains the run ID.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key (or use AI Gateway) |
| `VERCEL_AI_GATEWAY_KEY` | Recommended | Routes through Vercel AI Gateway |
| `VERCEL_TOKEN` | For deploy | Get at vercel.com/account/tokens |
| `COMPOSIO_API_KEY` | For social data | Enables platform follower counts |
| `PRESENTON_API_URL` | For AI slides | `http://localhost:8080` (self-hosted Docker) |
| `PRESENTON_API_KEY` | Optional | Required for Presenton cloud |

---

## Presenton Setup (AI Slides)

[Presenton](https://github.com/Presenton-ai/presenton) is open-source, Apache 2.0, self-hosted:

```bash
# With OpenAI (or any OpenAI-compatible endpoint)
docker run -d -p 8080:8080 \
  -e OPENAI_API_KEY=your_key \
  presenton/presenton

# With local Ollama (completely free, no API key)
docker run -d -p 8080:8080 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  presenton/presenton

# Set in .env.local:
PRESENTON_API_URL=http://localhost:8080
```

---

## Vercel Deploy (Free)

The agent can deploy your EPK as a live website. Free Vercel tier is enough for any artist.

1. Create account: [vercel.com/signup](https://vercel.com/signup) — no credit card
2. Get token: [vercel.com/account/tokens](https://vercel.com/account/tokens)
3. Add to `.env.local`: `VERCEL_TOKEN=your_token`
4. Re-run with `"deploy_to_vercel": true`

Custom domain? Add `"custom_domain": "yourartist.com"` to the intake. The agent walks you through DNS setup.

---

## ROSTR Runtime Integration

This plugin is registered in [`rostr-skills`](https://github.com/diamitani/rostr-skills) as:

```json
"skills/create-an-epk/"  →  "@epk-agent"
```

When the ROSTR runtime receives a `create-an-epk` skill invocation, it routes to this plugin. The `plugin.json` declares the full contract:

```json
{
  "rostr": {
    "type": "agent-plugin",
    "agent_id": "epk-agent",
    "mcp_endpoint": "/api/mcp",
    "api_endpoint": "/api/epk"
  }
}
```

---

## Repo Structure

```
rostr-epk-agent/
├── soul.md                          # ROSTR agent identity
├── SKILL.md                         # Skill manifest (Claude Code / ROSTR)
├── plugin.json                      # ROSTR plugin declaration
├── manifest.json                    # Skill manifest (price, vertical, tools)
├── skills/                          # 11 sub-skill .md files
├── references/                      # Intake questions, templates, design tokens, MCP manifest
└── src/
    ├── agent/
    │   ├── harness.ts               # Vercel AI SDK streamText agent loop
    │   ├── pal.ts                   # PAL compiler + ContextEngine persistence
    │   ├── pipeline.ts              # Orchestration
    │   └── tools/                   # extract-metadata, social-data, compile-data, generate-bio, render-epk
    ├── presentation/
    │   ├── revealjs.ts              # Reveal.js HTML5 deck
    │   ├── pptxgenjs.ts             # PptxGenJS PPTX builder
    │   └── presenton.ts             # Presenton REST/MCP adapter
    ├── mcp/server.ts                # MCP server (stdio + HTTP)
    └── app/                         # Next.js App Router
        ├── page.tsx                 # Plugin landing page
        └── api/epk/route.ts         # POST /api/epk streaming endpoint
```

---

## License

MIT — see [LICENSE](LICENSE).

Part of the [Artispreneur](https://artispreneur.com) label services marketplace.
Canonical ROSTR spec: [rostr-paper.vercel.app](https://rostr-paper.vercel.app)
