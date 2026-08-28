# INS Module — Codebase Conventions (F0)

## 1. Placeholder name resolution

| Plan placeholder | Actual ColourKing name | Notes |
|---|---|---|
| `voertuigen` | `vehicles` | English table names |
| `klanten` | `customers` | |
| `opdrachten` | `jobs` | |
| `ck_users` | `staff` | References `auth.users(id)` via FK |
| `ck_has_role()` | **Does not exist** | Use inline: `auth.uid() in (select s.id from staff s where s.active)` |
| `ins_rate_card` | **Skip** — reuse `labour_rates` (SY45) | Already has kind/payer_type/tax_code/unit_price_cents |

## 2. Auth & session

- **Client**: `getSession()` from `src/lib/auth.ts` → `{id, email, name, role}`
- **Server (RLS-respecting)**: `createClient()` from `src/lib/supabase/server.ts`
- **Server (bypass RLS)**: `createServiceClient()` or `admin` proxy from `src/lib/supabase/admin.ts`
- **API routes**: call `createClient()` directly, no shared middleware

## 3. RLS pattern

No helper function. All policies use inline subqueries:
```sql
-- Staff read:
auth.uid() in (select s.id from staff s where s.active)
-- Admin-only:
exists (select 1 from staff s where s.id = auth.uid() and s.active and s.role = 'admin')
-- Anon insert (public endpoints):
with check (true)
```

## 4. State machine pattern

Mirror `src/modules/offers/machine.ts`:
```ts
type Transition = { from: Status; to: Status; guard?: string }
const TRANSITIONS: Transition[] = [...]
const TERMINAL: Status[] = [...]
export function canTransition(from, to): boolean
export function allowedTransitions(from): Status[]
export function isTerminal(status): boolean
```

## 5. Migration naming

Sequential 4-digit prefix: `0043_ins_catalog.sql`, `0044_ins_inspections.sql`, etc.

## 6. Storage buckets

- Convention: bucket per entity (`lead-photos`, `job-photos`)
- INS uses: `ins-originals` (write-once), `ins-derivatives` (thumb/report)
- Upload pattern: `FormData` → `Buffer` → `supabase.storage.from(bucket).upload(path, buffer)`
- Path: `{inspectionId}/{photoId}.webp`
- Serve via signed URLs (private buckets)

## 7. i18n

- Namespace per module in `src/messages/{nl,en,tr}.json`
- INS namespace: `"ins"` with camelCase keys
- All UI strings through `useTranslations('ins')`
- Description fields: stored in Dutch, auto-translatable

## 8. Server actions vs API routes

- **Server actions** (`'use server'`): CRUD operations, state transitions → `src/modules/inspectie/actions.ts`
- **API routes**: file uploads (FormData), public endpoints (remote signing) → `src/app/api/inspections/`

## 9. Existing reusable code

| What | Where | Reuse how |
|---|---|---|
| Kenteken + VIN on vehicles | `vehicles.kenteken`, `vehicles.vin` | FK from ins_inspections |
| RDW lookup | `src/app/api/rdw/route.ts` | Call from step 01 |
| Photo upload pattern | `src/app/api/jobs/[id]/photos/route.ts` | Mirror for INS photos |
| Signature canvas + storage | `signatures` table + base64 data URI | Same pattern for ins_approvals |
| Status machine | `src/modules/*/machine.ts` | New `src/modules/inspectie/machine.ts` |
| Screen badge | `<ScreenBadge code="IN10" />` | Register in `src/lib/codes.ts` |

## 10. Conflicts & decisions

| Plan says | Codebase does | Decision |
|---|---|---|
| `ins_rate_card` table | `labour_rates` exists | **Adapt plan**: skip ins_rate_card, use labour_rates |
| Playwright PDF | React server-rendered templates | **Adapt plan**: use React PDF like invoices |
| Dutch-only strings | next-intl with 3 locales | **Adapt plan**: all strings through i18n |
| `ck_has_role()` helper | Inline RLS subqueries | **Adapt plan**: use inline pattern |
| Column-level REVOKE | Not used elsewhere | **Keep from plan**: valuable security for lock integrity |
| `ins.transition` session var | Not used elsewhere | **Keep from plan**: clean guard bypass pattern |
| Money in numeric(10,2) | Money in integer cents | **Adapt plan**: indicative_total_cents as integer |

## 11. Screen registration

One working-flow screen (like offerte):
- `IN10`: Inspectie (capture + edit + report — single screen with step rail)

## 12. File structure (adapted)

```
supabase/migrations/
  0043_ins_catalog.sql
  0044_ins_inspections.sql
  0045_ins_approval.sql
  0046_ins_guards.sql
  0047_ins_rls.sql
  0048_ins_seed.sql

src/modules/inspectie/
  types.ts
  machine.ts
  checklist.ts
  suggest-hours.ts
  actions.ts
  queries.ts

src/app/(admin)/app/inspecties/
  page.tsx              — list + create
  [id]/page.tsx         — 7-step capture flow
  [id]/rapport/page.tsx — report view

src/app/(public)/[locale]/opname/
  [token]/page.tsx      — remote customer signing

src/app/api/inspections/
  route.ts              — CRUD
  [id]/photos/route.ts  — photo upload
  [id]/transition/route.ts
  share/route.ts        — token-based read/sign RPCs
```
