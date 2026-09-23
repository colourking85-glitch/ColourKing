# Project Portfolio (PF) — Implementation Plan

Status: **BUILT 2026-09-23** (migrations 0053 + 0054). Decisions approved: both
tables, names PF05/PF01/PF10, prefix **CK**, AI plate suggestion on, originals
not stored, consent override "not required" allowed, conversion **admin only**,
number allocated immediately on conversion.
Date: 2026-09-23

**Differences from the plan below:**
- Categories are `bodywork`, `paint`, `spot_repair` — matching the three existing public filter tabs (PDR is a work item, not a category).
- Plate detection uses Claude (`claude-opus-5`, structured JSON output, server-side refusal fallback) via raw `fetch`, the same way `src/lib/ai/providers.ts` calls AI — no new npm dependency.
- The gallery keeps the example cards until the first dossier is published, so it is never empty.
- Deleting is only possible before a dossier has a number; numbered dossiers are archived instead (number range stays gap-free).

## 1. Goal

Replace the six hardcoded "EXAMPLE" cards on `/[locale]/gallerij` with real,
completed repair projects that office staff manage from the admin panel
(SALES group). Every published project gets a professional dossier number
from a new SY03 number range, and **every public photo has the licence plate
irreversibly hidden** before it can leave the admin side.

## 2. Current state (findings)

| Area | Today | Gap |
|---|---|---|
| Public gallery | `gallerij/page.tsx` renders a hardcoded `placeholderProjects` array (6 items) from `pub.gallery.*` messages; dossier shown as `CK-{id}` | No data source, no admin, "View dossier" is a plain `<span>` (no detail page) |
| Before/after | `BeforeAfterSlider` exists but is always used without image `src` | Needs real image pairs |
| Number ranges (SY03) | `number_ranges(doc_type enum, year, prefix, next_number)` + `allocate_number()` → `PREFIX-YYYY-00001`, yearly reset | `doc_type` is an enum → new value needed; SY03 label map needs the new type |
| Vehicles | `vehicle_brands` / `vehicle_models` + `SearchableSelect` pickers (SY40 manages them) | Reusable as-is |
| Jobs | `job_stage` ends at `delivered`/`closed`; `payer_type` (casco/wa/particulier/lease), `job_type`, `job_photos.phase` (before/during/after), `documents.gallery_consent` on the handover note | Good source to **import** a project from a finished job |
| Storage | Public buckets, raw uploads, no image processing; no sharp/canvas deps | Redaction must happen before upload |
| AI | `src/lib/ai/providers.ts` (Anthropic Haiku / Gemini / OpenAI, raw fetch, keys from env) | Can add a "find licence plate" call |

## 3. Naming

| Concept | Name (NL / EN / TR) |
|---|---|
| Module / menu item | **Projectportfolio** / Project portfolio / Proje portföyü |
| One record | **Projectdossier** / Project dossier / Proje dosyası |
| Number range (SY03) | `project_dossier` — label "Projectdossier" |
| Public number format | **`CK-2026-00001`** (prefix `CK`, yearly reset, via existing `allocate_number`) |
| Screen codes (new module `PF`, free) | **PF05** list · **PF01** new · **PF10** detail/edit |

The dossier number is deliberately **separate from job/lead numbers**, so
internal volumes and customer links are never exposed publicly.
**[DECIDE]** prefix `CK` (keeps today's public look) vs `PRJ`.

## 4. Data model

> CLAUDE.md: new tables need approval — these two are not in docs/plan.md. **[DECIDE] approve.**

### Migration A — `0053_doc_type_project_dossier.sql`
`ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'project_dossier';`
(Postgres: a new enum value can't be used in the same transaction, so the seed is a separate migration.)

### Migration B — `0054_portfolio.sql`

**`portfolio_projects`**
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| dossier_number | text unique | allocated **immediately** when a manager converts a work order (§6a), otherwise **on first publish** (no gaps from abandoned blank drafts) |
| status | text check (`draft`,`published`,`archived`) | |
| category | text check (`bodywork`,`paint`,`spot_repair`,`pdr`,`damage_repair`) | drives public filter tabs |
| title_nl / title_en / title_tr | text | nl required; en/tr fall back to nl |
| summary_nl / _en / _tr | text | short story shown on the detail page |
| brand_id → vehicle_brands, model_id → vehicle_models | uuid | + `model_free_text` fallback |
| build_year | int | optional |
| colour_name, paint_code | text | optional ("Mineral White, 300") |
| work_items | text[] | e.g. `{straightening_bench, full_front_respray}` → translated labels |
| duration_working_days | int | auto-computed on import, editable |
| handling | text check (`insurance`,`private`,`lease`,`fleet`) | from `payer_type` |
| job_id → jobs | uuid null, **unique** | set when converted from a work order; unique = one dossier per work order (no duplicates) |
| source | text check (`work_order`,`manual`) | how the dossier was created |
| converted_by, converted_at | uuid, timestamptz | manager who approved sharing the work order |
| consent_status | text check (`received`,`not_required`,`pending`) | publish blocked when `pending` |
| consent_document_id → documents | uuid null | handover note with `gallery_consent = true` |
| featured, sort_order | bool, int | homepage/gallery ordering |
| published_at, created_by, updated_at, created_at, deleted_at | | soft delete, same as leads |

**`portfolio_photos`**
| Column | Type | Notes |
|---|---|---|
| id, project_id → portfolio_projects (cascade) | | |
| phase | `photo_phase` enum (before/during/after) | reuses existing enum |
| pair_group | int | links a before + after of the same angle for the slider |
| storage_path | text | **redacted** image in the public bucket |
| width, height | int | layout without CLS |
| is_cover, sort_order | bool, int | |
| redaction_confirmed_by, redaction_confirmed_at | uuid, timestamptz | who checked no plate is visible |
| redaction_regions | jsonb | boxes applied (audit only, not reversible) |
| alt_nl / alt_en / alt_tr | text | accessibility + SEO |

**RLS:** staff full access (`is_active_staff()`); `anon` SELECT only
`status = 'published' AND deleted_at IS NULL` (photos via parent join).
Public pages read through RLS with the anon key — **no service-role key under `app/(public)`** (CLAUDE.md rule 3).

**Number range seed:** `INSERT INTO number_ranges (doc_type, year, prefix) VALUES ('project_dossier', 2026, 'CK')`
— then it appears in SY03 automatically (add the label to SY03's `getDocTypeLabel` + `doc.*` messages).

**Storage:** bucket `portfolio-public` (public, redacted only).
**[DECIDE]** keep originals? Recommendation: **no** — originals already live in `job-photos`; storing unredacted copies again adds GDPR risk for no gain.

## 5. Licence plate hiding (key requirement)

Requirement: once uploaded, the plate must be unrecognisable. Rules:

1. **Redact before upload, in the browser.** The admin photo editor draws the
   image on a `<canvas>`, applies redaction, re-encodes to WebP/JPEG and only
   that result is uploaded. The unredacted file never reaches `portfolio-public`.
2. **Pixelate + blur, baked into pixels** (not a CSS filter, not a separate
   layer): downscale the region to ~8px blocks, upscale, then blur — irreversible
   and plate-unreadable, even at full resolution.
3. **Auto-suggest, human-confirm.** On upload an AI call
   (`providers.detectPlates(image)` — new method, same provider/key setup as
   damage-assess) returns plate boxes; they are pre-drawn on the canvas. Staff
   can move/resize/add/remove boxes (also for VIN stickers, faces, other cars).
   Vision-model boxes are approximate, so the suggestion gets padded by ~15%.
4. **Publish gate.** Every photo needs "No readable licence plate — checked by
   {name}" (`redaction_confirmed_*`) before the project can be published.
5. **Metadata stripped.** Canvas re-encoding drops EXIF (GPS location, camera
   serial, timestamp) automatically.
6. **Text fields too.** No kenteken, customer name or address is ever copied
   into public fields on job import; the kenteken is used only internally (RDW
   lookup to prefill brand/model/year).

No new npm dependency is needed (canvas is built into the browser).
**[DECIDE]** AI suggestion on (≈ €0.001 per photo with Haiku, needs
`ANTHROPIC_API_KEY` in Vercel) or manual boxes only.

## 6. Admin screens (SALES group)

**PF05 — Project portfolio list**
- Table: cover thumb, dossier no., title, brand/model, category, status, published date
- Filters: status, category; search; drag to reorder (sort_order); "featured" toggle
- Actions: New, Import from job, Archive, soft delete (same pattern as LD05)

**PF01 — New project dossier**
- **From a work order**: pick a completed work order → same conversion as §6a
- **Blank**: all fields manual (number allocated on first publish)

### 6a. Convert a completed work order → dossier (from JB10)

The preferred way to create a dossier: the manager decides on the finished
work order itself that it may be shared, and the dossier number is generated
right away.

**Where:** JB10 *Opdrachtdetail* (`/app/jobs/[id]`) — new action button
**"Omzetten naar projectdossier"** / "Convert to project dossier".

**When the button is shown / enabled**
| Condition | Rule |
|---|---|
| Work order stage | `delivered` or `closed` (completed) |
| Role | **manager decision** → `admin` only by default; permission `portfolio.convert` so it can be granted to office later |
| Not yet converted | no `portfolio_projects.job_id` for this job; otherwise the button becomes a link **"Dossier CK-2026-00001 →"** to PF10 |
| Consent | shows the handover note's `gallery_consent`; if not given, the dialog warns and the manager must tick "consent obtained otherwise" or "not required" (see decision 6) |

**Flow**
1. Manager clicks the button → confirmation dialog with a preview of the
   values that will be copied and the photos found (before/after counts).
2. On confirm, one server action (single transaction):
   - `allocate_number('project_dossier')` → **`CK-2026-00001` generated directly**
   - inserts `portfolio_projects` (status `draft`, `source = 'work_order'`,
     `job_id`, `converted_by/at`) with the copied values below
   - links the job's photos as **pending import** (not public yet)
3. Redirects to PF10 with the dossier number visible; the dossier stays
   `draft` until the photos are redacted and the publish checklist is green.
4. JB10 shows the dossier badge from then on; the job gets a `job_events`
   entry "Converted to project dossier CK-2026-00001 by {manager}".

**Values copied from the work order**
| Dossier field | Source (work order) |
|---|---|
| brand_id / model_id / build_year / colour | `jobs.vehicle_id` → `vehicles` (make, model, year, colour; matched to `vehicle_brands`/`vehicle_models`) |
| paint_code | vehicle / offer paint code if present |
| category | `jobs.job_type` (bodywork → `bodywork`, paint → `paint`, …) |
| work_items | accepted offer lines of the job (labour/parts descriptions → suggested work items, editable) |
| handling | `jobs.payer_type`: casco / wa → `insurance`, particulier → `private`, lease → `lease` |
| duration_working_days | `checked_in` → `delivered`/`closed_at`, weekends + blackout days excluded |
| title_nl (suggestion) | "{Category} {brand} {model}" e.g. "Schadeherstel BMW 3 Serie" — editable; optional AI draft in 3 languages (§8 #8) |
| consent_status / consent_document_id | handover note (`documents`, type `handover_note`) `gallery_consent` |
| photos | `job_photos` with phase before/during/after → queued for the redaction editor; **never published unredacted** |

**Never copied:** customer name/contact, kenteken, VIN, addresses, prices,
internal notes, job number. (Kenteken is only used internally to resolve
brand/model.)

**Why allocate the number immediately here (vs. on publish for blank drafts):**
a manager conversion is a deliberate decision to share, so the number is
wanted straight away (for internal reference/communication). If the dossier is
later abandoned it is **archived, not deleted**, and keeps its number — the
number range stays gap-free and auditable.

**Undo:** before publishing, a manager can "Cancel conversion" → dossier
archived (number retained, job badge removed, job can be converted again only
by un-archiving the same dossier — keeps one-dossier-per-work-order).

**PF10 — Dossier detail / edit**
- Tabs: *Details* (fields, 3-language titles), *Photos* (upload, redaction
  editor, before/after pairing, cover, alt text), *Preview* (renders the public card
  + detail page), *Publish*
- **Publish checklist** (button disabled until all green):
  nl title · category · brand/model · ≥ 1 before + 1 after pair ·
  every photo redaction-confirmed · consent received/not required
- Publish allocates `CK-YYYY-NNNNN` only if the dossier has no number yet
  (blank drafts); work-order conversions already have one. Re-publish keeps it.
- Header shows the source work order ("From work order #123 →", staff only)

Registration per project rules: `lib/codes.ts` (module `PF`, colour), Sidebar
`groupSales` item with `portfolio.*` permission (admin + office), `screen-docs.ts`
entries for PF05/PF01/PF10, handleiding, all strings in nl/en/tr.

## 7. Public site

- `gallerij/page.tsx` → server component reading published projects
  (anon client + RLS); tabs from `category`; "EXAMPLE" badge removed; empty state
  falls back to the current placeholders so the page is never blank at go-live
- Card: cover (after photo), `Dossier CK-2026-00001`, title, Vehicle
  (brand model year), Work (translated work items), Duration, Handling
- **New detail page** `/[locale]/gallerij/[dossier]`: before/after slider per
  pair, photo grid, summary, specs, CTA "Offerte aanvragen" / "Afspraak maken"
- SEO: per-dossier `<title>`/description, OpenGraph image (cover), JSON-LD, sitemap entries
- `next/image` with the Supabase public host in `remotePatterns`, fixed width/height from DB

## 8. Further improvements (analysis)

| # | Improvement | Why |
|---|---|---|
| 1 | Consent gate linked to handover `gallery_consent` | AVG/GDPR: customer's car photos published only with permission |
| 2 | EXIF/GPS stripping | Photos can reveal the customer's home location |
| 3 | Redact VIN stickers, faces, other cars' plates (same editor) | Same privacy risk as the plate |
| 4 | Dossier number ≠ job number | Doesn't leak internal volumes; stable public URL |
| 5 | Working-days calculation excludes weekends (and blackout days) | "0 working days" on the current cards looks wrong |
| 6 | Paint code / colour name field | Strong trust signal for paint work |
| 7 | Featured projects on homepage | Reuse the same data |
| 8 | Optional AI draft of title/summary in 3 languages from job data | Saves office time; staff edits before publish |
| 9 | Image sizes: max 2000 px long edge, WebP ~80% | Fast gallery, small storage |
| 10 | Audit: `created_by`, redaction confirmer, `published_at` | Accountability for what goes public |
| 11 | Archive instead of delete; soft delete like leads | Old links keep resolving or 301 to gallery |

## 9. Build order & estimate

| Phase | Scope | Est. |
|---|---|---|
| 1 | Migrations A+B, types regen, bucket, RLS, SY03 label, registry/sidebar/docs | 0.5 day |
| 2 | Module `src/modules/portfolio/` (schema, queries, actions, allocate on publish) + API routes + tests | 1 day |
| 3 | PF05 list + PF01 blank/new + PF10 details tab | 1 day |
| 4 | Photo editor: canvas redaction (pixelate+blur), box editing, confirm, upload; AI `detectPlates` | 1.5 days |
| 5 | Work order → dossier conversion: JB10 button + dialog, transactional convert action (number allocated immediately), value mapping, photo queue, job event, undo | 1 day |
| 6 | Public gallery from DB + detail page + SEO | 1 day |
| 7 | Tests (redaction baked in, publish gate, RLS anon only sees published), e2e check, docs | 0.5 day |
|  | **Total** | **≈ 6.5 days** |

Deploy order: run migration A → migration B in SQL Editor, then deploy code
(same as 0051/0052).

## 10. Decisions needed before building

1. **Approve the two new tables** `portfolio_projects`, `portfolio_photos` (CLAUDE.md "ask before").
2. **Names:** "Projectportfolio" (module) / "Projectdossier" (record), codes PF05/PF01/PF10 — OK?
3. **Number format:** `CK-2026-00001` (prefix CK) or `PRJ-2026-00001`?
4. **AI plate suggestion:** on (needs `ANTHROPIC_API_KEY`) or manual boxes only?
5. **Originals:** don't store (recommended) or keep in a private bucket?
6. **Consent:** hard block publishing without consent, or allow with a "consent not required" override (e.g. own/demo cars)?
7. **Who may convert a work order:** admin (manager) only, or also office?
8. **Number timing for conversions:** generate immediately on conversion (as requested, planned) — confirm that abandoned conversions are archived and keep their number.
