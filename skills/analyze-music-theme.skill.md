# Skill — Analyze Music Theme

**Purpose:** Generate a grounded description of the artist's musical theme, style, and sonic identity from
extracted metadata and any available audio-adjacent signals (titles, genre tags, descriptions, lyrics
snippets if provided).

**Trigger:** `discography-raw.json` exists with at least one resolved entry, or the artist supplied a
theme/style description in `master.md`.

**Inputs:** `discography-raw.json`, `master.md` → `## Genre & Style` and `## Influences` sections.

**Procedure:**
1. Aggregate genre tags, platform-assigned moods/categories, and release titles across the discography.
2. Cross-reference against the artist's self-described genre (main + additional), influences, and
   theme/style answer from intake — treat the artist's own words as primary signal, platform tags as
   supporting signal.
3. Produce a structured theme profile: primary genre, secondary/fusion genres, recurring lyrical or sonic
   motifs (only if directly evidenced by titles/descriptions/lyrics provided — never invent thematic content
   not present in source material), tempo/mood tendencies if exposed by platform metadata, and a one-paragraph
   style narrative.
4. Explicitly cite which fields (self-described vs. platform-derived) informed each claim in the profile.

**Output:** `music-theme-analysis.md` with a front-matter block (`input_artifacts:
[discography-raw.json, master.md]`, `confidence`) and the structured profile + narrative paragraph.

**Guardrails:** Do not analyze actual audio waveforms/acoustic features unless an audio-analysis tool is
explicitly connected — work from metadata, tags, and the artist's own descriptions. Flag the narrative as
`confidence: low` if it relies mostly on inference from titles rather than explicit tags or artist input.
