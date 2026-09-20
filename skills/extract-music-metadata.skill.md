# Skill — Extract Music Metadata

**Purpose:** Extract structured metadata from every submitted music link to seed the discography.

**Trigger:** `master.md` exists and contains at least one platform link (Spotify, Apple Music, SoundCloud,
YouTube, Pandora, Suno).

**Inputs:** Platform links from `master.md` → `## Platform Links` section.

**Procedure:**
1. For each link, resolve platform via URL pattern, then call the matching Composio toolkit (Spotify,
   Apple Music, SoundCloud, YouTube Data API, Pandora) or the `extract_metadata` tool if no toolkit is
   connected for that platform.
2. Extract per track/release: title, release date, duration, ISRC/UPC if available, featured artists, album
   or EP name, cover art URL, platform-specific play/stream count if publicly exposed.
3. Deduplicate the same release appearing across multiple platforms into one logical entry with per-platform
   links attached.
4. Record extraction method and timestamp per entry (`source_platform`, `retrieved_at`, `extraction_method:
   api | scrape`).
5. If a link fails to resolve or the platform has no public API access, mark that entry
   `status: unresolved` and continue — do not block the rest of the batch.

**Output:** `discography-raw.json` — array of release objects with full metadata and provenance, one entry
per unique release, `confidence` per entry (1.0 for API-sourced, 0.6 for scraped, 0.0 for unresolved).

**Guardrails:** Never estimate a stream/play count that isn't directly exposed by the platform. Never merge
two distinct releases into one entry without matching on title + release date + duration.
