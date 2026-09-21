/**
 * Client-only session handoff between /build -> /build/[runId] -> /epk/[runId].
 *
 * There's no database in this v1 slice (intentional — see docs/front-end-plan.md),
 * and the backend's RunStore only lives for the duration of one API request. So
 * the intake form and the final rendered EPK are passed between pages via
 * sessionStorage instead: same-browser, same-session only, which is exactly the
 * lifetime this flow needs (fill form -> watch it build -> see the result).
 */
import type { EPKIntake, DesignTokens } from "@/types";

const INTAKE_PREFIX = "artistepks:intake:";
const RESULT_PREFIX = "artistepks:result:";

export function saveIntake(sessionId: string, intake: EPKIntake): void {
  try {
    sessionStorage.setItem(INTAKE_PREFIX + sessionId, JSON.stringify(intake));
  } catch {
    // sessionStorage can throw in private-browsing/blocked-storage contexts —
    // the build page will just show "session not found" rather than crash.
  }
}

export function loadIntake(sessionId: string): EPKIntake | null {
  try {
    const raw = sessionStorage.getItem(INTAKE_PREFIX + sessionId);
    return raw ? (JSON.parse(raw) as EPKIntake) : null;
  } catch {
    return null;
  }
}

export interface EpkResult {
  runId: string;
  artistName: string;
  html: string;
  outputUrls: Record<string, string>;
  tokens?: DesignTokens;
  completedAt: string;
}

export function saveResult(result: EpkResult): void {
  try {
    sessionStorage.setItem(RESULT_PREFIX + result.runId, JSON.stringify(result));
  } catch {
    // Same as above — best effort.
  }
}

export function loadResult(runId: string): EpkResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_PREFIX + runId);
    return raw ? (JSON.parse(raw) as EpkResult) : null;
  } catch {
    return null;
  }
}
