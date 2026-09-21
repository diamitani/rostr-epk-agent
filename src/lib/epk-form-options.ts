import type { ArtistType } from "@/types";

export const TEMPLATE_OPTIONS: Array<{ value: string; label: string; description: string }> = [
  { value: "one-sheeter", label: "One Sheeter", description: "Single page, high density — quick pitches." },
  { value: "general", label: "General", description: "The safe default for most outreach." },
  { value: "booking", label: "Booking", description: "Leads with performance history and riders." },
  { value: "media", label: "Media", description: "Narrative-first, for press and playlist curators." },
  { value: "brand", label: "Brand", description: "For brand partnerships and sponsorships." },
];

export const ARTIST_TYPE_OPTIONS: Array<{ value: ArtistType; label: string }> = [
  { value: "vocalist", label: "Vocalist / Singer" },
  { value: "producer", label: "Producer" },
  { value: "engineer", label: "Engineer" },
  { value: "emcee", label: "Emcee / Rapper" },
  { value: "songwriter", label: "Songwriter" },
  { value: "instrumentalist", label: "Instrumentalist" },
  { value: "comedian", label: "Comedian" },
  { value: "other", label: "Other" },
];
