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
7. Screen codes (JB10, ES20...) are never translated and never renamed.

## Before you finish a task
- pnpm typecheck && pnpm lint && pnpm test pass
- New tables have RLS enabled and a policy
- New screens are registered in lib/codes.ts
- New strings exist in all three locales

## Ask before
- Adding a dependency
- Adding a table not in docs/plan.md section 3
- Changing a state machine
