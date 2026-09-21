/**
 * RunStore — per-pipeline-run artifact + data store.
 *
 * Fixes the gap where each pipeline step (format-inputs, extract-*, compile-data,
 * generate-bio, render-epk) computed real data but returned it only to the LLM's
 * tool-call transcript — nothing was ever passed to the NEXT step. compile-data
 * rendered a template with "_Populated by pipeline run_" placeholders, and the
 * final HTML/PDF/deck renderers shipped hardcoded bracketed placeholder text
 * instead of the artist's actual bio/discography/social data.
 *
 * One RunStore instance is created per streamEPKAgent() invocation and closed
 * over by that run's tool `execute` functions, so every step can read what an
 * earlier step in the SAME run produced. It holds two things per key:
 *   - `artifacts`: the human-readable ROSTRArtifact (markdown + frontmatter),
 *     used for the audit trail / ContextEngine session record.
 *   - `data`: the original structured return value (TrackMetadata[], DesignTokens,
 *     etc.), used by downstream code so it never has to re-parse markdown.
 *
 * Cross-run history still lives in ContextEngine (pal.ts) — this store only
 * needs to live for the duration of one pipeline run.
 */
import type { ROSTRArtifact } from "../types";

export class RunStore {
  private artifacts = new Map<string, ROSTRArtifact>();
  private data = new Map<string, unknown>();

  setArtifact(key: string, artifact: ROSTRArtifact): void {
    this.artifacts.set(key, artifact);
  }

  getArtifact(key: string): ROSTRArtifact | undefined {
    return this.artifacts.get(key);
  }

  /** Raw markdown content of a stored artifact, or "" if not yet produced. */
  content(key: string): string {
    return this.artifacts.get(key)?.content ?? "";
  }

  allArtifacts(): Record<string, ROSTRArtifact> {
    return Object.fromEntries(this.artifacts);
  }

  setData<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  getData<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }
}

/** Strips a leading YAML frontmatter block and the first H1 heading from an artifact's markdown. */
export function bodyOf(markdown: string): string {
  let body = markdown.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  body = body.replace(/^#\s+.*\n/, "").trim();
  return body;
}
