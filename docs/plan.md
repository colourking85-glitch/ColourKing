# ColourKing — Implementation Plan

**Last updated:** 2026-08-25
**Tech stack:** Next.js 14 App Router + Supabase (eu-west-1) + Vercel + Tailwind
**Repo:** github.com/colourking85-glitch/ColourKing

---

## Status Overview

| Sprint | Name | Status | Screens | Migration |
|--------|------|--------|---------|-----------|
| 0 | Foundation | DONE | RP01, SY01 | 0001–0004 |
| 1 | Records | DONE | KL01/02/05, VH01/05, LD01/05/10 | 0005–0007 |
| 2 | Jobs + Photos | DONE | JB01/05/10/15 | 0008 |
| 2.5 | Nav + Monitor + KPI | DONE | SY05, RP01 (KPI) | 0009 |
| 3 | Document Engine | DONE | DO03, DO05 | 0010 |
| 4 | Offers | DONE | ES01/05/10 | 0011 |
| 5 | Parts + Board | DONE | PT01/05 | 0012 |
| 6 | Repair Order + Handover | NOT STARTED | DO20 | — |
| 7 | Invoice + Payment | NOT STARTED | FA01/05/10, BW40 | — |
| 8 | Appointments | DONE | AP01/05 | 0013 |
| 9 | Tasks & Timesheet | NOT STARTED | TS01/05/10/20 | — |

---

## Completed Sprints

### Sprint 0: Foundation
- Next.js 14 + TypeScript + Tailwind + pnpm
- Supabase: extensions, enums, staff, settings tables (migrations 0001–0004)
- Admin shell: sidebar (6 nav groups, 16 links), header (Cmd-K palette, user menu)
- Screen registry (lib/codes.ts) with 20+ screens
- Auth scaffolding with role-based permissions (admin/office/tech)
- i18n: next-intl with NL/EN/TR
- Coming Soon landing page at colourking.nl

### Sprint 1: Records
- Customers CRUD (KL01/KL02/KL05) — private/company/fleet/dealer types
- Vehicles CRUD (VH01/VH05) + RDW API integration
- Leads inbox (LD01/LD05/LD10) with status pipeline (new→contacted→quoted→won/lost)
- Migrations 0005–0007 applied

### Sprint 2: Jobs + Photos
- Jobs state machine: 10 stages (intake→closed)
- Job CRUD + event audit trail (JB01/JB05/JB10)
- Workshop board / kanban (JB15)
- Photo upload: before/during/after phases, Supabase Storage
- Migration 0008 applied

### Sprint 2.5: Nav, Settings, Monitor, KPI Dashboard
- Subdomain routing: admin.colourking.nl, monitor.colourking.nl
- Settings page (SY01): theme, accent, company info, locale
- Monitor dashboard: real-time notification feed, auto-refresh, sound alerts
- Notification system (migration 0009): API, mark read, bell badge
- KPI Dashboard (RP01): shift overview, 6 KPI cards, phase flow, technician table, per-vehicle detail (demo data)
- Color system refined: ck-surface/border/text tokens

### Sprint 3: Document Engine
- Documents + number_ranges tables (migration 0010)
- allocate_number() PL/pgSQL: gapless numbering with FOR UPDATE locking
- Document lifecycle: draft → issued → cancelled
- Payload freezing at issue time with SHA-256 hash
- Invoice cancel blocked — must use credit note
- Screens: DO05 archive (search, filters, table), DO03 detail (info, integrity, chain, actions)
- API: list/create/detail/issue/cancel/delete
- i18n: doc namespace (30+ keys in nl/en/tr)
- 10 document schema tests (34 total)

### Sprint 5: Parts + Board
- Parts table (migration 0012) with blocking flag
- Parts CRUD with status transitions (needed→ordered→shipped→received, needed→returned)
- Blocking parts prevent job stage changes
- Screens: PT05 parts list (color-coded status), PT01 create part form
- API: list/detail/create/update/status change/delete
- 27 parts schema + status transition tests

---

### Sprint 4: Offers (built in parallel with 5+8)
- Offers + offer_lines tables (migration 0011)
- Offer lifecycle: draft → sent → approved/rejected/superseded (state machine with guards)
- Line items: labour/part/material/other kinds, VAT calculation, auto-recalculate totals
- Money in cents (integers) throughout
- Versioning: supersedeOffer copies lines to new draft
- Screens: ES01 create (line editor), ES05 list (search/filters), ES10 detail (actions, version chain)
- API: offers CRUD + lines CRUD + send/approve/reject/supersede actions
- 55 tests (schemas + state machine)

### Sprint 8: Appointments (built in parallel with 4+5)
- Resources + opening_hours + blackouts + appointments tables (migration 0013)
- Slot engine: available slots from opening hours - appointments - blackouts - capacity
- Auto-confirm inspections, manual confirm for others
- Seed data: Mon-Fri 08:00-17:00, Bay 1 + Bay 2
- Screens: AP05 week calendar (time grid, colored blocks), AP01 create (dynamic slot loading)
- API: appointments CRUD + slots + resources CRUD
- 32 tests (schemas + status transitions + auto-confirm)

---

## Upcoming Sprints

### Sprint 6: Repair Order + Handover (depends on Sprint 4)
- Repair order document template (vehicle, mileage, existing damage, terms)
- Handover note template (work summary, mileage out, warranty)
- Tablet signature capture (canvas → PNG)
- PDF rendering with letterhead, locale-specific terms
- Gallery consent capture at handover

### Sprint 7: Invoice + Payment (depends on Sprint 4 + 6)
- Invoices + invoice_lines + payments tables
- Invoice from approved offer + supplements
- Credit note (supersedes invoice)
- Tax codes on all lines (H21 default)
- Mollie integration: payment links, webhook, paid status
- Screens: FA01 create, FA05 list, FA10 detail
- Public status + pay page: /s/[token]
- BW40 quick VAT calculator

### Sprint 9: Tasks & Timesheet (depends on Sprint 4)
- job_tasks table
- Auto-generate tasks from offer lines on approval
- Screens: TS01 create, TS05 my tasks (technician), TS10 timesheet/planner, TS20 workload
- Dashboard live data connection (replace demo data in RP01)

---

## Dependency Map

```
Sprint 0 ─→ Sprint 1 ─→ Sprint 2 ─→ Sprint 2.5
                │                        │
                ├─→ Sprint 3 (done) ─────┤
                │                        │
                ├─→ Sprint 5 (done) ◄────┤
                │                        │
                └─→ Sprint 4 (parallel) ─┼─→ Sprint 6 ─→ Sprint 7
                                         │
                    Sprint 8 (parallel) ──┘─→ Sprint 9
```

Sprints 4, 5, 8 run in parallel (no dependencies between them).
Sprint 6 needs Sprint 4 (offers → repair order).
Sprint 7 needs Sprint 4 + 6 (offers + repair order → invoice).
Sprint 9 needs Sprint 4 (offer lines → auto-generated tasks).

---

## Post-Tier 1 Sprints

| Sprint | Name | Est. Days |
|--------|------|-----------|
| 10 | Public Website (7 pages, SEO, gallery, quote form) | 7 |
| 11 | Communication (Resend templates, inbound email, /s/[token]) | 6 |
| 12 | Languages (full NL/EN/TR, locale-aware documents) | 4 |
| 13 | Reporting + Hardening (cycle time, workload, Sentry, backups) | 6 |
| 14–17 | BTW & Bookkeeping (scope TBD: 4d minimal or 16d full) | 4–16 |

---

## Tier 1 Gate — The Working Chain
The full flow must work end-to-end:
Lead → Offer → Approval → Repair Order → Job → Parts → Tasks → Handover → Invoice → Paid → Delivered

## Tier 2 Gate — Complete v1
- All 40+ screens operational
- Three locales complete (NL/EN/TR)
- Email in and out working
- Public website live

---

## Migrations Applied

| # | Name | Tables | Applied |
|---|------|--------|---------|
| 0001 | extensions | uuid-ossp, pgcrypto | Yes |
| 0002 | enums | 22 enum types | Yes |
| 0003 | staff_settings | staff, settings | Yes |
| 0004 | rls_staff_settings | RLS policies | Yes |
| 0005 | customers | customers | Yes |
| 0006 | vehicles | vehicles | Yes |
| 0007 | leads | leads, lead_photos | Yes |
| 0008 | jobs | jobs, job_events, job_photos | Yes |
| 0009 | notifications | notifications | Yes |
| 0010 | documents | documents, number_ranges, allocate_number() | Yes |
| 0011 | offers | offers, offer_lines | Pending |
| 0012 | parts | parts | Pending |
| 0013 | appointments | resources, opening_hours, blackouts, appointments | Pending |

---

## Infrastructure

| Service | Status |
|---------|--------|
| GitHub repo (colourking85-glitch/ColourKing) | Active |
| Supabase (stvbekakfhqizvbyyyzo, eu-west-1) | Active |
| Vercel hosting | Active |
| colourking.nl (Coming Soon) | Live |
| admin.colourking.nl | Live |
| monitor.colourking.nl | Configured |
| Cloudflare DNS | Active (proxy OFF for Vercel SSL) |
| Mollie (payments) | Pending setup |
| Resend (email) | Not started |
