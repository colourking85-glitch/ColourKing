# ColourKing — Implementation Trace

**Created:** 2026-08-24
**Status:** Sprints 3+4+5+8 complete — Documents, Offers, Parts, Appointments (148 tests)

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
- [x] Domains: colourking.nl, admin.colourking.nl, monitor.colourking.nl configured (Vercel + Cloudflare)
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
- [-] supabase init + config.toml (skipped — using hosted Supabase directly)
- [-] Docker: supabase start runs locally (deferred — install Docker Desktop later)
- [x] Migration 0001: extensions (uuid-ossp, pgcrypto) — applied via SQL Editor
- [x] Migration 0002: enums (22 types) — applied via SQL Editor
- [x] Migration 0003: staff + settings tables + seed data — applied via SQL Editor
- [x] Migration 0004: RLS on staff + settings — applied via SQL Editor
- [x] Types: src/types/database.ts regenerated with Staff, Settings, all enums
- [x] Supabase client setup: lib/supabase/{server,client,admin}.ts
- [x] API route: /api/auth/me (staff lookup by session)

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
- [x] Design tokens: ck-bg, ck-surface, ck-border, ck-text hierarchy + semantic colors (green/red/amber/blue/purple)
- [x] Dashboard page: KPI dashboard with shift overview + per vehicle tabs (demo data)

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
- [x] GitHub remote connected + initial commit pushed (ed522e0 → colourking85-glitch/ColourKing)
- [x] Supabase migrations applied (0001-0004 via hosted SQL Editor)

---

## Sprint 1: Records (5 days)

- [x] Migration 0005: customers table + RLS — applied via SQL Editor
- [x] Migration 0006: vehicles table + RLS — applied via SQL Editor
- [x] Migration 0007: leads + lead_photos tables + RLS — applied via SQL Editor
- [x] Module: src/modules/customers/ (schema, queries, actions)
- [x] Module: src/modules/vehicles/ (schema, queries, actions)
- [x] Module: src/modules/leads/ (schema, queries, actions)
- [x] API routes: /api/customers, /api/customers/[id], /api/vehicles, /api/vehicles/[id], /api/leads, /api/leads/[id], /api/rdw
- [x] Screen: KL01 Create customer (/app/klanten/nieuw)
- [x] Screen: KL05 Customer list (/app/klanten)
- [x] Screen: KL02 Customer detail (/app/klanten/[id])
- [x] Screen: VH01 Create vehicle with RDW lookup (/app/voertuigen/nieuw)
- [x] Screen: VH05 Vehicle list (/app/voertuigen)
- [x] Screen: LD01 Create lead (/app/leads/nieuw)
- [x] Screen: LD05 Leads inbox with status filters (/app/leads)
- [x] Screen: LD10 Lead detail with status transitions (/app/leads/[id])
- [x] RDW API integration: lib/rdw.ts + /api/rdw endpoint
- [x] Strings in nl/en/tr (kl, vh, ld namespaces)
- [x] Tests: RDW mapping (3), schema validation (10), screen registry (4) — 17/17 pass
- [x] Screen registry updated: KL01, KL02, KL05, VH01, VH05, LD01, LD05, LD10
- [ ] Database types regenerated after migrations applied

---

## Sprint 2: Job + Photos (6 days)

- [x] Migration 0008: jobs + job_events + job_photos tables + RLS — applied via SQL Editor
- [x] Supabase Storage bucket: job-photos (public, 10MB, JPG/PNG/WebP/HEIC)
- [x] Module: src/modules/jobs/ (schema.ts, queries.ts, actions.ts, machine.ts)
- [x] State machine: 10 stages (intake→quoted→approved→scheduled→checked_in→in_progress→qc→ready→delivered→closed)
- [x] job_events: every transition + notes write audit trail rows
- [x] API routes: /api/jobs, /api/jobs/[id], /api/jobs/[id]/events, /api/jobs/[id]/photos
- [x] Screen: JB01 Create job (/app/jobs/nieuw)
- [x] Screen: JB05 Job list with search + stage filter (/app/jobs)
- [x] Screen: JB10 Job detail — progress bar, stage transitions, timeline, photos, notes (/app/jobs/[id])
- [x] Screen: JB15 Job board — kanban columns per stage (/app/jobs/board)
- [ ] Screen: JB20 Mobile capture (shop floor, tablet) — deferred
- [x] Photo upload: before/during/after phases, multi-file, lightbox viewer, delete
- [ ] Photo compression before upload, IndexedDB queue — deferred
- [x] Screen registry updated: JB01, JB10 added
- [x] Strings in nl/en/tr (jb namespace)
- [x] Tests: state machine transitions (7 tests) — 24/24 total pass
- [x] Committed: d1c19a2 (19 files, 1603 lines)
- [x] Pushed to GitHub: colourking85-glitch/ColourKing
- [x] Roadmap doc created: docs/roadmap.md (Sprints 0–8)

---

## Sprint 2.5: Subdomain Routing + Monitor + Coming Soon + KPI Dashboard

### Domain & Routing
- [x] Middleware-based subdomain routing (monitor.colourking.nl → /monitor, admin.colourking.nl → /app)
- [x] Moved from vercel.json rewrites to Next.js middleware (middleware runs before vercel.json)
- [x] Cloudflare DNS: CNAME records for admin, monitor, www subdomains (proxy OFF for Vercel SSL)
- [x] Vercel domains: admin.colourking.nl (valid), monitor.colourking.nl (configured)
- [x] X-Robots-Tag: noindex on admin and monitor routes

### Monitor Dashboard (monitor.colourking.nl)
- [x] Standalone monitor dashboard at /monitor with dedicated login
- [x] Two-column layout: left panel (jobs + performance), right panel (notification feed)
- [x] Auto-refresh: configurable 1–5 min interval with last-updated timestamp
- [x] Manual refresh button
- [x] Live clock + date display
- [x] 10-second alert: Web Audio API multi-tone sound, blinking bell, red glow header
- [x] Flying ticker banner scrolling unread notifications
- [x] Ongoing jobs with kenteken, stage badge, duration tracker (green <24h, amber 24–48h, red >48h)
- [x] Upcoming scheduled vehicles panel
- [x] Performance indicators: avg duration KPI, delayed count, stage distribution bar chart
- [x] Notification type distribution bar chart
- [x] Inter + JetBrains Mono fonts via next/font
- [x] API endpoint: /api/monitor (ongoing + scheduled jobs)
- [x] Notification feed with type filters, mark read, mark all read

### Coming Soon Page (colourking.nl)
- [x] Dark-themed landing page at /[locale]
- [x] Business details: Autospuitbedrijf Colour King, Satijnbloem 6, 3068 JP Rotterdam
- [x] Contact: 06 - 81 63 10 20, info@colourking.nl
- [x] CK logo mark with brand red

### KPI Dashboard (RP01)
- [x] Google Doc KPI spec imported (bodyshop-kpi-dashboard-spec)
- [x] Admin UI redesign spec imported (color system, typography, layout)
- [x] Alert strip: conditional red-tinted banner for urgent issues (overdue jobs, blocked parts)
- [x] Tab navigation: Dienstoverzicht / Per voertuig
- [x] Shift overview: 6 KPI cards (delivered, utilization, efficiency, touch ratio, revenue, WIP)
- [x] Phase flow bars with bottleneck detection (≥90% = red alert)
- [x] Hourly production bar chart (hours produced per shift hour)
- [x] Technician output table (name, role, clocked, produced, efficiency bar)
- [x] Exceptions log with severity-coded dots
- [x] Per vehicle: WIP table with clickable rows
- [x] Vehicle detail: 4 mini-KPIs (cycle time, touch ratio, estimate accuracy, gross margin)
- [x] Cycle timeline visualization (active work vs waiting segments)
- [x] Estimate vs actual cost breakdown table
- [x] Refined color system: ck-surface/border/text hierarchy with 0.5px borders
- [x] Font weight restraint: 400/500 only (no bold/600/700)
- [x] Demo data with "Demo" badge — awaits time-tracking tables for live data

---

## Sprint 3: Document Engine (4 days)

- [x] Migration 0010: documents + number_ranges tables + RLS — ready to run in SQL Editor
- [x] allocate_number() PL/pgSQL function (FOR UPDATE row-level locking, auto-creates year entries)
- [x] Module: src/modules/documents/ (schema.ts, queries.ts, actions.ts)
- [x] Document lifecycle: draft → issued → cancelled (enforced in actions)
- [x] Payload freezing at issue time with SHA-256 hash
- [x] Invoice cancel blocked — must use credit note instead
- [x] API routes: /api/documents (GET list + POST create), /api/documents/[id] (GET detail + PATCH issue/cancel + DELETE draft)
- [x] Screen: DO05 Document archive (/app/documenten) — search, type/status filters, table view
- [x] Screen: DO03 Document detail (/app/documenten/[id]) — info card, integrity hash, payload preview, document chain, links, issue/cancel/delete actions
- [x] Screen registry: DO05, DO03 registered in lib/codes.ts
- [x] Strings in nl/en/tr (doc namespace — 30+ keys)
- [x] Tests: 10 document schema tests (DocumentSchema, IssueDocumentSchema, CancelDocumentSchema) — 34/34 total pass
- [ ] PDF renderer: lib/pdf/ (letterhead, terms per locale) — deferred to Sprint 6
- [ ] Storage: documents/{year}/{type}/{number}.pdf, signed URLs — deferred to Sprint 6

---

## Sprint 4: Offers (6 days) — built in parallel

- [x] Migration 0011: offers + offer_lines tables + RLS + indexes + updated_at trigger
- [x] Module: src/modules/offers/ (schema.ts, queries.ts, actions.ts, machine.ts)
- [x] Offer lifecycle: draft → sent → approved/rejected/superseded (state machine with guards)
- [x] Line items: labour/part/material/other kinds, VAT calc, auto-recalculate totals
- [x] Money in cents (integers) throughout
- [x] Versioning: supersedeOffer copies lines to new draft, marks old as superseded
- [x] API routes: /api/offers (list+create), /api/offers/[id] (detail+send+approve+reject+supersede), /api/offers/[id]/lines (list+add), /api/offers/[id]/lines/[lineId] (update+delete)
- [x] Screen: ES01 Create offer (/app/offertes/nieuw) — customer/vehicle select, inline line editor, live totals
- [x] Screen: ES05 Offer list (/app/offertes) — search, type/status filters, EUR totals
- [x] Screen: ES10 Offer detail (/app/offertes/[id]) — info, lines table, actions, version chain
- [x] Screen registry: ES01, ES05, ES10 registered
- [x] Strings in nl/en/tr (es namespace — 40+ keys)
- [x] Tests: 55 tests (schemas + state machine) — all pass
- [ ] Public: /o/[token] — ES20 offer approval page — deferred
- [ ] Approval → creates job automatically — deferred to Sprint 6
- [ ] Rate settings in SY05 — deferred

---

## Sprint 5: Parts + Board (4 days) — built in parallel

- [x] Migration 0012: parts table + RLS + indexes + updated_at trigger
- [x] Module: src/modules/parts/ (schema.ts, queries.ts, actions.ts)
- [x] Parts lifecycle: needed → ordered → shipped → received, needed → returned
- [x] Blocking flag: prevents job stage change when true and not received
- [x] Auto-recalculate total (qty × unit_price_cents)
- [x] Auto-set timestamps (ordered_at, received_at) on status transitions
- [x] API routes: /api/parts (list+create), /api/parts/[id] (detail+update+status+delete)
- [x] Screen: PT05 Parts list (/app/onderdelen) — search, status/blocking filters, color-coded badges
- [x] Screen: PT01 Create part (/app/onderdelen/nieuw) — form with EUR→cents conversion, blocking toggle
- [x] Screen registry: PT01, PT05 registered
- [x] Strings in nl/en/tr (pt namespace — 22+ keys)
- [x] Tests: 27 tests (schemas + status transitions) — all pass
- [ ] Job board: drag-between-stages enhancement — deferred

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

## Sprint 8: Appointments (5 days) — built in parallel

- [x] Migration 0013: resources + opening_hours + blackouts + appointments tables + RLS + indexes + triggers
- [x] Seed data: Mon-Fri 08:00-17:00 opening hours, Bay 1 + Bay 2 resources
- [x] Module: src/modules/appointments/ (schema.ts, queries.ts, actions.ts)
- [x] Slot engine: compute available slots from opening hours - existing appointments - blackouts - resource capacity
- [x] Auto-confirm inspection appointments, manual confirm for drop-off/collection/repair_slot
- [x] Status transitions: requested → confirmed → completed, requested/confirmed → cancelled
- [x] API routes: /api/appointments (list+create), /api/appointments/[id] (detail+confirm+cancel+complete), /api/appointments/slots (available slots), /api/resources (list+create), /api/resources/[id] (update+delete)
- [x] Screen: AP05 Appointment calendar (/app/afspraken) — week view, time grid, colored blocks by type, status indicators, date nav, filters
- [x] Screen: AP01 Create appointment (/app/afspraken/nieuw) — type buttons, contact fields, date picker, dynamic slot loading, resource select
- [x] Screen registry: AP01, AP05 registered
- [x] Strings in nl/en/tr (ap namespace — 30+ keys)
- [x] Tests: 32 tests (schemas + status transitions + auto-confirm logic) — all pass
- [ ] Screen: AP10 Confirm pending requests — deferred
- [ ] Screen: SY06 Opening hours, resources, blackouts settings — deferred
- [ ] Public: /afspraak — AP20 booking page — deferred

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
| 2026-08-24 | Sprint 1 committed (58cf407) + pushed to GitHub | Done |
| 2026-08-24 | Sprint 2 committed (d1c19a2) + pushed to GitHub | Done |
| 2026-08-24 | VPS SSH access confirmed (204.168.163.146) — dessystems-web-dev inspected | Done |
| 2026-08-24 | SY051 screen on dessystems — skipped/ignored per user | Closed |
| 2026-08-24 | Supabase region: eu-west-1 (Ireland) confirmed | Done — EU-compliant |
| 2026-08-24 | Nav enhancements: flyout submenus, nested items, role filtering, coming-soon badges, collapsible sections | Done |
| 2026-08-24 | Header: Quick Create dropdown, notification bell with unread badge, System menu, Cmd-K palette | Done |
| 2026-08-24 | SY01 Settings page: theme selector, accent colour, compact mode, sidebar toggle, company info, locale/timezone, notification preferences | Done |
| 2026-08-24 | i18n: sy namespace added to nl/en/tr | Done |
| 2026-08-24 | Migration 0009: notifications table + RLS | Ready — run in Supabase SQL Editor |
| 2026-08-24 | Notification API: GET/POST/PATCH /api/notifications | Done |
| 2026-08-24 | SY05 Monitoring page: real-time feed, filters, stats, sound, auto-refresh | Done |
| 2026-08-24 | Header bell wired to real API (polls every 15s) | Done |
| 2026-08-24 | Sidebar: Monitoring (SY05) added under Systeem > Instellingen | Done |
| 2026-08-24 | vercel.json: framework=nextjs to fix Vercel build | Done |
| 2026-08-24 | Subdomain routing: moved to middleware (vercel.json rewrites don't work with intl middleware) | Done |
| 2026-08-24 | admin.colourking.nl: Vercel domain valid, working | Done |
| 2026-08-24 | monitor.colourking.nl: Vercel domain configured, needs SSL verification | In progress |
| 2026-08-24 | colourking.nl: CNAME to Vercel, Coming Soon page deployed | Done |
| 2026-08-24 | Cloudflare: proxy must be OFF (grey cloud) for Vercel SSL | Done |
| 2026-08-25 | KPI Dashboard spec imported from Google Doc + Claude Design project | Done |
| 2026-08-25 | Admin UI redesign spec imported from Google Doc | Done |
| 2026-08-25 | RP01 KPI Dashboard implemented with demo data (shift + per vehicle views) | Done |
| 2026-08-25 | Color system refined: ck-surface/border/text tokens in tailwind.config.js | Done |
| 2026-08-25 | Sprint 3 Document Engine: migration 0010, module, API, screens DO05+DO03, 10 tests | Done |
| 2026-08-25 | Migration 0010 (documents + number_ranges) | Done — applied in SQL Editor |
| 2026-08-25 | Sprint 4 Offers: migration 0011, module, API, screens ES01+ES05+ES10, 55 tests | Done |
| 2026-08-25 | Sprint 5 Parts: migration 0012, module, API, screens PT01+PT05, 27 tests | Done |
| 2026-08-25 | Sprint 8 Appointments: migration 0013, module, API, screens AP01+AP05, 32 tests | Done |
| 2026-08-25 | Shared files merged: database.ts (0001-0013), codes.ts (+6 screens), i18n (+3 namespaces) | Done |
| 2026-08-25 | Migration 0009 (notifications) | Done — already existed, re-run skipped |
| 2026-08-25 | Migrations 0011, 0012, 0013 | Ready — run in Supabase SQL Editor |
| 2026-08-25 | Total tests: 148/148 pass (7 test files) | Done |
