# Email Sender Identities + Automated Reminders — Implementation Plan

Status: proposal (2026-09-26)
Owner: Sunay
Scope: SY01 new "E-mail" tab, per-process sender identities, cron-driven reminder emails, reminder log screen.

---

## 0. Current state (verified in code)

| Area | Fact | Where |
|---|---|---|
| Transport | nodemailer over Zoho SMTP. Resend is **not** used for sending (only a connectivity check). | `src/modules/email/sender.ts:31-48` |
| From address | Single global `EMAIL_FROM ?? 'Colourking <sales@colourking.nl>'`. No caller passes `options.from`. | `sender.ts:39`, `triggers.ts` |
| Reply-to | `EMAIL_REPLY_TO ?? 'info@colourking.nl'` | `sender.ts:43` |
| Templates | offerSent, invoiceSent, appointmentConfirmed, paymentReceived, leadReceived, repairOrderReady, **appointmentReminder (exists, never called)** | `src/modules/email/templates.ts`, `schema.ts:3-11` |
| Triggers | Fired from state transitions in `modules/*/actions.ts` | `src/modules/email/triggers.ts` |
| Logging | Trigger emails go to `notifications` (type `new_email`, title `[SENT] …`). Only lead-thread emails write `email_log` with `direction='outbound'`. | `modules/email/log.ts`, `lead-thread.ts:113-128` |
| Cron | `vercel.json` runs only `db-cleanup` (Sun 02:00) and `imap-poll` (08:00). SY15 shows a **hardcoded mock** list incl. `appointment-reminders` and `overdue-invoices` that don't exist. | `vercel.json`, `app/cron-jobs/page.tsx:26+` |
| Cron auth | `db-cleanup` skips auth entirely when `CRON_SECRET` is unset (fail-open). | `api/cron/db-cleanup/route.ts:7-11` |
| Overdue | `sent→overdue` transition exists but nothing runs it automatically. | `modules/invoices/actions.ts:536`, `machine.ts:12-15` |
| Settings | `settings(key text pk, value jsonb)`. Keys: company, rates, numbering, vat, ai, certifications, analytics_excluded_ips, email_poll_state. Admin-only write via RLS. | `0003_staff_settings.sql`, `0004` |
| Settings page | Tabs: company, appearance, general, notifications. Company tab loads/saves via `/api/settings/company`. | `app/instellingen/page.tsx:10,77-113` |
| Locale | `customers.locale` (nl/en/tr) drives email language; templates carry their own nl/en/tr `STRINGS` (not next-intl). | `triggers.ts:19-22`, `templates.ts:37-250` |

### Bugs found that this work should fix

1. Offer email "Approve/Reject" links → `/offerte/{id}/approve` — route does not exist (`triggers.ts:62-63`).
2. Appointment email "Cancel" link → `/afspraak/{id}/cancel` — route does not exist (`triggers.ts:188`).
3. `onRepairComplete` finds the customer via `offers.job_id` instead of `jobs.customer_id`, uses `jobId.slice(0,8)` as the job number, and fires on `delivered` instead of `ready` (`triggers.ts:382-386`).
4. `/api/settings/company` PUT has no auth/role check (`api/settings/company/route.ts:19`).
5. `db-cleanup` cron is fail-open without `CRON_SECRET`.

---

## 1. Answers to the design questions

**Which processes email the customer, and which sender should each use?**

| Process | Existing email(s) | New reminder(s) | Sender identity (purpose key) | Suggested address |
|---|---|---|---|---|
| Offers (ES) | offerSent | offerExpiring | `offers` | `offerte@colourking.nl` |
| Invoices (FA) | invoiceSent, paymentReceived | invoiceDueSoon, invoiceOverdue | `invoices` | `facturatie@colourking.nl` |
| Appointments (AP) | appointmentConfirmed, appointmentRequest | appointmentReminder | `appointments` | `planning@colourking.nl` |
| Workshop / jobs (JB) | repairOrderReady | vehicleReady (on `ready`) | `workshop` | `werkplaats@colourking.nl` |
| Leads (LD) + public forms | leadReceived (staff), lead thread replies | — | `leads` | `info@colourking.nl` |
| Fallback | everything else | — | `default` | `EMAIL_FROM` env |

Each identity has `from_name`, `from_email`, `reply_to`, `enabled`. If a purpose is disabled or empty it falls back to `default`, then to the env var — so nothing breaks before the tab is configured.

**Infra prerequisite (Zoho):** the SMTP account (`SMTP_USER`) must be allowed to send *as* each address. In Zoho Mail: Settings → Mail Accounts → "Send mail as" (alias) or make them group/shared addresses that `SMTP_USER` is a member of. If an address is not authorised Zoho rejects with `553 Relaying disallowed`. SPF/DKIM/DMARC already cover the domain, so aliases need no DNS change. The "Send test" button in the new tab surfaces this error immediately.

**Where is it configured?** A new **SY01 → "E-mail" tab** (`tab === 'email'`) holding two sections: *Afzenders* (sender identities) and *Herinneringen* (reminder rules). A separate list screen **SY60 "Herinneringen log"** shows what was sent, to whom, when, with a resend action. Two screens, not one, because settings are admin-only writes while the log is useful for office staff.

---

## 2. Data model

### 2.1 `settings` keys (no schema change)

`email_identities`
```json
{
  "default":      { "from_name": "Colourking", "from_email": "sales@colourking.nl",      "reply_to": "info@colourking.nl", "enabled": true },
  "offers":       { "from_name": "Colourking Offertes",   "from_email": "offerte@colourking.nl",    "reply_to": "", "enabled": true },
  "invoices":     { "from_name": "Colourking Facturatie", "from_email": "facturatie@colourking.nl", "reply_to": "", "enabled": true },
  "appointments": { "from_name": "Colourking Planning",   "from_email": "planning@colourking.nl",   "reply_to": "", "enabled": true },
  "workshop":     { "from_name": "Colourking Werkplaats", "from_email": "werkplaats@colourking.nl", "reply_to": "", "enabled": true },
  "leads":        { "from_name": "Colourking",            "from_email": "info@colourking.nl",       "reply_to": "", "enabled": true }
}
```

`reminders`
```json
{
  "invoice_due_soon":     { "enabled": true, "days_before": 3,  "sender": "invoices" },
  "invoice_overdue":      { "enabled": true, "days_after": [0, 7, 14], "auto_mark_overdue": true, "sender": "invoices" },
  "offer_expiring":       { "enabled": true, "days_before": 3,  "sender": "offers" },
  "appointment_reminder": { "enabled": true, "days_before": 1,  "sender": "appointments" },
  "vehicle_ready":        { "enabled": true, "sender": "workshop" },
  "send_window":          { "hour_local": 9, "timezone": "Europe/Amsterdam" },
  "max_per_run": 200
}
```

### 2.2 New table `reminder_log` (migration `0062_reminder_log.sql`)

> CLAUDE.md: adding a table outside the plan needs sign-off. This is the one new table in this work; the alternative (stuffing rows into `notifications`) has no uniqueness guarantee and would make double-sends possible. **Please confirm before I write the migration.**

```sql
create type reminder_kind as enum (
  'invoice_due_soon','invoice_overdue','offer_expiring','appointment_reminder','vehicle_ready'
);

create table reminder_log (
  id            uuid primary key default gen_random_uuid(),
  kind          reminder_kind not null,
  entity_type   text not null,          -- 'invoice' | 'offer' | 'appointment' | 'job'
  entity_id     uuid not null,
  stage         text not null,          -- 'T-3', 'T-1', 'overdue-0', 'overdue-7', 'ready'
  recipient     text not null,
  locale        text not null default 'nl',
  status        text not null check (status in ('sent','skipped','failed')),
  message_id    text,
  error         text,
  sent_by       uuid references staff(id),   -- null = cron
  created_at    timestamptz not null default now(),
  unique (kind, entity_id, stage)        -- idempotency: one email per entity per stage
);
create index reminder_log_entity_idx on reminder_log(entity_type, entity_id);
create index reminder_log_created_idx on reminder_log(created_at desc);

alter table reminder_log enable row level security;
create policy reminder_log_staff_select on reminder_log for select using (is_active_staff());
-- inserts only via service role (cron) — no insert policy for authenticated
```

Regenerate `src/types/database.ts` in the same commit.

### 2.3 Optional (phase 4): `offers.approval_token`

To make the offer email's Approve/Reject buttons real, offers need a public token like invoices have (`payment_token`). Migration `0063_offer_approval_token.sql` + public route `/s/offer/[token]` + `POST /api/public/offer/[token]` `{action: approve|reject, name, reason?}` reusing `approveOffer`/`rejectOffer` from `modules/offers/actions.ts`. This is a separate decision; the reminder emails can link to the public offer page once it exists, and to `/contact` until then.

---

## 3. Code changes

### 3.1 Sender identities

**`src/lib/email-identity.ts`** (new)
```ts
export type EmailPurpose = 'default'|'offers'|'invoices'|'appointments'|'workshop'|'leads';
export type EmailIdentity = { from_name: string; from_email: string; reply_to: string; enabled: boolean };
export async function getSender(purpose: EmailPurpose): Promise<{ from: string; replyTo?: string }>
// reads settings.email_identities (60s cache like company.ts), falls back purpose → default → env
export function invalidateIdentityCache(): void
```

**`src/modules/email/triggers.ts`** — every `sendEmail(...)` call gets `{ ...(await getSender('<purpose>')) }` in options:
- `onOfferSent` → offers; `onInvoiceIssued`, `onPaymentReceived` → invoices; `onAppointmentConfirmed`, appointment request → appointments; `onRepairComplete` → workshop; `onLeadCreated` → leads.

**`src/modules/email/lead-thread.ts:112`** — replace hardcoded `fromEmail` with `getSender('leads')`.

**`src/app/api/email/send/route.ts`** — accept optional `purpose` in the body.

**`src/app/api/settings/email/route.ts`** (new) — GET returns `{ identities, reminders }`; PUT validates with zod (`EmailIdentitySchema`, `RemindersSchema` in `src/modules/email/schema.ts`), whitelists keys, upserts both settings rows via service client, calls `invalidateIdentityCache()`. **Admin role required** (and apply the same guard to `settings/company` PUT while there).

**`src/app/api/settings/email/test/route.ts`** (new) — POST `{ purpose, to }`: sends a one-line test mail via `getSender(purpose)`; returns `{success, messageId|error}`. This is how the user verifies the Zoho alias is authorised.

**Outbound logging** — extend `modules/email/log.ts` so trigger emails also insert into `email_log` with `direction='outbound'`, `entity_type`, `entity_id`, `from_email`, `to_email`, `message_id`. Keeps the existing notification row. Result: SY25 email monitor shows both directions.

### 3.2 Reminder engine

**`src/modules/reminders/`** (new module)
```
evaluators.ts   pure functions: (rows, today, config) → Candidate[]  — unit-testable, no I/O
run.ts          runReminders({ dryRun, kinds?, limit }) → RunReport
recipients.ts   resolveRecipient(entity) → { email, locale, name } | null
schema.ts       zod for settings.reminders + RunReport
```

Candidate = `{ kind, entity_type, entity_id, stage, recipient, locale, templateData }`.

Evaluator rules (all dates in `Europe/Amsterdam`, "today" = local date of the run):

| kind | Selects | Stage | Template | Link |
|---|---|---|---|---|
| invoice_due_soon | `status='sent'` and `due_date = today + days_before` | `T-{n}` | `invoiceDueSoon` (new) | `/s/{payment_token}` |
| invoice_overdue | `status in ('sent','overdue')` and `due_date + d = today` for each d in `days_after` | `overdue-{d}` | `invoiceOverdue` (new) | `/s/{payment_token}` |
| offer_expiring | `status='sent'` and `valid_until = today + days_before` | `T-{n}` | `offerExpiring` (new) | public offer page (phase 4) or `/contact` |
| appointment_reminder | `status='confirmed'` and `scheduled_date = today + days_before` | `T-{n}` | `appointmentReminder` (exists) | `/afspraak` |
| vehicle_ready | `stage='ready'` and no `reminder_log` row for (vehicle_ready, job) | `ready` | `vehicleReady` (renamed from repairOrderReady, fixed) | `/tracking?code=` |

Each run:
1. Load config from `settings.reminders`; skip disabled kinds.
2. Run evaluators → candidates.
3. Drop candidates already in `reminder_log` (unique key) — one query with `in (...)`.
4. Resolve recipient: `customers.email`; for appointments fall back to `contact_email`; skip and log `status='skipped', error='no_email'` if none. Locale = `customers.locale ?? entity.locale ?? 'nl'`.
5. Skip customers with `status in ('blocked','archived')`. Respect `customer_consents` only for `review_request` (these reminders are transactional; not gated by marketing consent).
6. Send via `sendEmail(to, subject, html, await getSender(config[kind].sender))`, cap at `max_per_run`.
7. Insert `reminder_log` row per candidate (`sent`/`failed`/`skipped`). Insert a staff `notifications` row (`type='system'`) with the run summary: "Herinneringen: 12 verzonden, 1 mislukt".
8. `invoice_overdue` with `auto_mark_overdue`: call `markOverdue(id)` for `sent` invoices whose `due_date < today` **before** evaluating, so the state machine transition happens once and is audited via the existing action.
9. `dryRun=true` returns the candidate list without sending or logging.

**`src/app/api/cron/reminders/route.ts`** (new)
- GET+POST, `maxDuration = 300`, `dynamic = 'force-dynamic'`.
- Auth: `Authorization: Bearer ${CRON_SECRET}` — **fail closed** (503 if secret unset). Also accept a staff session with `role='admin'` so the "Run now" button works from SY60.
- Query params: `?dry=1`, `?kind=invoice_overdue`.
- Returns `RunReport` JSON.

**`vercel.json`** — add `{ "path": "/api/cron/reminders", "schedule": "0 7 * * *" }` (07:00 UTC = 09:00 CEST / 08:00 CET). Vercel cron is UTC-only, so the local send hour drifts by one hour across DST; acceptable for a daily job. If exact local time matters, schedule `0 7 * * *` and `0 8 * * *` and let the run exit early when `hour_local` doesn't match — the idempotency key prevents double sends.

**Event-driven `vehicle_ready`**: in `api/jobs/[id]/route.ts` where the stage changes, when `to === 'ready'` call `runReminders({ kinds: ['vehicle_ready'], jobId })` inline so the customer gets the email within seconds; the daily cron only catches misses. The existing `delivered` email becomes a thank-you / review-request (optional, gated by `review_request` consent) or is removed — decide in phase 3.

### 3.3 Templates (`src/modules/email/templates.ts`)

Add `invoiceDueSoon`, `invoiceOverdue`, `offerExpiring`, rename `repairOrderReady` → `vehicleReady`; add nl/en/tr strings to `STRINGS`. Register names in `schema.ts` `TemplateName`. Each reminder subject carries the document number (`[FA-2026-0042]` style) so IMAP replies auto-link in SY25 (matcher already parses `[FA-…]`, `[ES-…]`, `[JB-…]`).

### 3.4 UI

**SY01 – E-mail tab** (`instellingen/page.tsx`)
- `type Tab = 'company' | 'email' | 'appearance' | 'general' | 'notifications'`.
- Section *Afzenders*: one card per purpose (6) with from-name, from-email, reply-to, enabled toggle, and a "Test verzenden" button (prompts for a recipient, calls `/api/settings/email/test`, shows success or the SMTP error).
- Section *Herinneringen*: one row per kind with enabled toggle and the day offsets (number inputs; overdue accepts a comma list), sender dropdown (purposes), send hour, max per run. A "Nu uitvoeren (dry run)" button calls `/api/cron/reminders?dry=1` and lists what *would* be sent.
- Own Save button (same pattern as the Company tab). Loads via GET `/api/settings/email` on mount.

**SY60 – Herinneringen log** (`/app/instellingen/herinneringen`, new)
- Table: date, kind badge, entity link (invoice/offer/appointment/job number), recipient, stage, status, error. Filters: kind, status, date range. Actions: "Opnieuw verzenden" (POST `/api/reminders/[id]/resend`, admin, writes a new log row with stage suffix `-resend-N`), "Nu uitvoeren" (admin → cron route).
- Register in `lib/codes.ts` (`SY60`), `Sidebar.tsx` under System, translations in nl/en/tr (`sy` namespace).

**SY15 – Cron jobs**: replace the mock array with real entries (`db-cleanup`, `imap-poll`, `reminders`) and read last-run info from `reminder_log` / `settings.email_poll_state`. Remove the seven fictional jobs.

**Notifications tab (SY01)**: leave as is; note in the manual that reminder emails are controlled on the E-mail tab, not by these localStorage toggles.

### 3.5 Hardening bundled in

- `settings/company` PUT: add admin check (currently open).
- `db-cleanup`: fail closed when `CRON_SECRET` unset.
- `.env.example`: add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`; drop `RESEND_API_KEY` or mark it unused.
- Fix the dead links (§0 bugs 1–2): until the public offer page exists, point Approve/Reject to `/contact?ref=ES-…` and Cancel to `/contact?ref=AP-…`.

---

## 4. Phases

| Phase | Deliverable | Files | Est. |
|---|---|---|---|
| **1. Sender identities** | `email-identity.ts`, settings API + test route, triggers/lead-thread wired, SY01 E-mail tab (Afzenders section), admin guard on settings PUTs, `.env.example`, outbound `email_log` rows, manual SY01 update | ~10 files | 0.5 day |
| **2. Reminder engine + cron** | migration 0062 + types, `modules/reminders/*`, templates ×3 + rename, cron route (fail-closed), `vercel.json`, unit tests for evaluators | ~12 files | 1 day |
| **3. Reminder UI** | SY01 Herinneringen section, SY60 log screen + resend, SY15 real job list, codes/sidebar/i18n ×3, manual SY60/SY15/SY01 | ~8 files | 0.5 day |
| **4. Public offer approval (optional)** | migration 0063 `approval_token`, `/s/offer/[token]` page, public API, offer emails link to it | ~6 files | 0.5 day |

Phase 1 ships independently. Phase 2 needs the table decision. Phase 4 is the only piece that changes a state-machine entry point (public approve/reject) — flagged per CLAUDE.md "ask before changing a state machine"; it does not add transitions, it exposes existing ones.

---

## 5. Tests

- `src/modules/reminders/evaluators.test.ts`: fixed `today`, rows at boundaries (due today, due in 3 days, due in 4 days, already overdue 7/8 days, cancelled, paid) → expected candidates; idempotency filter drops existing log keys.
- `recipients.test.ts`: customer email vs appointment contact_email fallback, blocked customer skipped, locale resolution.
- API: cron route returns 401 without secret, 503 when secret unset, dry-run sends nothing (mock `sendEmail`).
- Manual: SY01 → E-mail → each purpose "Test verzenden" to your own inbox; confirm From header shows the alias. `curl -H "Authorization: Bearer $CRON_SECRET" https://colourking.nl/api/cron/reminders?dry=1`.

---

## 6. Operational checklist (after merge)

1. Zoho: create/authorise `offerte@`, `facturatie@`, `planning@`, `werkplaats@` as send-as aliases for `SMTP_USER`.
2. Vercel env: set `CRON_SECRET` (currently optional → will become required), confirm `SMTP_*`, `NEXT_PUBLIC_APP_URL=https://colourking.nl`.
3. Run migration 0062 (and 0063 if phase 4).
4. SY01 → E-mail: fill identities, send a test per purpose, set reminder offsets, save.
5. SY60: run a dry run, review candidates, then let the 09:00 cron take over.

---

## 7. Open decisions (need your answer)

1. **Approve `reminder_log` table** (§2.2)?
2. **Overdue cadence**: default `[0, 7, 14]` days after due date, then stop? Or keep going every 14 days?
3. **Vehicle ready vs delivered**: send "your car is ready" at `ready` (proposed) and turn the `delivered` email into a thank-you/review request, or drop the `delivered` email?
4. **Phase 4 public offer approval** now or later?
5. Address names — `offerte@ / facturatie@ / planning@ / werkplaats@` or English (`offer@ / invoice@`)? Customer-facing, so Dutch is proposed.

---

## 8. Decisions taken (2026-09-26) and implementation status

| Question | Decision |
|---|---|
| `reminder_log` table | Approved → `supabase/migrations/0063_reminder_log.sql` |
| Overdue cadence | Due-soon **2 days before** the due date; **one** payment reminder **2 days after**; no repeating chase. Both configurable in SY01 > E-mail. |
| Vehicle ready | Not automatic. Moving a job to `ready` opens a confirm dialog on JB10; the same email can be (re)sent from a button. The old auto-email on `delivered` was removed. |
| Public offer approval (phase 4) | Later. Email buttons point to `/contact?ref=<offer>` for now. |
| Addresses | offers → `offer@`, invoices/payments → `invoice@`, appointments → `planning@`, workshop → `customer@`, leads/default → `info@`. `noreply@`/`sales@` unused. |

Implemented (phases 1–3): sender identities + SY01 E-mail tab + test button; reminder engine (`src/modules/reminders/`), `/api/cron/reminders` (fail-closed auth), Vercel cron `0 7 * * *`; `reminder_log`; SY60 Herinneringen log; SY15 real job list; JB10 dialog; outbound emails now also written to `email_log`; admin guard on settings PUTs; dead approve/cancel links redirected to `/contact`.

Still to do by hand (see §6): Zoho send-as aliases, `CRON_SECRET` in Vercel, run migration 0063, then send a test per identity from SY01.

### Update 2026-09-26 (later): configurable moments
Reminder offsets are no longer whole days with one value per rule. `settings.reminders` now holds per rule `moments: [{ value, unit: 'hours'|'days' }]` (max 2, e.g. appointment 24 h + 2 h before). The engine is time-based (`now ≥ event ∓ offset`, 48 h grace, DST-safe) and idempotent per (kind, entity, stage) so it can run every 15 minutes. Vercel Hobby cron stays daily; for hour-based moments add an external scheduler that POSTs `/api/cron/reminders` every 15 min with `Authorization: Bearer <CRON_SECRET>`, or move to Vercel Pro (`*/15 * * * *`).
