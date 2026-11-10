# Plan — enforce the VAT period lock (BW05 / spec §14)

Status: **built, not applied** · 2026-11-08 · Sunay approved the recommended choices: reject backdated
issues into a locked period; B1–B3 in the same change; B4 and B5 stay separate.
Migration `0071_vat_period_lock.sql` is written but not yet run against any database.

## 1. Problem

Filing a VAT return (BW05) sets `vat_returns.locked = true`, but only the return row is protected.
Invoices, invoice lines and purchases dated inside a filed period can still be created, issued,
edited or deleted, so the books drift away from what was filed. This breaks CLAUDE.md hard rule 4 and spec §14.

Evidence (code read, not executed):

| Path | Gap |
|---|---|
| `src/modules/invoices/actions.ts` `createInvoice` | accepts any `issued_at`; no lock check |
| `issueInvoice` (l. 351) | keeps the draft's `issued_at` → can issue straight into a filed quarter |
| `src/app/api/invoices/bulk-status` | raw status updates, no lock check |
| `src/modules/purchases/actions.ts` create / update / delete | no guard at all; changes box 5a after filing |
| `supabase/migrations/*` | no trigger on `invoices`, `invoice_lines` or `purchases` referencing `vat_returns` |

## 2. Related bugs found while reading (same area)

| # | Bug | Effect | In this fix? |
|---|---|---|---|
| B1 | `correctVatReturn` inserts a second row for the same period, but `vat_returns` has `UNIQUE(period_type, year, period)` | Corrections always fail → once locked, a period can never be corrected | **Yes** — the lock is unusable without it |
| B2 | `calculateVatReturn` counts only `sent/paid/overdue`; crediting sets the original to `credited` | A credited invoice disappears from its own period *and* the credit note counts in the new one → double reduction on recalculation | **Yes** — and the lock trigger needs `sent→credited` to stay allowed |
| B3 | `getPeriodDateRange` builds boundaries with server-local `Date` (UTC on Vercel) | Invoices issued 00:00–02:00 Amsterdam on the 1st of a quarter fall into the previous quarter | **Yes** — one shared Amsterdam-date rule for calc and lock |
| B4 | `box5a = 0` placeholder; `getDeductibleVat` is never used | Purchases never reduce the VAT payable unless 5a is typed by hand | **No** — separate fix, first check with Sunay/accountant how 5a has been filed so far |
| B5 | `createInvoice` allocates the invoice number at draft creation (spec §17.4 anti-pattern) | Deleted drafts leave gaps in the gapless series | **No** — separate fix |

## 3. Design

**Rule:** a period is locked when a `vat_returns` row for it has `locked = true` (status `filed` or
`corrected`). A correction draft stays unlocked, but the period stays locked: corrections are entered
in the correction return, never by editing past records.

**Date basis (one rule everywhere):**
- invoices → `(issued_at AT TIME ZONE 'Europe/Amsterdam')::date`
- purchases → `invoice_date`

**Enforced in the database**, so every path is covered (server actions, bulk-status, webhooks, future code).
App checks only translate the error.

### Migration `0071_vat_period_lock.sql`
1. `vat_period_locked(d date) returns boolean` — stable SQL function; matches month or quarter rows.
2. Trigger `invoices_vat_lock` (BEFORE INSERT/UPDATE/DELETE). Blocks when the old **or** new date is in a
   locked period **and** the change is VAT-relevant:
   - INSERT/DELETE of a counted invoice (status `sent/paid/overdue/credited`);
   - UPDATE that changes `issued_at`, `subtotal_cents`, `vat_cents`, `total_cents`, `tax_summary`,
     or moves between not-counted (`draft/cancelled`) and counted.
   - Allowed: `sent → paid/overdue/credited`, payment fields, `sent_at`, emails, notes.
3. Trigger `invoice_lines_vat_lock` — blocks insert/update/delete of lines whose invoice is counted and locked.
4. Trigger `purchases_vat_lock` — blocks insert/delete, and updates of `invoice_date`, `subtotal_cents`,
   `vat_cents`, `total_cents`, `tax_code`, when the old or new date is locked. `paid`, `paid_at`,
   `payment_method` stay editable.
5. Error: `RAISE EXCEPTION 'VAT_PERIOD_LOCKED' USING DETAIL = '<year>-Q<n>'`.
6. B1: replace `UNIQUE(period_type, year, period)` with a partial unique index
   `WHERE status <> 'corrected'` (one live return per period, history kept).

No new tables, no state-machine changes. Regenerate `src/types/database.ts` in the same commit.

### App changes
- `src/modules/vat/actions.ts`: B2 (count `credited`), B3 (Amsterdam boundaries).
- Small helper `src/lib/vat-period.ts`: `periodOf(date)`, `isLockedError(e)`.
- API routes for invoices (incl. issue, lines, credit-note, bulk-status) and purchases:
  map `VAT_PERIOD_LOCKED` → HTTP 409.
- FA01 / FA10 / PU01 / PU05: show the 409 as a translated message
  ("Periode Q3 2026 is ingediend en vergrendeld — boek dit in de huidige periode of corrigeer via BW05").
  New keys in nl / en / tr.
- Optional: lock badge on purchase and invoice rows dated in a locked period.

### Tests (vitest)
- `periodOf` incl. quarter boundaries at 00:30 Amsterdam time (B3).
- `calculateVatReturn` aggregation includes credited originals (B2).
- `isLockedError` mapping.
- Triggers are SQL; verify manually (section 5).

## 4. Decisions for Sunay

1. **Backdated invoices into a locked period:** reject with the message above (recommended), or
   silently re-date to today on issue?
2. Fix **B1–B3 in the same PR** (recommended), or the lock only?
3. **B4 (box 5a):** how has deductible VAT been filed so far: typed by hand in BW05, or by the accountant?
   That decides whether B4 is urgent.

## 5. Rollout and verification

- Colourking has a single Supabase project (production). Test the migration first on a local
  `supabase start` or a Supabase branch, not on production.
- Before applying: list existing `vat_returns` rows with `locked = true`. The trigger affects only those periods.
- Checks: file a test quarter → creating, issuing, deleting or editing a purchase dated in it gets a 409;
  recording a payment still works; crediting an invoice from that quarter works, and the credit note lands in the current period.
- `pnpm typecheck && pnpm lint && pnpm test`.
- Applying the migration to production and merging are Sunay's call.
