/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROSTR EPK Agent — AI Press Kit Builder Plugin",
  description:
    "Drop-in ROSTR plugin. Full EPK pipeline: intake → master.md → discography → social score → bios → design → HTML + PDF + Reveal.js + PPTX + Presenton. Powered by Vercel AI SDK.",
};

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080810" }}>
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <span style={styles.logoR}>R</span>
            <span style={{ color: "#f0f0ff", fontWeight: 700 }}>OSTR</span>
            <span style={styles.logoDivider}>/</span>
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>epk-agent</span>
          </div>
          <div style={styles.navLinks}>
            <a href="#how" style={styles.navLink}>How it works</a>
            <a href="#install" style={styles.navLink}>Install</a>
            <a href="#outputs" style={styles.navLink}>Outputs</a>
            <a
              href="https://github.com/diamitani/rostr-epk-agent"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.navCta}
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={styles.hero}>
        {/* Glow orbs */}
        <div style={{ ...styles.orb, top: "-20%", left: "20%", background: "rgba(139,92,246,0.35)" }} />
        <div style={{ ...styles.orb, top: "30%", right: "-10%", background: "rgba(245,158,11,0.15)", width: 500, height: 500 }} />

        <div style={styles.heroContent}>
          <div style={styles.heroBadgeRow}>
            <span style={styles.badge}>ROSTR Runtime Plugin</span>
            <span style={{ ...styles.badge, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
              v2.0.0
            </span>
            <span style={{ ...styles.badge, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
              MIT License
            </span>
          </div>

          <h1 style={styles.heroH1}>
            The EPK Agent
            <br />
            <span style={styles.heroGradient}>for ROSTR</span>
          </h1>

          <p style={styles.heroSub}>
            Full-pipeline Electronic Press Kit builder. Intake → master.md → discography →
            social analytics → bios → design system → HTML, PDF, Reveal.js deck, PPTX,
            and Presenton AI slides. Drop-in plugin for the ROSTR runtime.
          </p>

          <div style={styles.heroCtas}>
            <a href="#install" style={styles.ctaPrimary}>
              Install Plugin →
            </a>
            <a
              href="https://github.com/diamitani/rostr-epk-agent"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.ctaSecondary}
            >
              View on GitHub
            </a>
          </div>

          {/* Install snippet */}
          <div style={styles.codeBlock}>
            <span style={{ color: "#6b7280", userSelect: "none" }}>$ </span>
            <span style={{ color: "#a78bfa" }}>npx</span>
            <span style={{ color: "#f0f0ff" }}> -y @rostr/epk-agent mcp</span>
          </div>
        </div>
      </section>

      {/* ── ROSTR ARCHITECTURE EXPLAINER ────────────────────────────────── */}
      <section id="how" style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionLabel}>How it works</p>
          <h2 style={styles.sectionH2}>Built on the ROSTR R-O-S-T-R Hub</h2>
          <p style={styles.sectionSub}>
            ROSTR is a runtime coordination layer for agents. The five layers spell{" "}
            <strong style={{ color: "#a78bfa" }}>R-O-S-T-R</strong>. This plugin
            implements all five.
          </p>

          <div style={styles.rostrGrid}>
            {[
              {
                letter: "R",
                name: "Runtime",
                desc: "PAL-compiled config. soul.md is the system prompt. AI Gateway routes models by task — Haiku for formatting, Sonnet for generation.",
                color: "#8b5cf6",
              },
              {
                letter: "O",
                name: "Orchestration",
                desc: "Sequential pipeline with two safe parallel fan-outs: music+social+press extract concurrently, then compile, then generate.",
                color: "#a78bfa",
              },
              {
                letter: "S",
                name: "State",
                desc: "ContextEngine flat-file persistence at .context-engine/sessions/[artist-slug]/. Zero infrastructure. Sessions survive across agent invocations.",
                color: "#c4b5fd",
              },
              {
                letter: "T",
                name: "Tools",
                desc: "Composio (read-only platform data), Canva MCP (rendering), Vercel API (deploy), Presenton REST/MCP (AI slides), PptxGenJS, Reveal.js.",
                color: "#f59e0b",
              },
              {
                letter: "R",
                name: "Reference",
                desc: "soul.md + SKILL.md + 11 sub-skills + epk-template-library + epk-design-tokens + mcp-tool-manifest. All in /skills and /references.",
                color: "#10b981",
              },
            ].map((item, i) => (
              <div key={i} style={styles.rostrCard}>
                <div style={{ ...styles.rostrLetter, color: item.color }}>
                  {item.letter}
                </div>
                <div style={{ ...styles.rostrName, color: item.color }}>{item.name}</div>
                <p style={styles.rostrDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAL PIPELINE ────────────────────────────────────────────────── */}
      <section style={{ ...styles.section, background: "#0d0d1f" }}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionLabel}>PAL Engine</p>
          <h2 style={styles.sectionH2}>Parse → Ambiguity → Intent → Expand → Compile</h2>
          <p style={styles.sectionSub}>
            Every run starts with PAL — the Prompt Abstraction Layer. It compiles your
            intake into a structured manifest before a single pipeline step runs.
          </p>

          <div style={styles.pipeline}>
            {[
              { step: "1", skill: "format-inputs", output: "master.md", icon: "📋" },
              { step: "2∥", skill: "extract-music-metadata + extract-social-data + analyze-press", output: "discography-raw + social-raw + press-summary", icon: "⚡" },
              { step: "3", skill: "compile-data", output: "enhanced.md", icon: "🔀" },
              { step: "4∥", skill: "generate-bio + generate-design-system", output: "bio-long.md + bio-short.md + design-tokens.json", icon: "✍️" },
              { step: "5", skill: "generate-epk", output: "HTML + PDF + Reveal.js + PPTX + Presenton", icon: "🎨" },
              { step: "6*", skill: "deploy-to-vercel", output: "Live URL + setup instructions", icon: "🚀" },
            ].map((s, i) => (
              <div key={i} style={styles.pipelineStep}>
                <div style={styles.pipelineIcon}>{s.icon}</div>
                <div style={styles.pipelineStepNum}>{s.step}</div>
                <div style={styles.pipelineSkill}>{s.skill}</div>
                <div style={styles.pipelineArrow}>→</div>
                <div style={styles.pipelineOutput}>{s.output}</div>
              </div>
            ))}
          </div>
          <p style={{ color: "#6b7280", fontSize: "0.8rem", textAlign: "center", marginTop: "1rem" }}>
            ∥ = runs in parallel · * = requires approval per ROSTR approval-gating
          </p>
        </div>
      </section>

      {/* ── OUTPUTS ─────────────────────────────────────────────────────── */}
      <section id="outputs" style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionLabel}>Outputs</p>
          <h2 style={styles.sectionH2}>5 presentation formats, 1 pipeline</h2>

          <div style={styles.outputsGrid}>
            {[
              { name: "HTML EPK", desc: "Dark-mode, responsive web page. Live at your Vercel URL.", icon: "🌐", color: "#8b5cf6" },
              { name: "PDF", desc: "Print-ready via Vercel Sandbox + Puppeteer. A4 format.", icon: "📄", color: "#6366f1" },
              { name: "Reveal.js Deck", desc: "Animated HTML5 presentation. Cover, bio, discography, social, press, contact slides.", icon: "🎞️", color: "#a78bfa" },
              { name: "PPTX", desc: "Branded PowerPoint via PptxGenJS. Dark theme with design tokens applied.", icon: "📊", color: "#f59e0b" },
              { name: "Presenton AI", desc: "AI-generated slides via open-source Presenton (self-hosted Docker or cloud). PPTX + PDF export.", icon: "✨", color: "#10b981" },
            ].map((o, i) => (
              <div key={i} style={styles.outputCard}>
                <div style={styles.outputIcon}>{o.icon}</div>
                <div style={{ ...styles.outputName, color: o.color }}>{o.name}</div>
                <p style={styles.outputDesc}>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTALL ─────────────────────────────────────────────────────── */}
      <section id="install" style={{ ...styles.section, background: "#0d0d1f" }}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionLabel}>Install</p>
          <h2 style={styles.sectionH2}>3 ways to use this plugin</h2>

          <div style={styles.installGrid}>
            {/* Option A — Claude Code */}
            <div style={styles.installCard}>
              <div style={styles.installBadge}>Option A</div>
              <h3 style={styles.installTitle}>Claude Code Plugin</h3>
              <p style={styles.installDesc}>Load all skills into Claude Code instantly.</p>
              <div style={styles.codeBlockSmall}>
                <div style={styles.codeLine}>
                  <span style={{ color: "#6b7280" }}># In Claude Code:</span>
                </div>
                <div style={styles.codeLine}>
                  <span style={{ color: "#a78bfa" }}>/plugin add</span>
                  <span style={{ color: "#f0f0ff" }}> ./rostr-epk-agent</span>
                </div>
              </div>
            </div>

            {/* Option B — MCP */}
            <div style={styles.installCard}>
              <div style={{ ...styles.installBadge, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>Option B</div>
              <h3 style={styles.installTitle}>MCP Server</h3>
              <p style={styles.installDesc}>Wire to any ROSTR runtime or Claude via MCP.</p>
              <div style={styles.codeBlockSmall}>
                <div style={styles.codeLine}>
                  <span style={{ color: "#6b7280" }}>// mcp_config.json</span>
                </div>
                <div style={styles.codeLine}>
                  <span style={{ color: "#f59e0b" }}>"rostr-epk-agent"</span>
                  <span style={{ color: "#f0f0ff" }}>: {"{"}</span>
                </div>
                <div style={styles.codeLine}>
                  <span style={{ color: "#f0f0ff" }}>  "command": </span>
                  <span style={{ color: "#a78bfa" }}>"npx"</span>
                  <span style={{ color: "#f0f0ff" }}>,</span>
                </div>
                <div style={styles.codeLine}>
                  <span style={{ color: "#f0f0ff" }}>  "args": [</span>
                  <span style={{ color: "#a78bfa" }}>"-y"</span>
                  <span style={{ color: "#f0f0ff" }}>, </span>
                  <span style={{ color: "#a78bfa" }}>"@rostr/epk-agent"</span>
                  <span style={{ color: "#f0f0ff" }}>, </span>
                  <span style={{ color: "#a78bfa" }}>"mcp"</span>
                  <span style={{ color: "#f0f0ff" }}>]</span>
                </div>
                <div style={styles.codeLine}>
                  <span style={{ color: "#f0f0ff" }}>{"}"}</span>
                </div>
              </div>
            </div>

            {/* Option C — REST API */}
            <div style={styles.installCard}>
              <div style={{ ...styles.installBadge, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>Option C</div>
              <h3 style={styles.installTitle}>REST API</h3>
              <p style={styles.installDesc}>Call from any language. Streams SSE events.</p>
              <div style={styles.codeBlockSmall}>
                <div style={styles.codeLine}>
                  <span style={{ color: "#a78bfa" }}>POST</span>
                  <span style={{ color: "#f0f0ff" }}> /api/epk</span>
                </div>
                <div style={styles.codeLine}>
                  <span style={{ color: "#6b7280" }}>Content-Type: application/json</span>
                </div>
                <div style={styles.codeLine}>&nbsp;</div>
                <div style={styles.codeLine}>
                  <span style={{ color: "#f0f0ff" }}>{"{ \"intake\": { \"artist_name\": \"...\", ... } }"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VERCEL DEPLOY SECTION ────────────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionLabel}>Hosting</p>
          <h2 style={styles.sectionH2}>Deploy your EPK as a live website — free</h2>
          <p style={styles.sectionSub}>
            The agent can automatically deploy your finished EPK to Vercel. Free tier
            covers everything artists need — no credit card required.
          </p>

          <div style={styles.vercelSteps}>
            {[
              { num: "1", title: "Create free Vercel account", desc: "Go to vercel.com/signup — no credit card, no limits for personal projects.", link: "https://vercel.com/signup" },
              { num: "2", title: "Get an API token", desc: "vercel.com/account/tokens → Create Token → copy it.", link: "https://vercel.com/account/tokens" },
              { num: "3", title: "Set VERCEL_TOKEN in .env", desc: "Add VERCEL_TOKEN=... to your .env.local and re-run the agent." },
              { num: "4", title: "Agent deploys + returns URL", desc: "Your EPK goes live at yourartist-epk.vercel.app (or your custom domain)." },
            ].map((s, i) => (
              <div key={i} style={styles.vercelStep}>
                <div style={styles.vercelStepNum}>{s.num}</div>
                <div>
                  <div style={styles.vercelStepTitle}>
                    {s.title}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6", marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                        → {new URL(s.link).hostname}
                      </a>
                    )}
                  </div>
                  <p style={styles.vercelStepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "0.75rem" }}>
            <p style={{ color: "#a78bfa", fontWeight: 600, marginBottom: "0.5rem" }}>💡 Custom domain support</p>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Point your artist domain to Vercel with a CNAME to <code style={{ color: "#f0f0ff", fontFamily: "var(--font-mono)" }}>cname.vercel-dns.com</code>.
              The agent will walk you through the DNS setup step by step. Free SSL included automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.logo}>
            <span style={styles.logoR}>R</span>
            <span style={{ color: "#f0f0ff", fontWeight: 700 }}>OSTR</span>
            <span style={styles.logoDivider}>/</span>
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>epk-agent</span>
          </div>
          <p style={{ color: "#4b5563", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Part of the Artispreneur label services marketplace · MIT License
          </p>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
            {[
              { label: "GitHub", href: "https://github.com/diamitani/rostr-epk-agent" },
              { label: "ROSTR Skills", href: "https://github.com/diamitani/rostr-skills" },
              { label: "rostr-paper", href: "https://rostr-paper.vercel.app" },
              { label: "Vercel", href: "https://vercel.com/signup" },
            ].map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    background: "rgba(8,8,16,0.85)",
  },
  navInner: {
    maxWidth: 1100, margin: "0 auto", padding: "0 2rem",
    height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: "0.2rem", fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem" },
  logoR: { color: "#8b5cf6", fontWeight: 900, fontSize: "1.2rem" },
  logoDivider: { color: "#374151", margin: "0 0.3rem" },
  navLinks: { display: "flex", alignItems: "center", gap: "1.5rem" },
  navLink: { color: "#9ca3af", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" },
  navCta: {
    color: "#a78bfa", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600,
    padding: "0.4rem 1rem", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "0.5rem",
    transition: "all 0.2s",
  },

  hero: {
    position: "relative", overflow: "hidden",
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "8rem 2rem 6rem",
    background: "radial-gradient(ellipse at 30% -20%, rgba(139,92,246,0.25) 0%, transparent 60%)",
  },
  orb: {
    position: "absolute", borderRadius: "50%",
    width: 600, height: 600, filter: "blur(80px)",
    pointerEvents: "none",
  },
  heroContent: { position: "relative", zIndex: 1, maxWidth: 760, textAlign: "center" },
  heroBadgeRow: { display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" },
  badge: {
    display: "inline-block",
    background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)",
    color: "#a78bfa", padding: "0.3rem 0.9rem", borderRadius: "9999px",
    fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
  },
  heroH1: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: "clamp(3.5rem, 9vw, 6.5rem)",
    fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em",
    color: "#f0f0ff", marginBottom: "1.5rem",
  },
  heroGradient: {
    background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #c4b5fd 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroSub: { fontSize: "1.15rem", color: "#9ca3af", lineHeight: 1.7, marginBottom: "2.5rem" },
  heroCtas: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" },
  ctaPrimary: {
    padding: "0.85rem 2rem", background: "#8b5cf6", color: "white",
    borderRadius: "0.6rem", textDecoration: "none", fontWeight: 700, fontSize: "1rem",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 0 30px rgba(139,92,246,0.4)",
  },
  ctaSecondary: {
    padding: "0.85rem 2rem", color: "#a78bfa",
    border: "1px solid rgba(139,92,246,0.4)", borderRadius: "0.6rem",
    textDecoration: "none", fontWeight: 600, fontSize: "1rem",
  },
  codeBlock: {
    display: "inline-block", fontFamily: "'JetBrains Mono', monospace",
    background: "#0f0f1a", border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: "0.6rem", padding: "0.75rem 1.5rem", fontSize: "0.95rem",
    color: "#f0f0ff", marginTop: "1rem",
  },

  section: { padding: "6rem 2rem" },
  sectionInner: { maxWidth: 1000, margin: "0 auto" },
  sectionLabel: {
    fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "#8b5cf6", marginBottom: "0.75rem",
  },
  sectionH2: {
    fontFamily: "'Outfit', sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
    fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f0ff",
    marginBottom: "1rem", lineHeight: 1.1,
  },
  sectionSub: { fontSize: "1.05rem", color: "#9ca3af", lineHeight: 1.7, maxWidth: 640, marginBottom: "3rem" },

  rostrGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.25rem", marginTop: "2rem" },
  rostrCard: {
    background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "1rem", padding: "1.5rem",
  },
  rostrLetter: { fontFamily: "'Outfit', sans-serif", fontSize: "2.5rem", fontWeight: 900, lineHeight: 1 },
  rostrName: { fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0.5rem 0" },
  rostrDesc: { fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6 },

  pipeline: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  pipelineStep: {
    display: "grid", gridTemplateColumns: "2rem 1.5rem 1fr 1.5rem 1fr",
    alignItems: "center", gap: "1rem",
    background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "0.6rem", padding: "0.85rem 1.25rem",
  },
  pipelineIcon: { fontSize: "1.1rem" },
  pipelineStepNum: { fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  pipelineSkill: { fontSize: "0.85rem", color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace" },
  pipelineArrow: { color: "#374151", textAlign: "center" as const },
  pipelineOutput: { fontSize: "0.82rem", color: "#6b7280" },

  outputsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" },
  outputCard: {
    background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "1rem", padding: "1.5rem",
    transition: "border-color 0.2s, transform 0.2s",
  },
  outputIcon: { fontSize: "1.75rem", marginBottom: "0.75rem" },
  outputName: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" },
  outputDesc: { fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6 },

  installGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" },
  installCard: {
    background: "#0a0a14", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "1rem", padding: "1.75rem",
  },
  installBadge: {
    display: "inline-block", fontSize: "0.7rem", fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
    color: "#8b5cf6", padding: "0.2rem 0.75rem", borderRadius: "9999px",
    marginBottom: "0.75rem",
  },
  installTitle: { fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#f0f0ff", marginBottom: "0.5rem" },
  installDesc: { fontSize: "0.85rem", color: "#6b7280", marginBottom: "1rem" },
  codeBlockSmall: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem",
    background: "#080810", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "0.5rem", padding: "1rem",
  },
  codeLine: { lineHeight: 1.8 },

  vercelSteps: { display: "flex", flexDirection: "column", gap: "1rem" },
  vercelStep: {
    display: "flex", alignItems: "flex-start", gap: "1.25rem",
    background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "0.75rem", padding: "1.25rem 1.5rem",
  },
  vercelStepNum: {
    flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
    background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)",
    color: "#a78bfa", fontWeight: 800, fontSize: "0.9rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
  },
  vercelStepTitle: { fontWeight: 600, color: "#f0f0ff", fontSize: "0.95rem", marginBottom: "0.25rem" },
  vercelStepDesc: { fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.5 },

  footer: { borderTop: "1px solid rgba(255,255,255,0.06)", padding: "3rem 2rem" },
  footerInner: { maxWidth: 1000, margin: "0 auto" },
  footerLink: { color: "#4b5563", fontSize: "0.85rem", textDecoration: "none" },
};
