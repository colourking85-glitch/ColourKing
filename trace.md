# ColourKing — Implementation Trace

**Created:** 2026-08-24
**Status:** Pre-sprint 0 — Planning & Setup

---

## Legend

- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked
- [-] Skipped / deferred

---

## Phase 0: Prerequisites & Platform Setup

### 0.1 Identity & Accounts
- [ ] Google account (ColourKing85@gmail.com) secured — 2FA, recovery codes, password manager
- [ ] colourking.nl domain registered
- [ ] Cloudflare zone created, nameservers switched

### 0.2 Development Platforms
- [x] GitHub repo created (fresh/empty)
- [x] Vercel project created (fresh/empty)
- [x] Supabase project created (fresh/empty)
- [ ] Supabase: confirm region = EU (Frankfurt)
- [ ] Supabase: create second project (colourking-prod) — dev is enough for now
- [ ] Local toolchain: Node 20 LTS, pnpm, Docker Desktop, Supabase CLI confirmed

### 0.3 External Services (start early — lead times)
- [ ] Mollie business verification submitted (KvK + bank details)
- [ ] Resend account + domain verification + SPF/DKIM/DMARC
- [ ] Cloudflare Email Routing configured

### 0.4 Design & Architecture Decisions
- [x] Implementation plan v2.3 written
- [x] Technical spec v1.0 written
- [x] Admin console style: BOP dark-theme clone
- [x] Website design: Airo sample as inspiration (dark, Barlow, red #E8364E)
- [x] BOP VPS source analyzed — Shell, TopNavBar, FlyoutSidebar, auth, screen-registry patterns captured
- [x] Supabase region confirmed: eu-west-1 (Ireland) — EU-compliant, acceptable
- [ ] Confirm domain: colourking.nl + admin.colourking.nl (GoDaddy DNS → Cloudflare, in progress)
- [ ] Confirm numbering prefixes with accountant (OFF/OPD/AFL/FAC/CRE)
- [ ] Confirm 10 job stages with the shop
- [ ] Confirm bookable slot types and durations
- [ ] Confirm TR on admin console (yes/no)
- [ ] Confirm BTW scope: minimal (4d) or full (16d)
- [ ] Confirm legal form: BV or eenmanszaak
- [ ] Obtain terms & conditions text (algemene voorwaarden)

---

## Sprint 0: Foundation (5 days)

### 0.0 Repo & Toolchain
- [x] Initialize Next.js 14 + TypeScript + Tailwind + pnpm
- [x] Configure ESLint, tsconfig strict
- [x] Create CLAUDE.md with agent rules
- [x] Create docs/ structure (decisions/)
- [x] .env.example committed (keys, no values)
- [x] .gitignore: .env.local, .next, node_modules
- [x] CI workflow: .github/workflows/ci.yml (typecheck, lint, build)
- [ ] Branch protection on main (after GitHub remote added)
- [x] vitest configured + initial test (codes.test.ts — 4/4 pass)

### 0.1 Supabase Setup
- [ ] supabase init + config.toml
- [ ] Docker: supabase start runs locally
- [ ] Migration 0001: extensions (uuid-ossp, pgcrypto)
- [ ] Migration 0002: enums (job_status, offer_status, doc_status, etc.)
- [ ] Migration 0003: staff table + settings table
- [ ] Migration 0004: RLS on staff + settings
- [x] Placeholder types: src/types/database.ts
- [x] Supabase client setup: lib/supabase/{server,client,admin}.ts

### 0.2 Auth & Routing
- [x] lib/auth.ts: roles (admin/office/tech), can() function, PERMISSIONS map, mock session
- [x] Middleware: /app/* → admin (noindex), /login → pass, else → intl locale
- [x] X-Robots-Tag: noindex on admin routes
- [x] Login page at /login (email + password form, CK branding)
- [ ] Wire to real Supabase Auth (after migrations)

### 0.3 Admin Shell (BOP-style clone)
- [x] BOP console source analyzed on VPS (Shell, Sidebar, TopNavBar, FlyoutSidebar, auth, screen-registry)
- [x] Shell component: sidebar + header + content area
- [x] Sidebar: collapsible, 6 nav groups, 16 screen links with code badges, CK logo
- [x] Header: screen badge + title, Cmd-K search trigger, user menu
- [x] Cmd-K command palette: search by screen code or name
- [x] Screen code registry: lib/codes.ts with 20 screens registered
- [x] ScreenBadge component with per-module colors
- [x] Design tokens: ck-dark, ck-red, ck-dark-card, ck-dark-border, Barlow fonts
- [x] Dashboard page: 6 quick-stat cards + placeholder sections

### 0.4 i18n
- [x] next-intl setup with NL/EN/TR
- [x] Messages: common, nav, auth, dashboard namespaces in all 3 locales
- [x] Locale middleware for public routes (/nl, /en, /tr)

### Sprint 0 gate
- [x] pnpm typecheck — pass
- [x] pnpm lint — pass (0 warnings)
- [x] pnpm test — 4/4 pass
- [x] pnpm build — compiled successfully (4 routes)
- [x] Dev server runs, admin shell renders with full sidebar
- [x] Login page renders with CK branding
- [x] Public landing page renders at /nl
- [ ] GitHub remote connected + initial commit pushed
- [ ] Supabase migrations applied locally

---

## Sprint 1: Records (5 days)

- [ ] Migration: customers table + RLS
- [ ] Migration: vehicles table + RLS
- [ ] Migration: leads + lead_photos tables + RLS
- [ ] Module: src/modules/customers/ (schema, queries, actions, components)
- [ ] Module: src/modules/vehicles/ (schema, queries, actions, components)
- [ ] Module: src/modules/leads/ (schema, queries, actions, components)
- [ ] Screen: KL01 Create customer
- [ ] Screen: KL05 Customer list
- [ ] Screen: KL02/03 Change/display customer
- [ ] Screen: VH01 Create vehicle (kenteken RDW lookup + WOK flag)
- [ ] Screen: VH05 Vehicle list
- [ ] Screen: LD01 Create lead
- [ ] Screen: LD05 Leads inbox
- [ ] Screen: LD10 Lead detail
- [ ] RDW API integration: lib/rdw.ts
- [ ] Strings in nl/en/tr
- [ ] Tests: RDW lookup, customer CRUD

---

## Sprint 2: Job + Photos (6 days)

- [ ] Migration: jobs + job_events + job_photos tables + RLS
- [ ] Module: src/modules/jobs/ (schema, queries, actions, machine.ts, components)
- [ ] State machine: 10 stages with transition rules
- [ ] job_events: every transition writes a row
- [ ] Screen: JB01 Create job
- [ ] Screen: JB05 Job list / board
- [ ] Screen: JB10 Job detail (the main screen)
- [ ] Screen: JB15 Job board (drag between stages)
- [ ] Screen: JB20 Mobile capture (shop floor, tablet)
- [ ] Photo upload: compression before upload, IndexedDB queue
- [ ] Storage: jobs/{job_id}/{phase}/{uuid}.jpg, private bucket, signed URLs
- [ ] Strings in nl/en/tr
- [ ] Tests: state machine transitions, job_events writes

---

## Sprint 3: Document Engine (4 days)

- [ ] Migration: documents + number_ranges tables + RLS
- [ ] allocate_number() PL/pgSQL function (FOR UPDATE serialization)
- [ ] Module: src/modules/documents/ (schema, queries, actions, components)
- [ ] Document lifecycle: draft → issued → cancelled
- [ ] Payload freezing at issue time
- [ ] PDF renderer: lib/pdf/ (letterhead, terms per locale)
- [ ] Storage: documents/{year}/{type}/{number}.pdf, signed URLs
- [ ] Screen: DO03 Display document
- [ ] Screen: DO05 Document archive
- [ ] Screen: DO10 Issue (draft → issued)
- [ ] Screen: DO11 Cancel / credit
- [ ] Strings in nl/en/tr
- [ ] Tests: number allocation concurrency, payload freezing

---

## Sprint 4: Offers (6 days)

- [ ] Migration: offers + offer_lines tables + RLS
- [ ] Module: src/modules/offers/ (schema, queries, actions, machine.ts, components)
- [ ] Offer lifecycle: draft → sent → approved/rejected/superseded
- [ ] Versioning: supersedes_id, old link shows "replaced"
- [ ] Issue offer as document (uses document engine)
- [ ] Screen: ES01 Create offer (with/without lead)
- [ ] Screen: ES05 Offer list
- [ ] Screen: ES10 Send offer (email with approval link)
- [ ] Screen: ES11 Supplement (type='supplement', parent_offer_id)
- [ ] Public: /o/[token] — ES20 offer approval page
- [ ] Rate settings in SY05
- [ ] Approval → creates job automatically
- [ ] Strings in nl/en/tr
- [ ] Tests: offer versioning, approval flow, token verification

---

## Sprint 5: Parts + Board (4 days)

- [ ] Migration: parts table + RLS
- [ ] Module: src/modules/parts/ (schema, queries, actions, components)
- [ ] Blocking flag on parts (prevents stage change)
- [ ] Screen: PT01 Add part to job
- [ ] Screen: PT05 Parts list (per job, global)
- [ ] Job board: drag-between-stages enhancement
- [ ] Strings in nl/en/tr

---

## Sprint 6: Repair Order + Handover (3 days)

- [ ] Repair order document template (vehicle, mileage, existing damage, terms)
- [ ] Handover note document template (work summary, mileage out, warranty)
- [ ] Screen: DO20 Sign on tablet (canvas signature capture)
- [ ] Signature storage as PNG, re-render PDF with signature
- [ ] Gallery consent capture at handover
- [ ] Strings in nl/en/tr

---

## Sprint 7: Invoice + Payment (5 days)

- [ ] Migration: invoices + invoice_lines + payments tables + RLS
- [ ] Module: src/modules/invoices/ (schema, queries, actions, components)
- [ ] Invoice from approved offer + supplements
- [ ] Credit note (supersedes invoice)
- [ ] Tax codes on all lines (H21 default)
- [ ] Mollie integration: payment links, webhook, paid status
- [ ] Screen: FA01 Create invoice
- [ ] Screen: FA05 Invoice list
- [ ] Screen: FA10 Invoice detail
- [ ] Public: /s/[token] — status + pay page
- [ ] Screen: BW40 Quick calc (incl ↔ excl, VAT)
- [ ] Strings in nl/en/tr
- [ ] Tests: invoice numbering, payment webhook, VAT calculation

---

## Sprint 8: Appointments (5 days)

- [ ] Migration: resources + appointments + blackouts tables + RLS
- [ ] Module: src/modules/appointments/ (schema, queries, actions, components)
- [ ] Slot engine: opening hours - appointments - blackouts - capacity
- [ ] Auto-confirm inspection, request-confirm for drop-off/collection
- [ ] Screen: AP01 Create appointment
- [ ] Screen: AP05 Appointment calendar (day/week)
- [ ] Screen: AP10 Confirm pending requests
- [ ] Screen: SY06 Opening hours, resources, blackouts
- [ ] Public: /afspraak — AP20 booking page
- [ ] Strings in nl/en/tr

---

## Sprint 9: Tasks & Timesheet (4 days)

- [ ] Migration: job_tasks table + RLS
- [ ] Module: src/modules/tasks/ (schema, queries, actions, components)
- [ ] Auto-generate tasks from offer lines on approval
- [ ] Screen: TS01 Create task
- [ ] Screen: TS05 My tasks (technician mobile)
- [ ] Screen: TS10 Timesheet / planner (staff × time)
- [ ] Screen: TS20 Workload & availability
- [ ] Dashboard: RP01 (today overview)
- [ ] Strings in nl/en/tr

---

## TIER 1 GATE — The Working Chain
- [ ] Full flow works: lead → offer → approval → repair order → job → parts → tasks → handover → invoice → paid → delivered
- [ ] Shop can operate on it

---

## Sprint 10: Website (7 days)

- [ ] 7 public pages based on Airo design inspiration
- [ ] NL copy, SEO
- [ ] Gallery loop from delivered jobs (consent + plate blur)
- [ ] Quote form (/offerte-aanvragen)
- [ ] Strings in nl/en/tr

---

## Sprint 11: Communication (6 days)

- [ ] Resend templates per locale
- [ ] Outbound email from state transitions
- [ ] Inbound email routing (Cloudflare → edge function → job matching)
- [ ] /s/[token] status page enhancement
- [ ] Review request after delivery
- [ ] SPF/DKIM/DMARC verified

---

## Sprint 12: Languages (4 days)

- [ ] Full NL/EN/TR across all surfaces
- [ ] Locale-aware documents
- [ ] Customer locale drives all downstream communication

---

## Sprint 13: Reporting + Hardening (6 days)

- [ ] Cycle time reports
- [ ] Workload reports
- [ ] Conversion by origin
- [ ] DO30 yearly export for accountant
- [ ] Backups configured
- [ ] Error tracking (Sentry)
- [ ] Real-data QA in the shop

---

## TIER 2 GATE — Complete v1
- [ ] All 40 screens operational
- [ ] Three locales complete
- [ ] Email in and out working
- [ ] Public website live

---

## Sprint 14-17: BTW & Bookkeeping (14 days) — scope TBD

- [ ] Scope decision: minimal (4d) or full (16d)
- [ ] Purchase register (PU01/PU05)
- [ ] Declaration engine (BW05/BW10/BW11)
- [ ] Reports & corrections (BW20/BW25/BW30)
- [ ] BTW assistent AI (BW50)

---

## Blockers & Notes

| Date | Item | Status |
|------|------|--------|
| 2026-08-24 | BOP VPS source access for admin shell analysis | Done — SSH to 204.168.163.146, patterns captured |
| 2026-08-24 | Domain colourking.nl — GoDaddy DNS → Cloudflare | In progress (user doing DNS) |
| 2026-08-24 | Mollie — major settings done, create free subscription | In progress |
| 2026-08-24 | Shop decisions: stages, slots, TR, BTW scope, legal form | Deferred — decide during implementation |
| 2026-08-24 | Terms & conditions text from the shop | Deferred |
| 2026-08-24 | Supabase region: eu-west-1 (Ireland) confirmed | Done — EU-compliant |
