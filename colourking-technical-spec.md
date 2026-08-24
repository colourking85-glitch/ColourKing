# Colourking — Technical Implementation Spec

**For AI-assisted build (Claude Code)** · v1.0 · 24 August 2026
**Companion to** the Lean Implementation Plan v2.2 (scope, objects, sprints) and the v1.1 Addendum (frontend, screen codes, i18n, email)

---

## 1. How to use this document

The plan says *what* to build. This says *how*, in enough detail that an agent produces the same shapes every time instead of re-inventing them each sprint.

Two rules make the difference between an agent that compounds and one that drifts:

1. **The repository is the only source of truth.** Schema, policies, types, config — all in git. Nothing that matters lives in a dashboard.
2. **Every sprint starts by reading this file and `CLAUDE.md`.** Conventions repeated in a prompt get followed once; conventions in a file the agent reads get followed always.

---

## 2. Repository layout

```
colourking/
├─ CLAUDE.md                    ← agent rules, read every session
├─ docs/
│  ├─ plan.md                   ← Lean Implementation Plan
│  ├─ spec.md                   ← this file
│  ├─ addendum.md
│  └─ decisions/                ← ADRs: 0001-offer-vs-lead.md, …
├─ supabase/
│  ├─ migrations/               ← NNNN_description.sql, append-only
│  ├─ seed.sql
│  └─ config.toml
├─ src/
│  ├─ app/
│  │  ├─ (public)/[locale]/     ← colourking.nl
│  │  │  ├─ page.tsx
│  │  │  ├─ offerte-aanvragen/
│  │  │  ├─ afspraak/
│  │  │  ├─ werk/[slug]/
│  │  │  ├─ o/[token]/          ← ES20 offer approval
│  │  │  └─ s/[token]/          ← IV20 status + pay
│  │  ├─ (admin)/app/           ← admin.colourking.nl
│  │  │  ├─ leads/  klanten/  voertuigen/  jobs/
│  │  │  ├─ offertes/  onderdelen/  facturen/
│  │  │  ├─ documenten/  btw/  inkoop/
│  │  │  ├─ afspraken/  planning/  rapportage/  instellingen/
│  │  ├─ (mobile)/m/[job]/      ← JB20 shop floor
│  │  └─ api/
│  │     ├─ webhooks/mollie/
│  │     └─ email/inbound/
│  ├─ modules/                  ← one folder per module code
│  │  ├─ leads/  customers/  vehicles/  jobs/  offers/
│  │  ├─ parts/  invoices/  documents/  appointments/
│  │  ├─ tasks/  vat/  purchases/
│  │  │   ├─ actions.ts         ← server actions
│  │  │   ├─ queries.ts         ← data reads
│  │  │   ├─ schema.ts          ← zod
│  │  │   ├─ machine.ts         ← state transitions
│  │  │   └─ components/
│  ├─ components/ui/            ← design system, shared by all surfaces
│  ├─ lib/
│  │  ├─ supabase/{server,client,admin}.ts
│  │  ├─ codes.ts               ← screen-code registry
│  │  ├─ numbering.ts
│  │  ├─ pdf/
│  │  ├─ rdw.ts
│  │  └─ auth.ts
│  ├─ messages/{nl,en,tr}.json
│  └─ types/database.ts         ← generated, never hand-edited
└─ tests/
```

**One module per business object.** If a feature needs a new top-level folder in `modules/`, that is the signal to re-read the plan's §11 scope table before building it.

---

## 3. `CLAUDE.md` — starter content

```markdown
# Colourking

Bodyshop management system. Next.js 14 App Router + Supabase + Vercel.
Read docs/spec.md before writing code. Read docs/plan.md for scope.

## Hard rules
1. NEVER change the database from the Supabase dashboard. Every schema
   change is a migration file in supabase/migrations/.
2. ALWAYS regenerate src/types/database.ts after a migration, in the
   same commit. A stale type file is worse than none.
3. NEVER use SUPABASE_SERVICE_ROLE_KEY in a client component or any
   file under app/(public).
4. NEVER edit an issued document or a locked VAT period. Supersede or
   correct instead.
5. Money is stored in cents as integers. Never floats.
6. All user-facing strings go through next-intl. No hardcoded Dutch.
7. Screen codes (JB10, ES20…) are never translated and never renamed.

## Before you finish a task
- pnpm typecheck && pnpm lint && pnpm test pass
- New tables have RLS enabled and a policy
- New screens are registered in lib/codes.ts
- New strings exist in all three locales

## Ask before
- Adding a dependency
- Adding a table not in docs/plan.md §3
- Changing a state machine
```

---

## 4. Conventions

| Thing | Rule |
|---|---|
| Language | TypeScript, strict. No `any` without a comment saying why. |
| Components | Server Components by default. `'use client'` only for interactivity. |
| Data reads | In server components or `queries.ts`. Never fetch in a client component. |
| Mutations | Server actions in `actions.ts`. Every one validates with zod first. |
| Money | Integer cents. `total_ex_vat_cents`. Format at the edge only. |
| Dates | `timestamptz` in the DB, Europe/Amsterdam for display. |
| IDs | `uuid` primary keys. Human-facing numbers are separate columns. |
| Naming | DB `snake_case`, TS `camelCase`, files `kebab-case`. |
| Enums | Postgres enums for state machines, TS union types generated from them. |

---

## 5. Database

### 5.1 Migrations

Append-only, numbered, never edited after merge:

```
0001_extensions.sql
0002_enums.sql
0003_core_tables.sql
0004_rls_core.sql
0005_numbering.sql
...
```

Every migration is reversible in principle and idempotent where cheap. If a migration is wrong, the fix is a new migration.

```bash
supabase migration new add_job_tasks
supabase db reset          # local, from scratch — do this often
supabase gen types typescript --local > src/types/database.ts
```

### 5.2 Every table gets

```sql
id           uuid primary key default gen_random_uuid(),
created_at   timestamptz not null default now(),
updated_at   timestamptz not null default now(),
deleted_at   timestamptz          -- soft delete where the object is user-visible
```

Plus a trigger for `updated_at`, and `alter table … enable row level security;` in the same migration that creates it. A table without RLS is readable by anyone with the anon key.

### 5.3 RLS patterns

Three patterns cover the whole system.

**Staff-only (most tables):**

```sql
create policy "staff read"  on jobs for select
  using (auth.uid() in (select id from staff where active));

create policy "staff write" on jobs for all
  using (auth.uid() in (select id from staff where active))
  with check (auth.uid() in (select id from staff where active));
```

**Role-gated (money, settings):**

```sql
create policy "office and admin only" on invoices for all
  using (exists (
    select 1 from staff
    where id = auth.uid() and active and role in ('admin','office')
  ));
```

**Public by token — the only anonymous access in the system:**

```sql
create policy "public read by approval token" on offers for select
  to anon
  using (
    approval_token is not null
    and approval_token = current_setting('request.jwt.claims', true)::json->>'token'
  );
```

Simpler and safer in practice: **do not expose token reads through the anon client at all.** Read them in a server route with the service-role client after verifying a signed token:

```ts
// app/(public)/[locale]/o/[token]/page.tsx
const payload = verifyToken(params.token)          // HMAC, 90-day expiry
const offer  = await admin.from('offers')
  .select('*, offer_lines(*), vehicles(*)')
  .eq('id', payload.offerId).single()
```

One code path, no policy to get subtly wrong. **This is the recommended approach.**

### 5.4 Numbering — transaction-safe

Numbers are allocated **at issue, never at draft creation**. Abandoned drafts must not punch holes in an invoice sequence.

```sql
create table number_ranges (
  doc_type   text not null,
  year       int  not null,
  next_value int  not null default 1,
  prefix     text not null,
  padding    int  not null default 5,
  primary key (doc_type, year)
);

create or replace function allocate_number(p_doc_type text, p_year int)
returns text language plpgsql as $$
declare r number_ranges%rowtype;
begin
  select * into r from number_ranges
   where doc_type = p_doc_type and year = p_year
   for update;                                   -- row lock, serialises callers

  if not found then
    insert into number_ranges (doc_type, year, next_value, prefix)
    values (p_doc_type, p_year, 1,
            case p_doc_type
              when 'offer'        then 'OFF'
              when 'repair_order' then 'OPD'
              when 'handover'     then 'AFL'
              when 'invoice'      then 'FAC'
              when 'credit_note'  then 'CRE'
            end)
    returning * into r;
  end if;

  update number_ranges set next_value = next_value + 1
   where doc_type = p_doc_type and year = p_year;

  return r.prefix || '-' || p_year || '-' ||
         lpad(r.next_value::text, r.padding, '0');
end $$;
```

`for update` is the whole point: two concurrent issues block rather than collide.

---

## 6. State machines

Transitions live in `machine.ts` per module, enforced in the server action, and mirrored by a DB check constraint where the cost is trivial.

```ts
// modules/jobs/machine.ts
export const JOB_STAGES = [
  'intake','dismantle','bodywork','prep','paint',
  'assembly','qc','ready','delivered','closed',
] as const
export type JobStage = typeof JOB_STAGES[number]

const NEXT: Record<JobStage, JobStage[]> = {
  intake:    ['dismantle','bodywork'],
  dismantle: ['bodywork','intake'],
  bodywork:  ['prep','dismantle'],
  prep:      ['paint','bodywork'],
  paint:     ['assembly','prep'],
  assembly:  ['qc','paint'],
  qc:        ['ready','assembly'],
  ready:     ['delivered','qc'],
  delivered: ['closed'],
  closed:    [],
}

export const canMove = (from: JobStage, to: JobStage) => NEXT[from].includes(to)
```

**Every transition writes a `job_events` row in the same transaction.** That single discipline gives cycle time, stage duration, an audit trail and the activity feed with no further work — and it is why the plan has no separate tracking module.

```ts
await db.transaction(async tx => {
  await tx.from('jobs').update({ status: to, stage_entered_at: now }).eq('id', jobId)
  await tx.from('job_events').insert({
    job_id: jobId, type: 'stage_change',
    message: `${from} → ${to}`, actor_id: user.id,
  })
})
```

---

## 7. Document engine

The single most important abstraction in the system. Build it once (sprint 3); every document type after that is a template.

### 7.1 Contract

```ts
type DocType = 'offer'|'repair_order'|'handover'|'invoice'|'credit_note'

interface DocumentRenderer<T> {
  type: DocType
  buildPayload(sourceId: string): Promise<T>   // freeze everything printed
  render(payload: T, locale: Locale): Promise<Buffer>
}
```

### 7.2 Issue — the one flow that must be exactly right

```ts
export async function issueDocument(draftId: string, actor: User) {
  return db.transaction(async tx => {
    const draft = await tx.from('documents')
      .select('*').eq('id', draftId).eq('status','draft').single()
    if (!draft) throw new Error('not a draft')

    // 1. Freeze. Everything that appears on the PDF goes in payload.
    const payload = await RENDERERS[draft.doc_type].buildPayload(draft.source_id)

    // 2. Allocate the number inside the same transaction.
    const number = await tx.rpc('allocate_number', {
      p_doc_type: draft.doc_type, p_year: new Date().getFullYear(),
    })

    // 3. Render once.
    const pdf  = await RENDERERS[draft.doc_type].render(payload, draft.locale)
    const hash = sha256(pdf)
    const path = `documents/${year}/${draft.doc_type}/${number}.pdf`
    await storage.upload(path, pdf, { contentType: 'application/pdf' })

    // 4. Seal.
    return tx.from('documents').update({
      status: 'issued', doc_number: number, payload,
      pdf_path: path, pdf_sha256: hash,
      issued_at: new Date(), issued_by: actor.id,
    }).eq('id', draftId)
  })
}
```

**The payload rule, restated because it is the one people break:** never regenerate a PDF from live data. Company address, VAT number, hourly rates, terms text, customer address, every line — frozen at issue. Otherwise an invoice printed today looks different next year and an audit becomes a bad week.

### 7.3 After issue

- Content is immutable. Corrections create a **new** document with `supersedes_id`.
- Invoices are never cancelled outright — a **credit note** supersedes them.
- Signing (`DO20`) re-renders **once** with the signature embedded, then freezes again.
- PDFs are served only through short-lived signed URLs. The bucket is private.

---

## 8. Auth and roles

Three roles, checked in one place:

```ts
// lib/auth.ts
export const PERMISSIONS = {
  admin:  ['*'],
  office: ['leads.*','customers.*','vehicles.*','jobs.*','offers.*',
           'parts.*','invoices.*','documents.*','appointments.*',
           'tasks.*','vat.read','purchases.*'],
  tech:   ['jobs.read','jobs.stage','photos.write','tasks.own',
           'parts.read','documents.sign'],
} as const

export function can(user: Staff, permission: string): boolean { /* … */ }
```

`can()` guards server actions. **RLS is the real boundary** — the permission map is UX, stopping people seeing buttons that would fail anyway.

---

## 9. Routing and the hostname split

```ts
// middleware.ts
export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const url  = req.nextUrl.clone()

  if (host.startsWith('admin.')) {
    const session = await getSession(req)
    if (!session && !url.pathname.startsWith('/login')) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    const res = NextResponse.rewrite(new URL(`/app${url.pathname}`, req.url))
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return res
  }

  return intlMiddleware(req)   // locale prefix for the public surface
}
```

Customer token pages (`/o/…`, `/s/…`) stay on the **public** host — email links must carry the brand, and the approval page should read as the website continuing the conversation.

---

## 10. i18n

- `next-intl`, namespace per module: `messages/nl.json → { "jb": { … }, "es": { … } }`
- **Screen codes are never translated.** `JB10` is `JB10` in every locale — which is exactly why codes beat menu labels in a multilingual shop.
- DB content uses a `jsonb` column `{nl, en, tr}`, fallback NL → EN → key.
- `customers.locale` is captured at the lead form and drives every downstream email, PDF and token page. Never ask twice.
- **Invoice bodies stay in Dutch** regardless of customer locale; a translated courtesy summary sits above the invoice block.

---

## 11. Server actions — the standard shape

```ts
'use server'

export async function approveOffer(input: unknown) {
  const data = ApproveOfferSchema.parse(input)        // 1. validate
  const user = await requireUser()                    // 2. authenticate
  if (!can(user, 'offers.approve')) throw new Forbidden()

  return db.transaction(async tx => {                 // 3. one transaction
    const offer = await tx.from('offers')
      .update({ status: 'approved', approved_at: new Date() })
      .eq('id', data.offerId).eq('status','sent')     // 4. guard the transition
      .select().single()

    const job = await createJobFromOffer(tx, offer)   // 5. side effects inside
    await tx.from('job_events').insert({ … })         // 6. always an event
    revalidatePath(`/app/offertes/${offer.id}`)       // 7. invalidate
    return job
  })
}
```

Validate → authenticate → authorise → transact → event → revalidate. Every action, same order.

---

## 12. Photos

The shop-floor screen is the one that decides whether the system has data at all.

```ts
// client: compress before upload, never after
const compressed = await imageCompression(file, {
  maxWidthOrHeight: 1600,
  maxSizeMB: 0.25,
  useWebWorker: true,
})
```

- Upload queue in IndexedDB; retries on reconnect. **A dropped connection must never block a stage change.**
- `taken_at` from EXIF where present, else upload time.
- Public gallery publication blurs the licence plate — a visible kenteken is personal data.
- Storage path `jobs/{job_id}/{phase}/{uuid}.jpg`, private bucket, signed URLs.

Do the compression in sprint 2. Retrofitting it means reprocessing everything.

---

## 13. Email

**Outbound** fires from state transitions, never from a manual button — that is what makes it reliable.

```ts
await sendTemplate({
  template: 'offer_ready',
  locale: customer.locale,
  to: customer.email,
  subject: `Uw offerte ${offer.number} [CK-JB-${job.number}]`,
  data: { … },
})
// writes email_messages + job_events
```

**Inbound**: Cloudflare Email Routing → edge function → match `[CK-JB-…]` in the subject, or the `job-{n}@` reply-to, or the sender against `customers.email` → attach to the job. No match lands in `LD05`.

Verify the domain and set SPF, DKIM and DMARC before the first send.

---

## 14. BTW engine

Every sales line, purchase line and document carries a `tax_code`. Mapping to rubrieken lives in `settings`, so a rule change is configuration rather than a migration.

```ts
const RUBRIEK: Record<TaxCode, { box: string; rate: number; input?: string }> = {
  H21:     { box: '1a', rate: 0.21 },
  L9:      { box: '1b', rate: 0.09 },
  'VRL-AFV': { box: '1e', rate: 0 },      // scrap, reverse charged
  'EU-DST':  { box: '3b', rate: 0 },
  'EU-INK':  { box: '4b', rate: 0.21, input: '5b' },
  'NON-EU':  { box: '4a', rate: 0.21, input: '5b' },
  PRIV:      { box: '1d', rate: 0.21 },
  GEEN:      { box: '',   rate: 0 },
}
```

The declaration is a pure aggregation over invoice lines and purchase lines for the period, grouped by box. **`BW10` locking sets `vat_returns.locked_at`, and every write path checks it** — an invoice dated inside a locked period is rejected, not silently adjusted. Without that the ledger and the declaration diverge and nobody notices until an audit.

---

## 15. Testing

Proportionate, not exhaustive. Four things earn tests:

| What | Why |
|---|---|
| **Number allocation** under concurrency | A duplicate invoice number is a fiscal problem |
| **State machine transitions** | Illegal moves must fail loudly |
| **VAT box aggregation** | Wrong arithmetic here costs money |
| **Document payload freezing** | Regression here is invisible until an audit |

Vitest for units, one Playwright path end to end: lead → offer → approve → job → invoice → paid. Run it in CI on every PR.

Everything else — CRUD screens, list filters — is verified by using it in the shop, which is faster and more honest than a test suite nobody maintains.

---

## 16. CI/CD

```yaml
# .github/workflows/ci.yml
on: [pull_request]
jobs:
  check:
    steps:
      - pnpm install --frozen-lockfile
      - pnpm typecheck
      - pnpm lint
      - pnpm test
      - pnpm build
```

- `main` protected: PR required, CI green, no direct pushes.
- Vercel deploys every branch as a preview against `colourking-dev`.
- Merge to `main` deploys production.
- **Migrations run against production manually**, after the deploy is verified — never automatically from CI. A bad migration on live shop data is not recoverable in the time a garage can tolerate.

---

## 17. Working with the agent

### 17.1 Sprint prompt pattern

```
Read docs/spec.md and docs/plan.md §3 and §<sprint section>.

Build sprint <n>: <name>.

Deliverables:
- migration(s) for <tables>
- module folder src/modules/<x>/ with schema/queries/actions/machine
- screens <CODES> at <routes>
- strings in nl/en/tr
- tests for <the risky part>

Constraints:
- Follow the server-action shape in spec §11
- Every state change writes a job_event
- RLS policy on every new table
- Regenerate types in the same commit

Stop and ask before adding any dependency or table not in the plan.
```

### 17.2 Definition of done

```
[ ] pnpm typecheck && lint && test && build all pass
[ ] Migration applied to local and dev; types regenerated in the same commit
[ ] RLS enabled with a policy on every new table
[ ] Screens registered in lib/codes.ts, reachable from Cmd-K
[ ] Strings present in all three locales
[ ] Preview deploy opened and clicked through on a real tablet where relevant
[ ] Decision worth remembering written to docs/decisions/
```

### 17.3 Guardrails that matter most

1. **No dashboard schema edits.** The moment the DB diverges from `migrations/`, the agent is working from a stale picture and every subsequent suggestion is subtly wrong. This is the same discipline as your des-gate rule, applied to schema.
2. **Regenerate types in the same commit as the migration.** A drifting `database.ts` makes the agent confident and wrong — worse than no types at all.
3. **One sprint per branch.** Reviewable diffs. An agent that touches thirty files across four modules cannot be reviewed and will not be.
4. **Record decisions in `docs/decisions/`.** Why offers are separate from leads, why documents freeze a payload, why tokens beat accounts. Otherwise a future session re-litigates a settled question and quietly changes an answer.
5. **Stop-and-ask beats guess-and-build.** New dependency, new table, changed state machine — ask. Everything else, proceed.

### 17.4 Anti-patterns to reject on sight

| Smell | Correct shape |
|---|---|
| A separate messaging/notes table | `job_events` |
| A customer accounts system | Signed tokens |
| Regenerating a PDF from live data | Frozen `payload` |
| Editing an issued document | `supersedes_id` |
| Number allocated at draft creation | At issue, in the transaction |
| A new module folder for a small feature | It belongs on the job |
| Prices on a lead | It becomes an offer |
| `float` for money | Integer cents |
| Fetch in a client component | Server component or `queries.ts` |

---

## 18. Build order, and why

```
0  Foundation      → nothing works without routing, auth, RLS, codes, i18n
3  Documents       → offers, repair orders, handovers and invoices are
                     ONE machine; building it first makes each later
                     document a template rather than a module
4  Offers          → first real business value
7  Invoices        → the loop closes; the shop can get paid
14 BTW             → build against a REAL closed quarter, so after the
                     shop has been live three months
```

The two orderings that are not negotiable: **foundation before anything**, and **the document engine before the first document**. Everything else can shuffle to suit what the shop needs soonest.
