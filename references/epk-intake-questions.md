# EPK Intake Questions — Field Map

Canonical field list used by `skills/format-inputs.skill.md`. Each field maps to a `master.md` section.
`Required` fields missing at intake trigger a `[MISSING: ...]` marker, not a fabricated value.

## Identity
| Field | Required | Notes |
|---|---|---|
| Artist Name | Yes | Legal/stage name as it should appear on the EPK |
| Date of Birth | No | Sensitive — only include in output if artist explicitly opts to publish it |
| Birth City | No | |
| Current City | Yes | Used for booking/tour relevance |
| Hometown (if different from birth city) | No | |

## Genre & Style
| Field | Required | Notes |
|---|---|---|
| Genre — Main | Yes | |
| Genre — Additional | No | Multiple allowed |
| Artist Type | Yes | Multi-select: Vocalist/Singer, Producer, Engineer, Emcee/Rapper, Songwriter, Instrumentalist, Comedian, etc. |
| Year Started | Yes | Used for "years active" stat |
| P.R.O. (Performance Rights Org.) | No | ASCAP/BMI/SESAC/etc. if registered |
| Musical Influences/Inspirations | No | Free text |
| Music Theme/Style | No | Artist's own description — primary signal for theme analysis |
| Artist Identity/Brand | No | Free text — feeds brand analysis section |

## Career & Collaboration
| Field | Required | Notes |
|---|---|---|
| Past Collaborations | No | Named artists/producers |
| Performances | No | Notable shows, festivals, tours |

## Press & Platform Links
| Field | Required | Notes |
|---|---|---|
| Press Links | No | Articles, features, interviews |
| Instagram Link | No | |
| YouTube Link | No | |
| SoundCloud Link | No | |
| Spotify Link | No | |
| Apple Music Link | No | |
| Pandora Link | No | |
| TikTok Link | No | |
| Facebook Link | No | |
| Suno Link | No | |
| Additional Links | No | Catch-all for anything else |

## Bio
| Field | Required | Notes |
|---|---|---|
| Artist Bio (if they want to add) | No | Treated as strong style/voice reference for `generate-bio` |

## Representation & Contact
| Field | Required | Notes |
|---|---|---|
| Manager Name | No | |
| Manager Contact | No | PII — publish only if explicitly approved |
| Label Name | No | |
| Label Contact | No | PII — publish only if explicitly approved |
| Email Address | Yes | Primary booking contact if no manager listed |
| Phone Number | No | PII — publish only if explicitly approved |
| Website | No | |

## Riders & Technical
| Field | Required | Notes |
|---|---|---|
| Technical Rider | No | Required for Booking template |
| Performance Rider | No | Required for Booking template |

## Media
| Field | Required | Notes |
|---|---|---|
| Media Files/Uploads | No | Press photos, logos, brand assets, one-sheets |

At least one platform link (music or social) is required for the pipeline to produce a discography or
social/engagement section — if none are supplied, those sections render as explicitly omitted rather than
blocking the whole EPK.
