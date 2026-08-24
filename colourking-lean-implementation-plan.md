# Colourking — Lean Implementation Plan (v2.3)

**24 August 2026** · Supersedes v2.2 · Read alongside the v1.1 addendum (frontend, screen codes, NL/EN/TR, email)
**Stack** Next.js 14 on Vercel + Supabase
**Effort** ~45 days for the working chain · ~68 days for the complete v1 · ~82 days including BTW
**Progress** Tracked in `trace.md` (same directory)

**Changes since v2.2**

1. **Platform accounts confirmed.** GitHub, Vercel and Supabase created under `ColourKing85@gmail.com` — all fresh/empty.
2. **Admin console design decision:** clone the BOP dark-theme shell from `bop.dessystems.io` (analyse, don't import). Same sidebar/header pattern, dark background, adapted to ColourKing branding.
3. **Public website design:** Airo-built sample (`web/sample/`) as inspiration — dark theme, Barlow + Barlow Condensed fonts, red accent `#E8364E`. Rebuild in Next.js, not copy.
4. **Progress tracking:** `trace.md` replaces external task tracking. Every sprint, task and blocker tracked there.
5. **Technical spec companion:** `colourking-technical-spec.md` covers how to build (conventions, patterns, agent guardrails).

**Changes since v1.0**

1. All cost and price figures removed — this document describes scope and effort only.
2. **Appointments and slot booking** added — end-user visit requests, availability, confirmation.
3. **Task and timesheet management** added — planned vs actual work per technician, ongoing / upcoming / done.
4. **Offer restructured as a first-class object** with its own number, independent of leads and jobs (see §4).
5. **Domain split** — staff console moves to `admin.colourking.nl` (see §8).
6. **Official document engine** added — draft → issued → signed, with offer, repair order, handover note, invoice and credit note (see §6).
7. **BTW & bookkeeping** added — purchase register, quarterly declaration workbench, reports, suppletie, ICP, nihilaangifte, quick calc and an AI assistant (see §7), as a separable Tier 3.

---

## 0. Prerequisites — platforms and accounts

Nothing in sprint 0 can start until these exist. Two of them have lead times measured in days, so start those first.

### 0.1 The identity

**`colourking85@gmail.com`** is the single owner identity for every platform below.

That is convenient and it is also the project's largest single point of failure: lose it and five platforms lock at once. Before it is used anywhere:

- **2FA with an authenticator app**, not SMS
- **Recovery codes printed and stored offline**, plus a recovery email that is not on the same account
- **A password manager** holding every credential — not the browser
- **Never shared** with the garage. The shop gets accounts *inside* Colourking; it never gets the platform logins.

Once the system is live, add a second admin on Vercel, Supabase and Cloudflare so a lost Google account is an inconvenience rather than an outage.

### 0.2 Platforms

| # | Platform | Role | Sign in with | Lead time |
|---|---|---|---|---|
| 1 | **GitHub** | Source of truth, CI, branch protection | Google account | minutes |
| 2 | **Local PC** (dell5530, Windows) | Development, Claude Code | — | ~1 hour setup |
| 3 | **Vercel** | Production + preview deploys | **GitHub** | minutes |
| 4 | **Supabase** | Postgres, auth, storage | **GitHub** | minutes |
| 5 | **Cloudflare** | DNS, email routing | Google account | minutes + DNS propagation |
| 6 | **Anthropic** | Claude Code | Google account | minutes |
| 7 | **Resend** | Transactional email | Google account | minutes + domain verification |
| 8 | **Mollie** | iDEAL, payment links | Google account | **days — business verification** |
| 9 | **Domain registrar** | `colourking.nl` | — | **hours to days** |
| 10 | **Sentry** *(optional)* | Error tracking | GitHub | minutes |

**Sign into Vercel and Supabase with GitHub, not Google directly.** Both bind repositories and deployments to a GitHub identity; going through Google creates an account that then has to be re-linked. One less thing to untangle later.

**Start 8 and 9 on day one.** Mollie needs KvK details, a bank account and business verification, and it is not instant. The domain has to exist before Cloudflare, which has to exist before Resend can verify, which blocks the email sprint.

### 0.3 What to create on each

**GitHub** — private repo `colourking`. Branch `main` protected: no direct pushes, PR required, CI green to merge. Working branch `dev`. Add `.github/workflows/ci.yml` in sprint 0 (typecheck, lint, build).

**Local PC** — Node 20 LTS, pnpm, Git, VS Code or Cursor, **Supabase CLI**, **Docker Desktop** (needed for `supabase start`), Claude Code. Windows: run the toolchain under WSL2 if anything fights you; the Supabase CLI is happier there.

**Vercel** — one project, linked to the GitHub repo. Two domains on the same project: `colourking.nl` (+ `www`) and `admin.colourking.nl`. Environment variables set separately for Production, Preview and Development.

**Supabase** — **two projects**: `colourking-dev` and `colourking-prod`. **Region: EU (Frankfurt).** Customer names, addresses, vehicle photos and licence plates are personal data under GDPR/AVG — the database belongs in the EU, and this cannot be changed after creation without a migration.

**Cloudflare** — zone for `colourking.nl`, nameservers pointed at Cloudflare from the registrar. Later: Email Routing (§ addendum) and the DNS records Resend requires.

**Anthropic** — Claude Code on the Google account. A separate Console API key is needed only if the `BW50` assistant or any in-product AI feature is built; that key is a server-side secret and never reaches the browser.

**Resend** — verify `colourking.nl` and add SPF, DKIM and DMARC records in Cloudflare **before the first send**. Invoices landing in spam is a cash-flow problem, not an IT one.

**Mollie** — business account with KvK and bank details. Test keys work immediately; live keys wait on verification.

### 0.4 Environments

| | Runs on | Database | Domain |
|---|---|---|---|
| **Local** | `pnpm dev` + `supabase start` | local Postgres in Docker | `localhost:3000` |
| **Preview** | Vercel, per branch | `colourking-dev` | auto-generated URL |
| **Production** | Vercel, `main` | `colourking-prod` | `colourking.nl` / `admin.…` |

Never point a preview deployment at the production database. It is the fastest way to email a test invoice to a real customer.

### 0.5 Secrets

| Variable | Where | Exposed to browser |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all | yes — RLS is the protection |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | **never** |
| `RESEND_API_KEY` | server only | never |
| `MOLLIE_API_KEY` | server only | never |
| `ANTHROPIC_API_KEY` | server only | never |
| `DOCUMENT_TOKEN_SECRET` | server only | never |

`.env.local` is git-ignored from the first commit. `.env.example` is committed with keys and no values. The service-role key bypasses every RLS policy — if it ever ships to the client, the whole security model is gone.

### 0.6 Pre-sprint-0 checklist

```
[ ] Google account secured — 2FA, recovery codes offline, password manager
[ ] colourking.nl registered
[ ] Cloudflare zone created, nameservers switched
[ ] GitHub repo created, main protected
[ ] Supabase dev + prod projects created in EU (Frankfurt)
[ ] Vercel project linked to repo, both domains added
[ ] Mollie business verification submitted        ← start early
[ ] Resend domain verification + SPF/DKIM/DMARC
[ ] Local toolchain installed, `supabase start` runs
[ ] Anthropic / Claude Code working on the repo
```

---

## 1. Scope

The chain, built once, cleanly:

```
Lead → Customer → Vehicle → Damage → Offer → Approval → Appointment
     → Workshop → Parts → Repair → QC → Invoice → Payment → Delivery
     → Review → Customer history
```

**One honest boundary, stated once.** Without a normed calculation (Audatex/SilverDAT) and an eXchange link, Colourking is **not** the system that settles insurer-steered claims — those stay in whatever the shop uses today.

What Colourking *is*:

- the complete system for **private, fleet, dealer and subcontract work** — request to payment
- the **operational** system for insurer work too — booking, intake photos, job board, tasks, parts, status, delivery — while the calculation and claim stay where they are

That is coexistence by design, and it is why this fits in weeks rather than years. Both missing pieces are one adapter each, added later only if volume justifies the licence.

---

## 2. Objects

```
 Lead ──────────────► Customer ──► Vehicle
   │  (request, no prices)              │
   │                                    │
   └──► OFFER (own number) ◄────────────┘
             │  manual creation equally valid
             ▼
        public approval link
             │
          approved
             ▼
          ┌──────┐        Appointment (drop-off / collection)
          │ JOB  │◄───────────────────────────────
          └───┬──┘
              ├── Photos          (before / during / after)
              ├── Tasks           (planned vs actual, per technician)
              ├── Parts           (blocking flag)
              └── Events          (audit + activity)
              │
              ▼
        QC ──► Ready ──► Invoice ──► Paid ──► Delivered ──► Review
                                                    │
                                                    ▼
                                         Vehicle history (permanent)
```

**Two design decisions that each remove a whole module:**

- A **supplement** is not a new object — it is an offer with `type = 'supplement'` and a `parent_offer_id`. Same approval flow, same PDF, same link.
- **`job_events`** is the audit trail, the activity feed and the internal notes in one append-only table. Every state change writes a row, which gives cycle time and stage duration for free.

---

## 3. Data model — 18 tables

```sql
-- Identity & config
staff              id, email, name, role ('admin'|'office'|'tech'), locale,
                   colour, weekly_hours, active
settings           key, value jsonb   -- rates, VAT, company, numbering, opening hours

-- Parties & assets
customers          id, type ('private'|'company'|'fleet'|'dealer'), name, email, phone,
                   address, postcode, city, vat_number, locale, notes, created_at
vehicles           id, customer_id, kenteken, vin, make, model, year, colour, paint_code,
                   fuel, body_type, rdw_snapshot jsonb, wok bool, created_at

-- Demand
leads              id, customer_id?, vehicle_id?, source, channel, name, email, phone,
                   kenteken, damage_description, preferred_date, locale,
                   status, lost_reason, created_at
lead_photos        id, lead_id, storage_path, created_at

-- Offers  (see §4)
offers             id, offer_number, version, type ('offer'|'supplement'),
                   parent_offer_id?, lead_id?, customer_id, vehicle_id, job_id?,
                   origin ('website'|'manual'|'phone'|'email'|'walk_in'),
                   status, subtotal, vat, total, valid_until, locale,
                   approval_token, sent_at, approved_at, approved_ip, created_at
offer_lines        id, offer_id, kind ('labour'|'part'|'material'|'other'),
                   description, qty, unit, unit_price, line_total, sort_order

-- Scheduling
resources          id, name, type ('bay'|'booth'|'staff'), capacity, active
appointments       id, type ('inspection'|'drop_off'|'collection'|'repair_slot'),
                   lead_id?, offer_id?, job_id?, customer_id?, vehicle_id?,
                   resource_id?, starts_at, ends_at, status, booked_via, notes, created_at
blackouts          id, resource_id?, starts_at, ends_at, reason

-- The spine
jobs               id, job_number, customer_id, vehicle_id, offer_id?, lead_id?,
                   title, damage_description, status, stage_entered_at,
                   promised_date, assigned_to, total_ex_vat,
                   gallery_consent, gallery_published, gallery_slug, created_at
job_tasks          id, job_id, stage, title, assigned_to, planned_start, planned_end,
                   planned_hours, actual_start, actual_end, actual_hours,
                   status ('todo'|'in_progress'|'done'|'blocked'), sort_order
job_photos         id, job_id, phase ('before'|'during'|'after'), label, storage_path,
                   gallery_pair, taken_at, uploaded_by
job_events         id, job_id, type, message, actor_id, created_at

-- Supply
parts              id, job_id, offer_line_id?, description, part_number, supplier,
                   status, expected_at, received_at, blocking bool

-- Money in
invoices           id, job_id, invoice_number, payer, payer_name, status,
                   subtotal, vat, total, due_date, sent_at, paid_at, mollie_payment_id
invoice_lines      id, invoice_id, description, qty, unit_price, line_total, vat_rate
payments           id, invoice_id, method, amount, paid_at, reference

-- Bookkeeping & BTW  (see §7)
purchase_invoices  id, supplier_name, supplier_vat, invoice_number, invoice_date,
                   net_amount, vat_rate, vat_amount, gross_amount, tax_code,
                   deductible_pct, category, job_id?, attachment_path, created_at
vat_returns        id, period_type ('quarter'|'month'), year, period,
                   status ('open'|'draft'|'filed'|'corrected'), payload jsonb,
                   total_due, filed_at, filed_by, filed_reference, locked_at, created_at

-- Official documents  (see §6)
documents          id, doc_type, doc_number, status, supersedes_id?,
                   job_id?, offer_id?, invoice_id?, customer_id, vehicle_id,
                   locale, payload jsonb, pdf_path, pdf_sha256,
                   issued_at, issued_by, sent_at,
                   signed_at, signed_by_name, signature_path, signed_ip,
                   cancelled_at, cancel_reason, created_at

-- After
reviews            id, job_id, rating, comment, requested_at, responded_at, published
```

*(21 tables. The v1.1 addendum adds `email_messages` and `email_attachments` — 23 in total.)*

**Notes that matter**

- `kenteken` is the natural key everywhere. `vin` is optional, needed only for paint code.
- `rdw_snapshot jsonb` — store the whole RDW response. Saves schema churn forever.
- `settings` as key/value jsonb kills an entire configuration UI. One admin page edits it.
- Supabase RLS: staff-only on everything, plus **two** public policies — read an `offer` by `approval_token`, and read a `job` status by token. That is the whole customer-facing surface.

---

## 4. The offer question — answered

> *A customer sends an offer request from the website. Where does it land — leads, or a separate offer object?*

**Both, and the distinction is the important part.**

| | **Lead** | **Offer** |
|---|---|---|
| What it is | An inbound **request** | An outbound **priced document** |
| Who creates it | The customer, or reception taking a call | The shop |
| Has prices | **Never** | Always |
| Has a number | No (internal id only) | **Yes** — `OFF-2026-00123` |
| Can be sent | No | Yes, with an approval link |
| Lifecycle | `new → contacted → quoted → won / lost` | `draft → sent → approved / rejected / superseded` |

**The rule:** *a lead is a request with no money on it; an offer is a priced document with a number that can be sent, approved, archived and disputed.*

Putting prices on a lead is the mistake that forces a rewrite later — because the moment a customer asks "can you adjust the quote you sent me on the 12th?", you need a versioned, numbered, immutable document. A lead cannot be that.

### The flow

```
Website /offerte-aanvragen
        │  (kenteken, damage description, photos, preferred date)
        ▼
  LEAD  #internal · status = new · source = 'website'
        │
        ├─ inspection needed? ──► APPOINTMENT (type = inspection)
        │
        ▼  ES01 / LD10
  OFFER  OFF-2026-00123 · origin = 'website' · lead_id set
        │
        ▼  ES10 — send
  Customer opens /o/[token] ──► approves
        │
        ▼
  JOB   2026-00842 · offer_id set · lead.status = won
        │
        └─ APPOINTMENT (type = drop_off) proposed
```

### Manual offers are the same object

`ES01` creates an offer from scratch with **no lead required** — walk-in, phone call, dealer email, a job the shop quoted on the forecourt. `origin` records which:

`website` · `manual` · `phone` · `email` · `walk_in`

That one field is your full attribution: which channels produce offers, and which offers get approved. No analytics module needed.

Three consequences worth being explicit about:

1. **`offers.job_id` is nullable and filled on approval**, not before. You quote *before* a job exists — the job is what an approved offer becomes.
2. **`offers.lead_id` is nullable.** A manual offer simply has none.
3. **`customer_id` and `vehicle_id` are required.** If neither exists yet, `ES01` creates them inline via `VH10` (kenteken lookup). Foreign vehicles with no Dutch plate fall back to a free-text registration field.

### Revisions

Editing a **sent** offer never overwrites it. It creates version 2 and marks version 1 `superseded`. The customer's old link shows "this quotation has been replaced" and points at the current one. Two extra columns, and it removes an entire category of dispute.

---

## 5. Booking, tasks and capacity

### 5.1 End-user visit request

Public page `/afspraak`, three steps, no account:

1. **What** — damage inspection · drop-off for repair · collection · quick assessment
2. **When** — free slots computed as *opening hours − existing appointments − blackouts − resource capacity*
3. **Who** — kenteken (RDW lookup fills make/model), name, phone, email

Result: a `lead` **and** an `appointment`, linked.

**Confirmation policy differs by type, and this matters:**

| Type | Behaviour | Why |
|---|---|---|
| `inspection` | **auto-confirmed** if the slot is free | Costs the shop 20 minutes; friction here loses customers |
| `drop_off` | **requested** — staff confirm | Depends on parts arriving and bay availability |
| `collection` | requested | Depends on the job actually being ready |
| `repair_slot` | staff-only | Never customer-bookable |

Statuses: `requested → confirmed → completed` / `no_show` / `cancelled`.

Auto-confirming a drop-off is how a shop ends up with a car in the yard and no bumper on the shelf. Don't.

### 5.2 Availability

Opening hours live in `settings` as a weekday map with per-type slot durations. `blackouts` covers holidays, closures and single-resource downtime (booth maintenance).

Slot generation is one server function: walk the opening window in slot-length steps, subtract booked appointments and blackouts, check `resources.capacity` for the type, return what's left. No scheduling library, no external calendar dependency.

### 5.3 Tasks — planned vs actual

`job_tasks` turns a job from a status into a plan. Tasks are generated from the offer lines on approval — one task per labour line, pre-assigned to a stage — then adjusted by the planner.

Each task carries `planned_hours` against `actual_hours`, and `planned_start/end` against `actual_start/end`. A technician marks `in_progress` and `done` from the mobile screen; the timestamps write themselves.

That single table produces everything asked for:

- **ongoing** — `status = in_progress`
- **upcoming** — `status = todo` and `planned_start` in the future
- **done** — `status = done`, with actual vs planned

### 5.4 The views

| View | Shows |
|---|---|
| **Timesheet** (`TS10`) | Rows = technicians, columns = days/hours. Each block a task, coloured by job. Drag to reassign or reschedule. The planner's main screen. |
| **My tasks** (`TS05`) | One technician, mobile. Today, next, done. Big touch targets. |
| **Workload** (`TS20`) | Per technician: assigned hours vs available hours, this week and next. Where overload is visible before it becomes a late delivery. |
| **Appointment calendar** (`AP05`) | Day/week, all types, colour-coded. Pending requests flagged. |
| **Dashboard** (`RP01`) | Today: jobs by stage · appointments · tasks ongoing/upcoming/done · blocking parts · offers awaiting approval · overdue invoices |

Deliberately **not** built: clock-on/clock-off per operation with a running timer, and efficiency-versus-norm reporting. Task start/stop timestamps give the same answer to 90% of the questions, at a fraction of the build and without asking technicians to punch a clock.

---

## 6. Official documents

Yes — and they need their own engine rather than a PDF button on each screen. Five document types share one lifecycle, one number-range mechanism, one archive and one renderer.

### 6.1 The types

| Type | NL | Number | Created at | Signed |
|---|---|---|---|---|
| `offer` | Offerte | `OFF-2026-00123` | Quoting | Approved online (`ES20`) or on paper |
| `repair_order` | Reparatieopdracht | `OPD-2026-00842` | Drop-off | **Yes — on tablet** |
| `handover` | Afleverbon | `AFL-2026-00842` | Collection | **Yes — on tablet** |
| `invoice` | Factuur | `FAC-2026-00456` | Job ready | No |
| `credit_note` | Creditfactuur | `CRE-2026-00012` | Correction | No |

The two the original plan was missing are `repair_order` and `handover`. Both matter more than they look:

- **Repair order** is the shop's authority to work on the vehicle, and its record of what condition the car arrived in. Without a signed one, "that scratch was already there" is an argument you lose.
- **Handover note** is the record that the customer received the vehicle, in what state, at what mileage, with which keys and accessories, and what warranty applies. It is also where you capture gallery consent, with the customer standing in front of you.

### 6.2 Draft → issued: the rule that makes them official

```
   DRAFT                    ISSUED                     SIGNED
   ─────                    ──────                     ──────
   editable                 number assigned            signature captured
   no number                content frozen             name + timestamp + IP
   "CONCEPT" watermark      PDF rendered & stored      PDF re-stored with signature
   deletable                immutable                  immutable
                                 │
                                 └──► CANCELLED (never deleted)
                                      invoices cancel via credit note
```

**The principle that carries the whole module: a document is a snapshot, not a view.**

Never regenerate a PDF from live data. When a document is issued, freeze everything that appears on it into `payload jsonb` — company details, VAT number, rates, line items, terms text, customer address — and render the PDF once. Store it, hash it, and serve that file forever.

Otherwise an invoice printed today looks different next year because the hourly rate changed or the company moved. That is exactly the failure that turns a routine audit into a bad week.

### 6.3 Numbering

Per-type sequences configured in `SY05`, gapless within a year, reset annually with the year in the prefix. Allocation happens **in a transaction at issue time**, never at draft creation — otherwise abandoned drafts punch holes in your invoice sequence, which a Dutch accountant will ask about.

### 6.4 Document flow

Every document links to the next, so any one of them opens the whole chain:

```
Offer OFF-…00123 ──► Job 2026-00842 ──► Repair order OPD-…00842
                            │
                            ├──► Supplement OFF-…00131
                            │
                            ├──► Handover AFL-…00842
                            │
                            └──► Invoice FAC-…00456 ──► Credit note CRE-…00012
```

`documents.supersedes_id` handles revisions: offer v2 supersedes v1, credit note supersedes invoice. Nothing is ever edited after issue and nothing is ever deleted.

### 6.5 What goes on each

**Repair order** — vehicle + kenteken, mileage in, fuel level, existing damage noted at intake, agreed work referencing the offer number, agreed completion date, replacement-vehicle note, terms acceptance, customer signature.

**Handover note** — work performed summary, parts replaced, mileage out, fuel level, keys and accessories returned, warranty statement, any remaining or deferred items, gallery-photo consent, customer signature, date and time.

**Invoice** — NL fiscal requirements: sequential number, issue date, supplier name/address/KvK/BTW number, customer name and address, description of services, net amount, VAT rate and amount, gross total, payment terms. **Body stays in Dutch** even for EN/TR customers; add a translated courtesy summary above the invoice block rather than translating the document itself.

### 6.6 Storage and retention

`documents/{year}/{type}/{number}.pdf` in Supabase Storage, private bucket, served through signed URLs only. `pdf_sha256` stored at issue so any later tampering is detectable.

Dutch fiscal retention is **7 years** for this kind of record — build the archive assuming nothing is ever purged, and make the yearly export (all PDFs plus a CSV index) a one-click action for the accountant.

### 6.7 Signature capture

Canvas signature on the tablet at drop-off and collection, stored as a PNG alongside the document, with the signer's typed name, timestamp and IP. The signed PDF is re-rendered once with the signature embedded, then frozen.

This is `DO20`, and it runs on the same tablet as `JB20`. If the shop is already holding a tablet at the car, capturing the signature there costs nothing extra and removes the paper folder entirely.

---

## 7. BTW and bookkeeping

*Verified against belastingdienst.nl, August 2026. This is a design specification, not tax advice — the shop's accountant signs off on the numbers, always.*

### 7.1 The good news: a bodyshop's VAT is simple

Car repair — labour **and** parts — is **21%** in full. The 9% list covers bicycle, footwear, leather, clothing and linen repair; **car repair is not on it**, and there is no labour/parts split. That means almost every sales line lands in one box, which makes this module far smaller than a general bookkeeping package.

Only five boxes see real traffic in a garage:

| Box | Official label | Garage reality |
|---|---|---|
| **1a** | Leveringen/diensten belast met hoog tarief | Every normal repair invoice — customers, insurers, lease companies |
| **1e** | Leveringen/diensten belast met 0% of niet bij u belast | **Scrap sales** — see the trap below |
| **3b** | Leveringen naar of diensten in landen binnen de EU | Repair for a Belgian or German business customer |
| **4b** / **5b** | Leveringen/diensten uit landen binnen de EU / Voorbelasting | Parts bought from an EU supplier on your NL VAT number — net nil, but must appear in both |
| **1d** | Privégebruik | Year-end correction on company, demo and loaner cars |

**The scrap trap.** Selling scrap metal, wrecked panels, old batteries or catalytic converters to a Dutch scrap dealer falls under the reverse charge for *afval en oude materialen*. The garage reports the turnover in **1e** and charges no VAT. Every bodyshop does this and it is routinely booked wrong.

**The opposite trap.** Subcontracting spray work, panel work or ADAS calibration to another Dutch garage is **21% normally** — the *verleggingsregeling* for onderaanneming is limited to *bouw, scheepsbouw, schoonmaakbedrijven en hoveniers*. Automotive is not in it. Applying reverse charge there is an error.

### 7.2 The hard constraint: you cannot compute box 5b from sales data

Colourking knows what the shop *invoiced*. It knows nothing about what the shop *bought* — parts, paint, energy, rent, tools, subcontractors. Without that, **voorbelasting (5b) cannot be computed**, and a VAT return without 5b is not a VAT return.

So a purchase register is not optional. `PU01` is deliberately minimal — supplier, date, invoice number, net, VAT rate, VAT amount, tax code, deductible percentage, photo of the invoice — entered in about twenty seconds, or captured by forwarding the supplier's email to `inkoop@` and confirming the parsed values.

This is the honest cost of the BTW module: **it makes Colourking a light bookkeeping system, not just an operations system.** If that isn't wanted, the alternative is a 3-day "output VAT only" scope (§7.7) where the accountant supplies 5b.

### 7.3 Tax codes on every line

One `tax_code` on every sales line, purchase line and document, mapping to a rubriek. Codes live in `settings`, so a rule change is configuration rather than a migration:

| Code | Rate | Rubriek | Use |
|---|---|---|---|
| `H21` | 21% | 1a | Standard repair |
| `L9` | 9% | 1b | Reserved, unused in practice |
| `VRL-AFV` | 0% | 1e | Scrap and old materials, reverse charged |
| `EU-DST` | 0% | 3b | Service to an EU business |
| `EU-INK` | 21% | 4b + 5b | EU purchase, acquisition VAT |
| `NON-EU` | — | 4a + 5b | Import |
| `PRIV` | 21% | 1d | Private use correction |
| `GEEN` | — | — | Out of scope |

Default `H21` everywhere. The shop only ever thinks about a code when something unusual happens — which is the point.

### 7.4 Screens

**`BW05` BTW dashboard.** The running position of the current quarter: output VAT so far, input VAT so far, net payable, days to the deadline, and any lines with a missing or suspicious code. Answers the question every owner actually asks — *"roughly what will I owe?"* — without opening a declaration.

**`BW10` Aangifte workbench.** The rubriek grid for a chosen period, every box drillable down to the invoices behind it. Four states:

```
OPEN  ──► DRAFT ──► FILED ──► (CORRECTED)
          │          │
   recomputed on     period locked
   every change      no back-dated edits
```

**Locking is the part that matters.** Once Q2 is filed, an invoice dated in Q2 must become uneditable. Without a period lock the declared figures and the ledger silently diverge, and you find out during an audit.

Filing produces: the rubriek summary, an export for the accountant, and a screen laid out to match Mijn Belastingdienst Zakelijk box for box, so the numbers are typed once with no translation.

**`BW11` Nihilaangifte.** A nil return is the same return with zeros — the feature is not the form, it is knowing it is due. Registration, not activity, triggers the obligation: *"als ondernemer voor de btw moet u altijd btw-aangifte doen, ook als u in de periode van de aangifte geen btw in rekening hebt gebracht."* Skip it and you get a €82 fine plus an estimated assessment. One button, plus the reminder in §7.6.

**`BW20` BTW reports.** Per period, per rubriek, per tax code, per rate. Sales ledger and purchase ledger with drill-down to the document. Year overview across four quarters. Everything exportable for the accountant.

**`BW25` Suppletie.** Encodes the two rules:

- **≤ €1,000** wrong in a filed period → fold into the next return, no form.
- **> €1,000** → a separate suppletie, and since 1 January 2025 there is a hard **8-week window from becoming aware of the error**.

The system knows when a locked period's underlying data changed, so it can raise the flag itself rather than waiting for someone to notice.

**`BW30` ICP-opgaaf.** Only appears if `EU-DST` or intra-EU goods lines exist. Per-customer VAT number listing. No supplies means no filing — unlike the VAT return, there is no ICP nil obligation. Services have no threshold; goods move from quarterly to monthly above €50,000 per quarter.

**`BW40` Quick calc.** A counter utility, half a day of work, used daily: incl ↔ excl at 21% and 9%, VAT on an amount, margin from cost and sell. Reachable from `Cmd-K` anywhere.

**`BW50` BTW assistent (AI).** Deliberately scoped, because this is the one place where a confident wrong answer costs real money.

**What it does:** explains what each rubriek means in plain NL/EN/TR. Compares this quarter against the last four and flags what changed — *"1a is 40% below the four-quarter average"*, *"no scrap sales booked this quarter, unusual for this shop"*, *"three purchase invoices have no tax code"*. Spots the known garage errors: reverse charge applied to a domestic subcontractor, an EU purchase in 4b with no matching 5b, a missing year-end private-use correction. Drafts the question to send the accountant.

**What it never does:** file anything, state a legal position as fact, or replace the accountant. Every output carries the period it examined and the assumption it made, and the accountant's sign-off remains a required step before `BW10` moves to `FILED`.

### 7.5 Filing: prepare, don't submit

Direct submission to the Belastingdienst is possible — every Dutch bookkeeping SaaS does it — but it is a compliance workstream, not a feature:

- a **PKIoverheid *services* servercertificaat** issued to your company against its KvK number, with in-person identity verification
- an **SBR/XBRL** implementation of the Nederlandse Taxonomie OB and ICP entrypoints, **maintained per tax year**
- **Digipoort** connection and acceptance testing with Logius — note Logius has migrated to a new Digipoort and the submission process reportedly changed for tax year 2026
- per-customer identity verification and a per-submission audit trail

For one garage, that is disproportionate. **v1 prepares; the shop or its accountant files** — through Mijn Belastingdienst Zakelijk (eHerkenning for a BV, DigiD for an eenmanszaak) or via the accountant. `BW10`'s output is built so this is a two-minute transcription, not a reconstruction.

The upgrade path stays open and needs no schema change: `vat_returns.payload` already holds everything an SBR message would carry.

### 7.6 Deadlines, encoded

Quarterly by default. **Filing and payment share the same deadline** — the last day of the month following the quarter — and the payment must have *arrived*.

| Period | Deadline |
|---|---|
| Q1 | 30 April |
| Q2 | 31 July |
| Q3 | 31 October |
| Q4 | 31 January |

Penalties: **€82** for a late or missing return; **3% of the underpaid amount**, minimum €50, maximum €6,709, for late payment. A 7-day grace period applies only if the previous return was paid in full and on time. Non-filing triggers an estimated assessment, deliberately set high.

Reminders fire at **T-14, T-7, T-2 days** and again on the deadline if the return is not `FILED`, by email and on `RP01`. A return also cannot be transmitted before the 24th of the last month of its period — worth surfacing so nobody tries.

One more, easy to forget: the **last return of the year** carries the private-use correction on company and loaner cars (1d) and any BUA correction. `BW10` prompts for it in Q4 only.

### 7.7 Two scopes — pick one

| | **Minimal — 4 days** | **Full — 16 days** |
|---|---|---|
| Tax codes on all lines | ✓ | ✓ |
| Output VAT report per rubriek | ✓ | ✓ |
| `BW40` quick calc | ✓ | ✓ |
| Purchase register (`PU01`) | ✗ — accountant supplies 5b | ✓ |
| `BW10` full declaration + period lock | ✗ | ✓ |
| `BW11` nihilaangifte | ✗ | ✓ |
| `BW20` reports, `BW25` suppletie, `BW30` ICP | ✗ | ✓ |
| `BW50` AI assistant | ✗ | ✓ |

Minimal is the right answer if the shop has a working relationship with an accountant and no appetite to move bookkeeping in-house. Full is the right answer if the owner is currently doing the quarter in a spreadsheet — which, given they asked for this, is the likely case.

---

## 8. Screens

Adds three modules to the register in the v1.1 addendum:

| Code | Screen |
|---|---|
| `AP01` | Create appointment |
| `AP02` `AP03` | Change / display appointment |
| `AP05` | **Appointment calendar** (day/week) |
| `AP10` | Confirm pending requests |
| `AP20` | **Public booking page** — `/afspraak` |
| `TS01` | Create task |
| `TS05` | **My tasks** (technician, mobile) |
| `TS10` | **Timesheet / planner** (staff × time) |
| `TS20` | **Workload & availability** |
| `SY06` | Opening hours, resources, blackouts |
| `DO03` | Display document (any type) |
| `DO05` | **Document archive** — filter by type, period, customer |
| `DO10` | **Issue** — draft → issued, allocates the number |
| `DO11` | Cancel / credit |
| `DO12` | Document flow view (the chain in §6.4) |
| `DO20` | **Sign on tablet** — repair order, handover |
| `DO30` | Yearly export for the accountant |
| `SY07` | Document templates — letterhead, terms, per locale |
| `PU01` `PU05` | Purchase invoice entry / register |
| `BW05` | **BTW dashboard** — running position, days to deadline |
| `BW10` | **Aangifte workbench** — rubriek grid, drill-down, period lock |
| `BW11` | Nihilaangifte |
| `BW20` | BTW reports — per period, rubriek, code, rate |
| `BW25` | Suppletie |
| `BW30` | ICP-opgaaf |
| `BW40` | **BTW quick calc** |
| `BW50` | BTW assistent (AI) |
| `SY08` | Tax codes & VAT settings |

Offers keep the `ES` prefix from the addendum (`ES01` create, `ES10` send, `ES11` supplement, `ES20` public approval page).

**Screen count: 40.** The job detail page still carries most of the product.

---

## 9. Domains and deployment

| Host | Serves | Indexed |
|---|---|---|
| `colourking.nl` · `www` | Public site — NL / EN / TR | Yes |
| `colourking.nl/o/[token]` | Offer approval | No |
| `colourking.nl/s/[token]` | Job status + pay | No |
| `colourking.nl/afspraak` | Booking | Yes |
| **`admin.colourking.nl`** | **Staff console — every `XX##` screen** | **No** |
| `admin.colourking.nl/m/[job]` | Mobile capture, shop floor | No |

**Customer-facing pages stay on the main domain.** Links in emails must carry the brand, and the approval page should feel like the website continuing to talk to the customer — not a portal they were dumped into. Only staff cross to `admin.`.

### One app, not two

Single Next.js project, one repo, one deploy. Middleware routes by hostname:

```ts
// middleware.ts
const host = req.headers.get('host') ?? ''
if (host.startsWith('admin.')) {
  // → /app/*  · require session · noindex
} else {
  // → /(public)/*  · locale prefix
}
```

Two Vercel projects would mean duplicated types, components and design tokens, and two deploys to keep in step. Not worth it at this size.

**Required on `admin.`:**

- `X-Robots-Tag: noindex, nofollow` on every response, plus `robots.txt` disallow
- Session required at the middleware layer — never rely on page-level checks alone
- Supabase RLS as the real boundary; the hostname split is convenience, not security
- Both hosts as domains on the same Vercel project; DNS via Cloudflare

---

## 10. Sprints

### Tier 1 — the working chain (45 days)

| # | Sprint | Days | Delivers |
|---|---|---:|---|
| 0 | Foundation | 5 | Repo, Next 14 + TS + Tailwind, Supabase, staff auth, RLS, **hostname routing**, screen-code layer + `Cmd-K`, i18n scaffold |
| 1 | Records | 5 | Customers, vehicles with RDW kenteken lookup + WOK flag, leads inbox |
| 2 | Job + photos | 6 | Job object, 10-stage machine, `job_events`, compressed photo upload, mobile capture screen |
| 3 | **Document engine** | 4 | `documents` table, number ranges, draft→issued→cancelled lifecycle, `payload` snapshot, PDF renderer, letterhead + terms per locale, `DO05` archive |
| 4 | **Offers** | 6 | Offer object, lines, rate settings, VAT, versioning, issue as document, `/o/[token]` approve/reject, manual creation |
| 5 | Parts + board | 4 | Part lines, blocking flag, job board with drag-between-stages |
| 6 | **Repair order + handover** | 3 | Both documents, intake condition capture, `DO20` tablet signature, gallery consent at handover |
| 7 | Invoice + payment | 5 | Invoice + credit note from approved offer and supplements, payment link, paid status, **tax codes on all lines**, `BW40` quick calc |
| 8 | **Appointments** | 5 | Resources, opening hours, blackouts, slot engine, `/afspraak`, `AP05` calendar, confirmation flow |
| 9 | **Tasks & timesheet** | 4 | `job_tasks` generated from offer lines, `TS05` mobile, `TS10` planner, `TS20` workload |

**After sprint 9 the business runs on it**: request → booking → offer → approval → signed repair order → planned work → parts → repair → signed handover → invoice → paid.

Note the ordering: **the document engine comes before offers**, because offers, repair orders, handover notes and invoices are all the same machine. Build it once in sprint 3 and each subsequent document type costs a template rather than a module.

### Tier 2 — completing v1 (23 days)

| # | Sprint | Days | Delivers |
|---|---|---:|---|
| 10 | Website | 7 | 7 public pages, NL copy, gallery loop from delivered jobs (consent + plate blur), quote form, SEO |
| 11 | Communication | 6 | Resend templates per locale, inbound email routing to jobs, `/s/[token]`, review request |
| 12 | Languages | 4 | NL/EN/TR across all three surfaces, locale-aware documents |
| 13 | Reporting + hardening | 6 | Cycle time, workload, conversion by origin, `DO30` yearly export, backups, error tracking, real-data QA in the shop |

**Tier 1 + 2: ~68 days.**

### Tier 3 — BTW & bookkeeping (14 days)

Separated because it is the one block that can be cut entirely without breaking the chain — and because it should be built against a **real closed quarter**, which means after the shop has been live for three months.

| # | Sprint | Days | Delivers |
|---|---|---:|---|
| 14 | Purchase register | 3 | `PU01`/`PU05`, email capture to `inkoop@`, attachments, deductible % |
| 15 | Declaration engine | 5 | Rubriek mapping, `BW05` dashboard, `BW10` workbench, period lock, `BW11` nihilaangifte, deadline reminders |
| 16 | Reports & corrections | 4 | `BW20` reports, `BW25` suppletie with the €1,000 / 8-week rules, `BW30` ICP, accountant export |
| 17 | BTW assistent | 2 | `BW50` — explainer, anomaly flags, common-error checks, question drafting |

**Total with BTW: ~82 days.** The minimal 4-day scope in §7.7 substitutes for sprints 14–17 if the accountant keeps the books.

---

## 11. Deliberately out of scope

| Left out | What the shop does instead | Revisit when |
|---|---|---|
| Audatex / SilverDAT import | Types offer lines manually; insurer jobs calculated in existing tooling | Insurer volume justifies a licence |
| eXchange / Dispatch coupling | Existing system handles steered claims | The one true upgrade path |
| Electronic parts ordering | Orders by phone/portal, records status here | A supplier offers a free coupling |
| Accounting integration (Exact/Moneybird) | Export to the accountant from `BW20` | The accountant asks |
| **Direct BTW filing via SBR/Digipoort** | `BW10` prepares; shop or accountant files | A second shop makes the certificate worth it |
| Full general ledger, P&L, balance sheet | Accountant's job | Never — this is not the product |
| Payroll | Existing provider | Never |
| Clock-on timers per operation | Task start/stop timestamps | Efficiency vs norm becomes a real question |
| Leenauto module | A field on the job | The loan fleet grows |
| Customer login portal | Token links, no passwords | Customers ask (they won't) |
| Multi-tenant / SaaS | Single shop | A second shop commits |
| AI features | — | 200+ completed jobs of real history exist |

Note the last one: **every AI feature in the original concept needs data this system does not have yet.** Build the record first.

---

## 12. Six rules that keep this lean

1. **One spine table.** `jobs` is the product. Every feature request is tested against "does this belong on the job?"
2. **Leads carry no money. Offers carry no workflow.** The lead is a request; the offer is a document; the job is the work. Blurring any two of them is the most expensive mistake available here.
3. **A document is a snapshot, not a view.** Freeze the payload at issue, render once, never regenerate.
4. **Token links instead of accounts.** No customer passwords, no portal auth, no reset flow, no support burden.
5. **`job_events` and `job_tasks` instead of modules.** Activity, audit, cycle time, planning and progress are two tables, not six features.
6. **A filed period is closed.** No back-dated edits after `BW10` locks a quarter. The ledger and the declaration must never be able to diverge.

---

## 13. Decisions needed before sprint 0

1. **Domain.** Confirm `colourking.nl` + `admin.colourking.nl`, and point DNS at Cloudflare. Inbound email routing depends on the MX records.
2. **Numbering.** `OFF-` / `OPD-` / `AFL-` / `FAC-` / `CRE-` with year and sequence are proposed, plus `2026-00842` for jobs. These appear in every email subject, PDF and conversation — changing them later means a migration and a confused shop. Confirm with the shop's accountant, who may already have an invoice series in use that must continue rather than restart.
3. **The ten job stages.** Agree them with the shop *before* building the board. Ten is the ceiling; ask for fourteen and they will stop updating it.
4. **Bookable slot types and durations.** Which visits customers may book directly, and how long each takes. This drives the slot engine and cannot be guessed from outside the shop.
5. **Turkish on the staff console.** If nobody on the floor reads Turkish, drop it from `admin.` and keep it on the public site only.
6. **BTW scope — minimal or full (§7.7).** This turns on one question for the shop: *does the accountant keep the books, or does the owner do the quarter in a spreadsheet?* If the latter, the full scope pays for itself; if the former, build the 4-day version and stop.
7. **Legal form.** BV or eenmanszaak — it decides eHerkenning vs DigiD for filing, and whether the owner can log in to Mijn Belastingdienst Zakelijk at all today.
8. **Terms and conditions.** The repair order and handover note both reference the shop's algemene voorwaarden and warranty terms. Get the actual text from the shop — these are legal wording, not placeholder copy, and they belong in `SY07` versioned per locale so an issued document always shows the terms that applied on its issue date.
