import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, Disc3, Gauge, Newspaper, FileDown, Rocket, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Build a Professional Electronic Press Kit in Minutes",
  description:
    "Turn your Spotify, socials, and bio into a booker-ready Electronic Press Kit. ArtistEPKs pulls your discography, scores your engagement, writes your bio, and ships a polished EPK as HTML or PDF.",
};

const TEMPLATES = [
  {
    key: "one-sheeter",
    name: "One Sheeter",
    use: "Single-page, high-density summary for quick pitches — playlist submissions, blog features, fast bookings.",
  },
  {
    key: "general",
    name: "General",
    use: "The default, all-purpose press kit for outreach, submissions, and your website's press page.",
  },
  {
    key: "booking",
    name: "Booking",
    use: "Built for talent buyers and venues — leads with performance history, then your technical and performance riders.",
  },
  {
    key: "media",
    name: "Media",
    use: "For press, journalists, and playlist curators — narrative-first, with full press coverage and discography.",
  },
  {
    key: "brand",
    name: "Brand",
    use: "For brand partnerships and sponsorships — leads with identity, audience data, and engagement numbers.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tell us about you",
    body: "Artist name, genre, links to Spotify, YouTube, SoundCloud, Instagram, TikTok — whatever you've got — and a few sentences on your story.",
  },
  {
    step: "02",
    title: "We pull the real data",
    body: "Track metadata, follower counts, and an engagement score, sourced from the links you gave us — not guessed, not invented.",
  },
  {
    step: "03",
    title: "We write the bio",
    body: "A long and short bio drafted from your actual catalog and career notes. If we can't verify it, it doesn't go in.",
  },
  {
    step: "04",
    title: "You get a press kit",
    body: "Pick a template, download the HTML or PDF, or deploy it as a live link you can drop straight into an email.",
  },
];

const FEATURES = [
  { icon: Disc3, title: "Discography extraction", body: "Pulls track and release data straight from your streaming links." },
  { icon: Gauge, title: "Engagement scoring", body: "Follower counts and an engagement score, sourced and shown, not fabricated." },
  { icon: Newspaper, title: "Press analysis", body: "Summarizes the press coverage you already have into a clean, citable section." },
  { icon: Sparkles, title: "AI-drafted bio", body: "Long and short bios written from your real material only — nothing invented." },
  { icon: FileDown, title: "HTML + PDF export", body: "Five template styles, yours to download and keep. No lock-in." },
  { icon: Rocket, title: "One-click live link", body: "Deploy your EPK as a real URL you can send instead of an attachment." },
];

const WHO_ITS_FOR = [
  "Independent artists pitching talent buyers and venues",
  "Bands submitting to blogs, playlists, and radio",
  "DJs and producers who need a one-sheet for bookings",
  "Anyone currently sending labels a Google Doc and knows it's costing them",
];

const FAQ = [
  {
    q: "What is an electronic press kit (EPK)?",
    a: "An EPK is a musician's professional resume — bio, discography, social reach, and contact info in one document — built to send to talent bookers, labels, media, and brands.",
  },
  {
    q: "Do I need a manager or label to use this?",
    a: "No. This is built for independent artists managing their own outreach. If you have a manager or label contact, there's a place for that too.",
  },
  {
    q: "Will you make up facts about my music?",
    a: "No. Every number and claim in your EPK traces back to a link or answer you gave us. If something can't be verified, it's marked as unknown or left out — never invented.",
  },
  {
    q: "Can I edit the bio after it's generated?",
    a: "Yes. The generated bio is a draft — review it, edit it, and regenerate it before it goes into your final EPK.",
  },
  {
    q: "What if I don't have social links yet?",
    a: "You can still build an EPK. Sections without source data are shown as not provided instead of being faked or silently dropped.",
  },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{children}</p>
  );
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ArtistEPKs",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Electronic press kit builder for independent musicians — pulls discography and social data, drafts a bio, and renders a press kit as HTML or PDF.",
};

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            Artist<span className="text-primary">EPKs</span>
          </Link>
          <nav className="hidden items-center gap-8 font-mono text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#templates" className="transition-colors hover:text-foreground">Templates</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <Button asChild size="sm">
            <Link href="/build">Build your EPK</Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.18),transparent)]"
        />
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 border-primary/40 font-mono text-xs uppercase tracking-wider text-primary">
            Electronic Press Kit Builder
          </Badge>
          <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
            Your music deserves a press kit that doesn&rsquo;t look like a Word doc from 2009.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Give us your Spotify, your socials, and a few sentences about yourself. We&rsquo;ll pull your
            discography, score your engagement, write your bio, and ship a press kit venues and labels
            actually open.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/build">
                Build your EPK <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <a href="#templates">See the 5 templates</a>
            </Button>
          </div>
        </div>

        {/* Trust strip — factual claims only, no fabricated numbers */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 border-y border-border/60 py-6 text-sm text-muted-foreground sm:grid-cols-4">
          {[
            "No account required to start",
            "5 press kit styles",
            "Export as HTML or PDF",
            "Nothing ships without your review",
          ].map((claim) => (
            <div key={claim} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              <span>{claim}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Four steps from raw links to a finished press kit.
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="reveal">
                <span className="font-display text-4xl text-primary/70">{s.step}</span>
                <h3 className="mt-3 font-display text-xl font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMPLATE GALLERY */}
      <section id="templates" className="border-y border-border/60 bg-card/40 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Five templates, one pipeline</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Built for the room you&rsquo;re walking into.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            A booking agent, a blog editor, and a brand partner are all reading for different
            things. Pick the template built for your pitch.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <Card key={t.key} className="reveal border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-xl font-medium">{t.name}</CardTitle>
                  <CardDescription className="leading-relaxed">{t.use}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            <Card className="reveal flex flex-col justify-center border-dashed border-primary/40 bg-transparent">
              <CardContent className="pt-6 text-center">
                <p className="font-mono text-sm text-muted-foreground">Not sure which one?</p>
                <p className="mt-1 font-display text-lg">General is the safe default.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>What&rsquo;s inside</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Every section traces back to a source.
          </h2>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="reveal flex gap-4">
                <f.icon className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-lg font-medium">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-y border-border/60 bg-card/40 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <SectionEyebrow>Who it&rsquo;s for</SectionEyebrow>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            If you&rsquo;re pitching yourself, this is for you.
          </h2>
          <ul className="mx-auto mt-10 max-w-xl space-y-4 text-left">
            {WHO_ITS_FOR.map((line) => (
              <li key={line} className="flex items-start gap-3 text-muted-foreground">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Electronic press kits, answered plainly.
          </h2>
          <dl className="mt-12 divide-y divide-border/60">
            {FAQ.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="font-display text-lg font-medium">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 pb-28 pt-8">
        <div
          className={cn(
            "mx-auto max-w-4xl rounded-2xl border border-border/60 bg-card px-8 py-16 text-center",
            "bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]"
          )}
        >
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Your next booking email deserves a real attachment.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Ten minutes of links and answers. One press kit you&rsquo;re not embarrassed to send.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/build">
              Build your EPK <ArrowRight className="ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-display text-lg">
            Artist<span className="text-primary">EPKs</span>
          </span>
          <p className="font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ArtistEPKs. Every EPK traces back to a source.
          </p>
        </div>
      </footer>
    </main>
  );
}
