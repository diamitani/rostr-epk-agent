# EPK Template Library

Used by `skills/generate-design-system.skill.md` and `skills/generate-epk.skill.md` to resolve required
sections and layout per template family. Default template: **General**.

## 1. EPK One Sheeter Template
**Use case:** Single-page, high-density summary for quick pitches (playlist submissions, blog features,
fast bookings).
**Required sections (in order):** Hero (name, tagline, photo) → Short bio → Genre/type tags → Top 3
discography highlights → Key stat strip (followers, engagement score, years active) → Contact.
**Layout:** Single page, no scroll sections, dense grid, one hero image, no gallery.

## 2. EPK General Template
**Use case:** Default, all-purpose press kit for general outreach, submissions, and website "press" pages.
**Required sections (in order):** Hero → Long bio → Genre/theme & style analysis → Discography (full
table) → Social & engagement score → Press ("as seen in") → Collaborations & performances → Contact &
representation → Media gallery.
**Layout:** Multi-section scroll page (HTML) or multi-page document (PDF).

## 3. EPK Booking Template
**Use case:** For talent buyers, venues, festivals — must emphasize live performance credibility and
logistics.
**Required sections (in order):** Hero → Short bio → Performances (notable shows/festivals/tours) →
Discography highlights → Social & engagement score → Technical rider → Performance rider → Contact &
representation.
**Layout:** Booker-first ordering — performance history and riders surface above general bio depth.

## 4. EPK Media Template
**Use case:** For press, journalists, blogs, playlist curators — emphasizes narrative and coverage.
**Required sections (in order):** Hero → Long bio → Genre/theme & style analysis → Press ("as seen in",
full summaries) → Discography → Collaborations → Media gallery (high-res photos) → Contact.
**Layout:** Editorial, photo-forward, generous whitespace.

## 5. EPK Brand Template
**Use case:** For brand partnerships, sponsorships, and endorsement pitches — emphasizes identity, social
proof, and audience data.
**Required sections (in order):** Hero → Artist identity/brand statement → Brand analysis (from social
metadata) → Social & engagement score (expanded, per-platform breakdown) → Discography highlights → Past
collaborations → Contact & representation.
**Layout:** Data/visual-forward, brand-asset colors take priority over template defaults.

## Section omission rule
If a required section's source data is entirely absent (e.g., no riders submitted for a Booking template),
render the section header with an explicit "Not provided" state rather than removing it silently — this
keeps the template structure recognizable and signals to the booker that a follow-up ask may be needed.
