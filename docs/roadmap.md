# Colourking Roadmap

Last updated: 2026-09-26

## Tier 1 — Foundation & Working Chain (done)

### Sprint 0 — Foundation (done)
- Next.js 14 App Router + Supabase + Tailwind
- Admin shell with dark theme, sidebar, i18n (nl/en/tr)
- Auth scaffolding, screen registry, ScreenBadge component

### Sprint 1 — Core Data (done)
- Customers CRUD (KL01/KL05/KL02)
- Vehicles CRUD + RDW lookup (VH01/VH05)
- Leads inbox + pipeline (LD01/LD05/LD10)

### Sprint 2 — Jobs + Photos (done)
- Jobs state machine: 10 stages (intake → closed)
- Job CRUD + events audit trail (JB01/JB05/JB10)
- Workshop board / kanban (JB15)
- Photo upload: before/during/after phases

### Sprint 2.5 — Nav, Settings, Monitor, KPI (done)
- Subdomain routing, settings page (SY01), monitor dashboard (SY05)
- Notification system, KPI dashboard (RP01)

### Sprint 3 — Document Engine (done)
- Documents + number_ranges, allocate_number(), SHA-256 payload freezing
- Document lifecycle: draft → issued → cancelled

### Sprint 4 — Offers (done)
- Offer lifecycle: draft → sent → approved/rejected/superseded
- Line items, VAT calculation, versioning (ES01/ES05/ES10)

### Sprint 5 — Parts + Board (done)
- Parts CRUD with blocking flag (PT01/PT05)
- Parts status transitions: needed → ordered → shipped → received

### Sprint 6 — Repair Order + Handover (done)
- Repair order + handover note templates (DO20/DO21)
- Tablet signature capture (SignatureCanvas → PNG)

### Sprint 7 — Invoice + Payment (done)
- Invoice from approved offer, credit notes, Mollie payment (FA01/FA05/FA10)
- Public payment page (/s/[token]), webhook for status updates

### Sprint 8 — Appointments (done)
- Resources, opening hours, blackouts, slot engine (AP01/AP05)

### Sprint 9 — Tasks & Timesheet (done)
- Auto-generate tasks from offer lines, clock in/out (TS01/TS05/TS10)

## Tier 2 — v1 Feature Set (done)

### Sprint 10 — Public Website (done)
- 7 pages: homepage, services, gallery, about, contact with quote form
- Locale-aware routing (NL/EN/TR), SEO metadata

### Sprint 11 — Communication (done)
- 7 locale-aware email templates, Zoho SMTP transport, business event triggers

### Sprint 12 — Languages (done)
- Full NL/EN/TR i18n across 48 components, 1078+ keys

### Sprint 13 — Reporting + Hardening (done)
- Reports dashboard (RP10), health check API, ErrorBoundary

## Tier 3 — BTW & Bookkeeping (done)

### Sprint 14 — VAT Returns (done)
- Dutch BTW aangifte box structure, auto-calculate from invoices (BW05)

### Sprint 15 — Purchase Register (done)
- Purchases with deductible input VAT, categories (PU01/PU05)

### Sprint 16 — Bookkeeping Export (done)
- CSV export, profit/loss summary, period-based export (BK10)

### Sprint 17 — BTW Calculator (done)
- Quick VAT calculator: ex-VAT, VAT, incl-VAT for each rate (BW40)

## Tier 4 — Production Readiness (done)

### Sprint 18 — Production Auth & Cleanup (done)
- Login, password reset, auth middleware, staff management (SY02/SY03)

## Tier 5 — CRM & Inspections (done)

### Sprint 19 — Enhancements & Fixes (done)
- Internal notes, is_active_staff() RLS helper, email logging
- Vehicle brands/models catalog, customer status expansion
- AI settings, site analytics, portfolio, lead numbering
- 3 light themes, logo upload, agenda view modes

### Sprint 20 — Inspections Catalog (done)
- 6 catalog tables: components, damage types, severity, dispositions, shots, checklist
- ins_inspections + findings + photos + approvals + events + snapshots
- New inspection wizard (IN05) with RDW lookup

### Sprint 21 — Customer 360 (done)
- 11 customer types with dynamic business fields
- 10 new CUS tables (contacts, addresses, billing, insurance, consents, notes, activities, tags, relationships, documents)
- Customer 360 detail page with 9 tabs
- Full-profile API, soft-delete support

### Sprint 22 — Email Senders & Reminders (done)
- Per-process email sender identities, SY10 E-mail tab, SY25 sent emails
- Manual "send email" buttons on ES10/FA10/AP10/DO21
- Automated customer reminder system

### Sprint 23 — Inspections Phase 1 Flow (done)
- State machine: CONCEPT → BEZIG → TER_AKKOORD → AKKOORD → VERGRENDELD
- Guards, ins_approve() with SHA-256 document hash
- Snapshot freeze on AKKOORD, auto-lock to VERGRENDELD

### Sprint 24 — Vehicle Hub & Polish (done)
- Vehicle detail as hub with inspections, activity, parties, notes
- PostgREST error improvements, finding photos in report

### Sprint 25 — Agenda & Planning UX (done)
- AP05 agenda starts from today (next 7 days) instead of beginning of the week
- Red appointment count badges on day headers in week + month views
- TS10 Planning: "Afspraken" toggle combines work hours and appointments in one view

## Next up

### Go-live configuration
- Mollie payment keys (production)
- AI API key for damage assessment
- IMAP polling for inbound email

### Future modules
- Customer portal (track job status by link)
- WhatsApp integration
- Performance audit / Lighthouse
