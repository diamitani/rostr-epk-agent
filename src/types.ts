/**
 * ROSTR EPK Agent — Types
 * Canonical type definitions for the EPK pipeline.
 */

// ─── ROSTR Runtime Protocol ──────────────────────────────────────────────────

export interface ROSTRPluginManifest {
  name: string;
  version: string;
  agent_id: string;
  npao_phase: "P" | "A" | "L" | "O";
  vertical: string;
  category: string;
  price_usd: number;
  subagent: string;
  api: {
    invoke: string;
    stream: string;
    status: string;
    mcp: string;
  };
  skills: string[];
  outputs: string[];
}

export interface ROSTRArtifact {
  artifact_type: string;
  version: string;
  status: "draft" | "review" | "approved" | "superseded";
  owner_skill: string;
  input_artifacts: string[];
  confidence: number; // 0.0–1.0
  created_at: string;
  content: string;
}

export interface ROSTRSkillResult {
  skill: string;
  status: "pending" | "running" | "complete" | "error";
  artifact?: ROSTRArtifact;
  error?: string;
  duration_ms?: number;
}

// ─── EPK Pipeline ────────────────────────────────────────────────────────────

export interface EPKIntake {
  // Artist identity
  artist_name: string;
  legal_name?: string;
  genre: string;
  subgenre?: string;
  city: string;
  state?: string;
  country?: string;
  pronouns?: string;

  // Bio seeds
  bio_notes?: string;
  career_highlights?: string;
  influences?: string;
  goals?: string;

  // Links
  spotify_url?: string;
  apple_music_url?: string;
  soundcloud_url?: string;
  youtube_url?: string;
  pandora_url?: string;
  suno_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  website_url?: string;
  google_drive_folder?: string;

  // Press
  press_links?: string[];
  misc_links?: string[];

  // Contacts
  manager_name?: string;
  manager_email?: string;
  label_name?: string;
  booking_email?: string;

  // EPK config
  template?: "one-sheeter" | "general" | "booking" | "media" | "brand";
  presentation_output?: PresentationOutputType[];
  deploy_to_vercel?: boolean;
  custom_domain?: string;
}

export type PresentationOutputType =
  | "html"
  | "pdf"
  | "reveal-js"
  | "pptx"
  | "presenton";

export interface EPKPipelineState {
  run_id: string;
  artist_slug: string;
  intake: EPKIntake;
  status: "pending" | "running" | "complete" | "error";
  current_skill: string | null;
  completed_skills: string[];
  artifacts: Record<string, ROSTRArtifact>;
  started_at: string;
  completed_at?: string;
  vercel_url?: string;
  error?: string;
}

export interface EPKPipelineEvent {
  type:
    | "skill_start"
    | "skill_complete"
    | "skill_error"
    | "pipeline_complete"
    | "approval_required"
    | "progress";
  skill?: string;
  artifact_key?: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ─── Presentation Layer ──────────────────────────────────────────────────────

export interface SlideContent {
  title: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  bullets?: string[];
  stat_label?: string;
  stat_value?: string;
  type:
    | "cover"
    | "bio"
    | "discography"
    | "social"
    | "press"
    | "contact"
    | "cta";
}

export interface PresentationSpec {
  title: string;
  artist_name: string;
  theme: DesignTokens;
  slides: SlideContent[];
}

export interface DesignTokens {
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  logo_url?: string;
}

// ─── Vercel Deploy ───────────────────────────────────────────────────────────

export interface VercelDeployRequest {
  html_content: string;
  project_name: string;
  artist_slug: string;
  custom_domain?: string;
}

export interface VercelDeployResult {
  url: string;
  deployment_id: string;
  status: "ready" | "building" | "error";
  setup_instructions?: VercelSetupInstructions;
}

export interface VercelSetupInstructions {
  step_1: string;
  step_2: string;
  step_3: string;
  signup_url: string;
  cli_commands: string[];
  env_vars: string[];
}
