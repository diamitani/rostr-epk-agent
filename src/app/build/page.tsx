"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { saveIntake } from "@/lib/epk-session";
import { TEMPLATE_OPTIONS, ARTIST_TYPE_OPTIONS } from "@/lib/epk-form-options";
import type { ArtistType, EPKIntake } from "@/types";

type FormState = Partial<EPKIntake> & {
  press_links_text?: string;
  misc_links_text?: string;
};

const STEPS = [
  "The basics",
  "Your music",
  "Socials & press",
  "Your story",
  "Career details",
  "Contact",
  "Review",
] as const;

function Field({
  label,
  htmlFor,
  optional = true,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">optional</span>}
      </Label>
      {children}
    </div>
  );
}

export default function BuildPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<FormState>({ template: "general" });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleArtistType = (value: ArtistType) => {
    setForm((f) => {
      const current = f.artist_type || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, artist_type: next };
    });
  };

  const canProceedFromStep0 = Boolean(form.artist_name?.trim() && form.genre?.trim());
  const isLastStep = step === STEPS.length - 1;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    if (!canProceedFromStep0) {
      setError("Artist name and genre are required — head back to step 1.");
      setStep(0);
      return;
    }
    setSubmitting(true);
    setError(null);

    const { press_links_text, misc_links_text, ...rest } = form;
    const intake: EPKIntake = {
      ...rest,
      artist_name: form.artist_name!.trim(),
      genre: form.genre!.trim(),
      city: form.city?.trim() || "",
      press_links: (press_links_text || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      misc_links: (misc_links_text || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      presentation_output: ["html", "pdf"],
    };

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    saveIntake(sessionId, intake);
    router.push(`/build/${sessionId}`);
  };

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Build your EPK</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          {STEPS[step]}
        </h1>

        {/* Step indicator */}
        <div className="mt-6 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>

        <div className="mt-10 space-y-6">
          {step === 0 && (
            <>
              <Field label="Artist name" htmlFor="artist_name" optional={false}>
                <Input
                  id="artist_name"
                  value={form.artist_name || ""}
                  onChange={(e) => set("artist_name", e.target.value)}
                  placeholder="Your stage name"
                  autoFocus
                />
              </Field>
              <Field label="Main genre" htmlFor="genre" optional={false}>
                <Input
                  id="genre"
                  value={form.genre || ""}
                  onChange={(e) => set("genre", e.target.value)}
                  placeholder="Hip-Hop, R&B, Electronic, Indie Rock..."
                />
              </Field>
              <Field label="City" htmlFor="city">
                <Input
                  id="city"
                  value={form.city || ""}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Where you're based now"
                />
              </Field>
              <Field label="Press kit style" htmlFor="template">
                <Select value={form.template || "general"} onValueChange={(v) => set("template", v as EPKIntake["template"])}>
                  <SelectTrigger id="template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} — {t.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Paste whatever links you have. We&rsquo;ll pull your discography from these — skip
                any platform you&rsquo;re not on.
              </p>
              {[
                ["spotify_url", "Spotify"],
                ["apple_music_url", "Apple Music"],
                ["soundcloud_url", "SoundCloud"],
                ["youtube_url", "YouTube"],
                ["pandora_url", "Pandora"],
                ["suno_url", "Suno"],
              ].map(([key, label]) => (
                <Field key={key} label={label} htmlFor={key}>
                  <Input
                    id={key}
                    type="url"
                    value={(form[key as keyof FormState] as string) || ""}
                    onChange={(e) => set(key as keyof FormState, e.target.value as never)}
                    placeholder={`https://...`}
                  />
                </Field>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              {[
                ["instagram_url", "Instagram"],
                ["tiktok_url", "TikTok"],
                ["twitter_url", "X / Twitter"],
                ["facebook_url", "Facebook"],
                ["website_url", "Website"],
              ].map(([key, label]) => (
                <Field key={key} label={label} htmlFor={key}>
                  <Input
                    id={key}
                    type="url"
                    value={(form[key as keyof FormState] as string) || ""}
                    onChange={(e) => set(key as keyof FormState, e.target.value as never)}
                    placeholder="https://..."
                  />
                </Field>
              ))}
              <Field label="Press coverage links (one per line)" htmlFor="press_links_text">
                <Textarea
                  id="press_links_text"
                  value={form.press_links_text || ""}
                  onChange={(e) => set("press_links_text", e.target.value)}
                  placeholder={"https://blog.example.com/feature\nhttps://radio.example.com/interview"}
                  rows={4}
                />
              </Field>
              <Field label="Other links (one per line)" htmlFor="misc_links_text">
                <Textarea
                  id="misc_links_text"
                  value={form.misc_links_text || ""}
                  onChange={(e) => set("misc_links_text", e.target.value)}
                  rows={3}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="A few notes for your bio" htmlFor="bio_notes">
                <Textarea
                  id="bio_notes"
                  value={form.bio_notes || ""}
                  onChange={(e) => set("bio_notes", e.target.value)}
                  placeholder="Tell us your story — we'll turn this into a written bio, not invent one."
                  rows={4}
                />
              </Field>
              <Field label="Career highlights" htmlFor="career_highlights">
                <Textarea
                  id="career_highlights"
                  value={form.career_highlights || ""}
                  onChange={(e) => set("career_highlights", e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label="Influences" htmlFor="influences">
                <Input
                  id="influences"
                  value={form.influences || ""}
                  onChange={(e) => set("influences", e.target.value)}
                  placeholder="Artists who shaped your sound"
                />
              </Field>
              <Field label="Your sound / theme, in your own words" htmlFor="music_theme_notes">
                <Textarea
                  id="music_theme_notes"
                  value={form.music_theme_notes || ""}
                  onChange={(e) => set("music_theme_notes", e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label="Your identity / brand statement" htmlFor="artist_identity_brand">
                <Textarea
                  id="artist_identity_brand"
                  value={form.artist_identity_brand || ""}
                  onChange={(e) => set("artist_identity_brand", e.target.value)}
                  rows={3}
                />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label>What you do</Label>
                <div className="flex flex-wrap gap-2">
                  {ARTIST_TYPE_OPTIONS.map((opt) => {
                    const active = (form.artist_type || []).includes(opt.value);
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => toggleArtistType(opt.value)}
                      >
                        <Badge
                          variant={active ? "default" : "outline"}
                          className={cn("cursor-pointer select-none", active && "ring-1 ring-ring")}
                        >
                          {opt.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Year you started" htmlFor="year_started">
                <Input
                  id="year_started"
                  value={form.year_started || ""}
                  onChange={(e) => set("year_started", e.target.value)}
                  placeholder="2019"
                />
              </Field>
              <Field label="P.R.O. (if registered)" htmlFor="pro_affiliation">
                <Input
                  id="pro_affiliation"
                  value={form.pro_affiliation || ""}
                  onChange={(e) => set("pro_affiliation", e.target.value)}
                  placeholder="ASCAP, BMI, SESAC..."
                />
              </Field>
              <Field label="Past collaborations" htmlFor="past_collaborations">
                <Textarea
                  id="past_collaborations"
                  value={form.past_collaborations || ""}
                  onChange={(e) => set("past_collaborations", e.target.value)}
                  rows={2}
                />
              </Field>
              <Field label="Notable performances" htmlFor="performances">
                <Textarea
                  id="performances"
                  value={form.performances || ""}
                  onChange={(e) => set("performances", e.target.value)}
                  rows={2}
                />
              </Field>
              <Field label="Technical rider" htmlFor="technical_rider">
                <Textarea
                  id="technical_rider"
                  value={form.technical_rider || ""}
                  onChange={(e) => set("technical_rider", e.target.value)}
                  rows={2}
                />
              </Field>
              <Field label="Performance rider" htmlFor="performance_rider">
                <Textarea
                  id="performance_rider"
                  value={form.performance_rider || ""}
                  onChange={(e) => set("performance_rider", e.target.value)}
                  rows={2}
                />
              </Field>
            </>
          )}

          {step === 5 && (
            <>
              <Field label="Manager name" htmlFor="manager_name">
                <Input id="manager_name" value={form.manager_name || ""} onChange={(e) => set("manager_name", e.target.value)} />
              </Field>
              <Field label="Manager email" htmlFor="manager_email">
                <Input id="manager_email" type="email" value={form.manager_email || ""} onChange={(e) => set("manager_email", e.target.value)} />
              </Field>
              <Field label="Label" htmlFor="label_name">
                <Input id="label_name" value={form.label_name || ""} onChange={(e) => set("label_name", e.target.value)} placeholder="Independent, if none" />
              </Field>
              <Field label="Booking email" htmlFor="booking_email">
                <Input id="booking_email" type="email" value={form.booking_email || ""} onChange={(e) => set("booking_email", e.target.value)} />
              </Field>
            </>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="font-display text-lg">{form.artist_name || "Untitled artist"}</p>
                <p className="text-sm text-muted-foreground">{form.genre || "No genre set"}</p>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Template: {TEMPLATE_OPTIONS.find((t) => t.value === form.template)?.label || "General"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                We&rsquo;ll pull your discography and social data, write a bio from what you gave us,
                and build your EPK. Nothing gets deployed publicly — this stays yours to review first.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Starting...
                </>
              ) : (
                <>
                  Build my EPK <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (step === 0 && !canProceedFromStep0) {
                  setError("Artist name and genre are required.");
                  return;
                }
                setError(null);
                next();
              }}
            >
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
