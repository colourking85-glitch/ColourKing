# ColourKing — Implementation Plan

**Last updated:** 2026-09-26
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
| 6 | Repair Order + Handover | DONE | DO20, DO21 | 0014 |
| 7 | Invoice + Payment | DONE | FA01/05/10 | 0016 |
| 8 | Appointments | DONE | AP01/05 | 0013 |
| 9 | Tasks & Timesheet | DONE | TS01/05/10 | 0015 |
| 10 | Public Website | DONE | 7 public pages | — |
| 11 | Communication | DONE | Email API | — |
| 12 | Languages | DONE | 48 components, 1078 keys | — |
| 13 | Reporting + Hardening | DONE | RP10 | — |
| 14 | VAT Returns | DONE | BW05 | 0017 |
| 15 | Purchase Register | DONE | PU01/05 | 0018 |
| 16 | Bookkeeping Export | DONE | BK10 | — |
| 17 | BTW Calculator | DONE | BW40 | — |
| 18 | Production Auth & Cleanup | DONE | SY02/SY03, login | — |
| 19 | Enhancements & Fixes | DONE | VH05, LD, JB | 0019–0042 |
| 20 | Inspections Catalog | DONE | IN05/IN10 | 0043–0048 |
| 21 | Customer 360 | DONE | KL01/02/03/05 (9 tabs) | 0058–0059 |
| 22 | Email Senders & Reminders | DONE | SY10/SY25 | 0052, 0063 |
| 23 | Inspections Phase 1 Flow | DONE | IN10 (approve) | 0062 |
| 24 | Vehicle Hub & Polish | DONE | VH10 | 0064 |
| 25 | Agenda & Planning UX | DONE | AP05, TS10 | — |

---

## Tier 1 Sprints (Complete — The Working Chain)

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
- KPI Dashboard (RP01): shift overview, 6 KPI cards, phase flow, technician table
- Color system refined: ck-surface/border/text tokens

### Sprint 3: Document Engine
- Documents + number_ranges tables (migration 0010)
- allocate_number() PL/pgSQL: gapless numbering with FOR UPDATE locking
- Document lifecycle: draft → issued → cancelled
- Payload freezing at issue time with SHA-256 hash
- Invoice cancel blocked — must use credit note
- Screens: DO05 archive, DO03 detail
- 10 document schema tests

### Sprint 4: Offers (built in parallel with 5+8)
- Offers + offer_lines tables (migration 0011)
- Offer lifecycle: draft → sent → approved/rejected/superseded (state machine with guards)
- Line items: labour/part/material/other kinds, VAT calculation, auto-recalculate totals
- Money in cents (integers) throughout
- Versioning: supersedeOffer copies lines to new draft
- Screens: ES01 create, ES05 list, ES10 detail
- 55 tests (schemas + state machine)

### Sprint 5: Parts + Board
- Parts table (migration 0012) with blocking flag
- Parts CRUD with status transitions (needed→ordered→shipped→received, needed→returned)
- Blocking parts prevent job stage changes
- Screens: PT05 parts list, PT01 create part
- 27 parts schema + status transition tests

### Sprint 6: Repair Order + Handover
- Repair order + handover note document templates
- Tablet signature capture (SignatureCanvas component, canvas → PNG)
- Screens: DO20 repair order detail, DO21 handover note detail
- Signatures table (migration 0014), gallery_consent on documents
- 18 tests

### Sprint 7: Invoice + Payment
- Invoices + invoice_lines + payments tables (migration 0016)
- Invoice from approved offer: copies lines, calculates VAT per tax code
- Credit note: negative mirror invoice, no direct cancellation
- State machine: draft → sent → paid/overdue/credited
- Professional HTML invoice template with company letterhead
- Mollie payment integration: iDEAL, card, bank transfer
- Public payment page: /s/[token], webhook for status updates
- Screens: FA01 create, FA05 list, FA10 detail
- 96 tests

### Sprint 8: Appointments (built in parallel with 4+5)
- Resources + opening_hours + blackouts + appointments tables (migration 0013)
- Slot engine: available slots from opening hours - appointments - blackouts - capacity
- Auto-confirm inspections, manual confirm for others
- Screens: AP05 week calendar, AP01 create
- 32 tests

### Sprint 9: Tasks & Timesheet
- job_tasks + time_entries tables (migration 0015)
- Auto-generate tasks from offer lines on approval
- Task status machine: todo → in_progress → done, any → blocked, blocked → todo
- Clock in/out per task with duration computation
- Screens: TS01 create task, TS05 my tasks, TS10 planner
- 33 tests

---

## Tier 2 Sprints (Complete — v1 Feature Set)

### Sprint 10: Public Website
- Full public website replacing Coming Soon page at colourking.nl
- 7 pages: homepage (hero, stats, services, testimonials), services (8 categories), gallery (before/after grid), about, contact with quote form
- Locale-aware routing via next-intl (NL/EN/TR)
- Quote request API creates leads (origin: website)
- SEO metadata on all pages

### Sprint 11: Communication
- Email template system: 7 locale-aware HTML templates (offer, invoice, appointment confirmation, appointment reminder, payment received, lead received, repair complete)
- Resend API integration with dry-run mode when API key not set
- Business event trigger functions (onOfferSent, onInvoiceIssued, etc.)
- Email preview API for staff
- 45 email tests

### Sprint 12: Languages (full NL/EN/TR)
- Audited and replaced hardcoded strings in 48 components with useTranslations()
- Created locale-aware formatters: formatCurrency, formatDate, formatDateShort, formatNumber
- AdminIntlProvider for client components with locale switching
- Reconciled all 3 locale files to 1078 keys each (perfect parity)
- 39 i18n tests

### Sprint 13: Reporting + Hardening
- Reports dashboard (RP10): revenue, job performance, workload, customer metrics
- CSS-only charts (no external libraries)
- Connected KPI dashboard (RP01) to real Supabase data
- Health check API (/api/health)
- React ErrorBoundary component
- 39 report tests

---

## Tier 3 Sprints (Complete — BTW & Bookkeeping)

### Sprint 14: VAT Returns
- vat_returns table (migration 0017) with Dutch BTW aangifte box structure
- Auto-calculate VAT from invoices grouped by tax code
- VAT return lifecycle: open → draft → filed (locked) → corrected
- Filed returns are locked — edits only via correction
- BW05 BTW Dashboard: year view, quarter/month toggle, box amounts, filing
- 49 tests

### Sprint 15: Purchase Register
- purchases table (migration 0018) for inkoopfacturen
- Categories: parts, paint, materials, tools, rent, utilities, insurance, other
- Track deductible input VAT (feeds into VAT return box 5a)
- Screens: PU05 purchase list, PU01 create purchase
- Paid/unpaid tracking
- 68 tests

### Sprint 16: Bookkeeping Export
- CSV export of invoices, purchases, VAT returns for accountant
- Profit/loss summary with revenue, costs by category, net profit
- Period-based export (month/quarter/year)
- BK10 Bookkeeping Export page with download cards
- API routes for CSV download and summary
- 45 tests

### Sprint 17: BTW Calculator
- BW40 quick VAT calculator tool
- Input amount → show ex-VAT, VAT, incl-VAT for each rate (21%, 9%, 0%)
- Real-time calculation, all math in integer cents
- 31 tests

---

## Tier 4 Sprints (Complete — Production Readiness)

### Sprint 18: Production Auth & Cleanup
- Login page (/login): email/password, loading states, error display
- Password reset flow: request reset, set new password via email link
- Auth middleware: protects all /app/* routes, redirects to /login
- Staff management screen (SY02): list, invite, toggle active, change role
- Number ranges settings screen (SY03): edit document prefixes, preview next number
- Staff API: GET list, POST invite, PATCH update role/active
- Numbering API: GET list ranges, PATCH update prefix
- Cleaned auth.ts: mock session for dev, real Supabase auth in production
- Removed all `soon: true` flags — every sidebar link is now active
- Deleted orphaned Sprint 10 files, updated .gitignore
- Verified leads column names match migration (no mismatch)
- 56 tests

---

## Tier 5 Sprints (Complete — CRM & Inspections)

### Sprint 19: Enhancements & Fixes
- Internal notes on vehicles + customers (migration 0019)
- Staff RLS fix with `is_active_staff()` security definer (0020)
- Email logging with thread support (0021, 0052)
- Vehicle body_type, brand/model catalog, status enums (0022–0026)
- Customer status enum (prospect/active/suspended/blocked/ended) (0027)
- Vehicle notes + plate_origin (0028–0029)
- Job type, priority, payer fields (0030)
- Labour rates + offer payer (0031)
- Lead photos bucket, appointment fields, lead numbering (0032–0033, 0050)
- Lead soft delete (0051)
- Handover share token (0034)
- Leads web origin + offerte fields (0035, 0037–0038)
- Jobs estimated delivery (0036)
- Offers estimated delivery (0039)
- AI settings + provider settings (0040–0041)
- Site analytics + IP hash (0042, 0055)
- Certifications settings (0043)
- Job tracking (0049)
- Portfolio (0054)
- Saturday opening hours (0056)
- Invoice type (0057)
- Company assets bucket (0061)
- Company settings seed (0060)
- 3 light themes (Clean, Daylight, Arctic)
- Logo upload with auto-create storage bucket
- Agenda day/3-day/week/month view modes
- Lead ID clickable + auto-create appointment on Won

### Sprint 20: Inspections Catalog
- 6 new tables: ins_components, ins_damage_types, ins_severity_levels, ins_dispositions, ins_shot_templates, ins_checklist_items (0043)
- ins_inspections table with full vehicle + customer links (0044)
- ins_findings, ins_finding_parts, ins_photos tables
- ins_approvals + ins_events + ins_snapshots (0045)
- Transition guards (0046)
- RLS policies on all ins_ tables (0047)
- Seed data for catalog tables (0048)
- Screen: IN05 new inspection wizard with RDW lookup

### Sprint 21: Customer 360
- 11 customer types (private, SME, corporate fleet, lease company, rental, taxi/transport, dealer, bodyshop partner, insurer, insurance intermediary, government)
- 5 statuses (prospect, active, suspended, blocked, ended)
- Dynamic business fields per type (KVK, BTW, legal form, fleet size, fleet profile, partnership type)
- 10 new CUS tables with RLS: customer_contacts, customer_addresses, customer_billing, customer_insurance, customer_consents, customer_activities, customer_notes, customer_tags, customer_relationships, customer_documents (0058–0059)
- Customer 360 detail page with 9 tabs: overview, contacts, addresses, billing, insurance, consents, notes, activities, vehicles
- Full-profile API with FK disambiguation for vehicles
- Customer soft-delete support
- Migrations 0058–0059 applied

### Sprint 22: Email Senders & Reminders
- Per-process email sender identities (configurable from/reply-to per document type)
- SY10 E-mail settings tab for managing senders
- SY25 "Verzonden e-mails" tab listing all outbound emails
- Optional BCC address per sender identity
- Manual "send email to customer" buttons on ES10, FA10, AP10, DO21
- Automated customer reminder system with reminder_log table (0063)
- Email thread tracking (0052)

### Sprint 23: Inspections Phase 1 Flow
- plate_country column on ins_inspections
- ins_recount() trigger for finding_count/photo_count/total_hours
- ins_build_snapshot() for document integrity (SHA-256)
- ins_transition() state machine: CONCEPT → BEZIG → TER_AKKOORD → AKKOORD → VERGRENDELD (+ GEANNULEERD)
- Guards: damage finding required for TER_AKKOORD, inspector approval for AKKOORD
- ins_approve() with document hash, role validation, duplicate check
- AKKOORD auto-chains to VERGRENDELD after snapshot freeze
- Approve API route with lock support
- Migration 0062 applied

### Sprint 24: Vehicle Hub & Polish
- Vehicle detail page as hub: inspections, activity, parties, timestamped notes
- Internal notes repair migration (0064)
- Readable PostgREST errors in inspection routes
- Finding photos in inspection report
- Sent-emails table status badge fix

### Sprint 25: Agenda & Planning UX
- AP05 agenda defaults to today (next 7 days) instead of snapping to Monday
- Red appointment count badges on day headers (week + month views)
- TS10 Planning: clickable "Afspraken" toggle overlays appointments as a row in the staff hours grid
- Per-day appointment count badges on TS10 column headers when toggle active
- Table renders with appointments even when no time entries exist
- Schema test fix: customer types expanded from 4 to 11 (Customer 360 alignment)

---

## Tier 5 Gate — CRM & Inspections ✅
- Customer 360 with 11 types, 9 detail tabs, full lifecycle
- Inspections end-to-end: catalog → capture → approval → locked snapshot
- Email system: per-process senders, manual send buttons, automated reminders
- Vehicle detail hub with linked inspections and notes
- 718 tests across 22 test files

---

## Dependency Map

```
Sprint 0 ─→ Sprint 1 ─→ Sprint 2 ─→ Sprint 2.5
                │                        │
                ├─→ Sprint 3 ────────────┤
                │                        │
                ├─→ Sprint 5 ◄───────────┤
                │                        │
                └─→ Sprint 4 (parallel) ─┼─→ Sprint 6 ─→ Sprint 7 ─→ Sprint 14
                                         │                           Sprint 15
                    Sprint 8 (parallel) ──┘─→ Sprint 9         ↓
                                                          Sprint 16+17
                Sprint 10 ──┐
                Sprint 11 ──┼── Tier 2 (independent)
                Sprint 12 ──┤
                Sprint 13 ──┘
```

---

## Tier 1 Gate — The Working Chain ✅
Lead → Offer → Approval → Repair Order → Job → Parts → Tasks → Handover → Invoice → Paid → Delivered

## Tier 2 Gate — Complete v1 ✅
- All 40+ screens operational
- Three locales complete (NL/EN/TR) — 1078 keys each
- Email templates ready (7 types, 3 locales)
- Public website live (7 pages)
- 418 tests across 13 test files

## Tier 3 Gate — Financial Compliance ✅
- VAT returns auto-calculated from invoices
- Purchase register with deductible VAT
- Bookkeeping export for accountant
- BTW calculator
- 193 tests across Sprints 14-17

## Tier 4 Gate — Production Readiness ✅
- Auth: login, password reset, session middleware
- Staff management + number ranges settings
- All sidebar links active (no more "soon" badges)
- 56 auth tests

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
| 0011 | offers | offers, offer_lines | Yes |
| 0012 | parts | parts | Yes |
| 0013 | appointments | resources, opening_hours, blackouts, appointments | Yes |
| 0014 | repair_handover | signatures, gallery_consent column | Yes |
| 0015 | tasks_timesheet | job_tasks, time_entries | Yes |
| 0016 | invoices | invoices, invoice_lines, payments | Yes |
| 0017 | vat_returns | vat_returns | Yes |
| 0018 | purchases | purchases | Yes |
| 0019 | internal_notes | internal_notes | Yes |
| 0020 | fix_staff_rls | is_active_staff() function | Yes |
| 0021 | email_log | email_log | Yes |
| 0022–0026 | vehicles_fixes | body_type, brands, models, RLS | Yes |
| 0027 | customer_status | status enum expansion | Yes |
| 0028–0029 | vehicle_notes | vehicle_notes, plate_origin | Yes |
| 0030–0031 | job_offer_fields | job type/priority/payer, labour rates | Yes |
| 0032–0039 | leads_offers_enhancements | photos bucket, appointment, web fields, delivery | Yes |
| 0040–0042 | ai_analytics | AI settings, site analytics | Yes |
| 0043 | ins_catalog + certifications | ins_components, damage_types, severity, dispositions, shots, checklist | Yes |
| 0044–0048 | ins_inspections | inspections, findings, photos, approvals, events, snapshots, RLS, seed | Yes |
| 0049–0051 | job_lead_tracking | job tracking, lead numbering, lead soft delete | Yes |
| 0052–0053 | email_threads_docs | email_log threads, project dossier doc type | Yes |
| 0054–0057 | portfolio_misc | portfolio, analytics IP hash, Saturday hours, invoice type | Yes |
| 0058–0059 | customer360 | 10 CUS tables, enum expansion, backfill | Yes |
| 0060–0061 | company_settings | company settings seed, company assets bucket | Yes |
| 0062 | ins_phase1_flow | plate_country, counters, transition, approve, snapshot | Yes |
| 0063 | reminder_log | reminder_log | Yes |
| 0064 | internal_notes_repair | notes FK fix | Yes |

---

## Infrastructure

| Service | Status |
|---------|--------|
| GitHub repo (colourking85-glitch/ColourKing) | Active |
| Supabase (stvbekakfhqizvbyyyzo, eu-west-1) | Active |
| Vercel hosting | Active |
| colourking.nl | Live (full website) |
| admin.colourking.nl | Live |
| monitor.colourking.nl | Configured |
| Cloudflare DNS | Active (proxy OFF for Vercel SSL) |
| Zoho SMTP (email transport) | Active |
| Mollie (payments) | Pending setup |
| Resend (email) | Not used (Zoho SMTP instead) |

---

## Test Coverage

| Test File | Tests | Sprint |
|-----------|-------|--------|
| tests/rdw.test.ts | 3 | 1 |
| tests/codes.test.ts | 4 | 0 |
| tests/machine.test.ts | 7 | 2 |
| tests/schema.test.ts | 20 | 3 |
| tests/offers.test.ts | 55 | 4 |
| tests/parts.test.ts | 27 | 5 |
| tests/appointments.test.ts | 32 | 8 |
| tests/repair-orders.test.ts | 18 | 6 |
| tests/tasks.test.ts | 33 | 9 |
| tests/invoices.test.ts | 96 | 7 |
| tests/email.test.ts | 45 | 11 |
| tests/i18n.test.ts | 39 | 12 |
| tests/reports.test.ts | 39 | 13 |
| tests/vat.test.ts | 49 | 14 |
| tests/purchases.test.ts | 68 | 15 |
| tests/bookkeeping.test.ts | 45 | 16 |
| tests/btw-calculator.test.ts | 31 | 17 |
| tests/auth.test.ts | 56 | 18 |
| tests/booking-time.test.ts | 6 | 19 |
| tests/lead-thread.test.ts | 7 | 19 |
| tests/portfolio.test.ts | 17 | 19 |
| **Total** | **718** | |
