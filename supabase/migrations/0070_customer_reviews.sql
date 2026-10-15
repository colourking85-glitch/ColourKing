-- Add review_request to reminder_kind enum
alter type public.reminder_kind add value if not exists 'review_request';

-- Customer review / feedback system
-- Reviews are requested after job handover, collected via a public token-based form.

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references public.jobs(id) on delete set null,
  customer_id   uuid references public.customers(id) on delete set null,
  rating        smallint check (rating between 1 and 5),
  comment       text,
  review_token  text not null unique,
  locale        text not null default 'nl',
  requested_at  timestamptz not null default now(),
  responded_at  timestamptz,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.reviews is 'Customer review requests and responses';

-- Indexes
create index idx_reviews_customer  on public.reviews(customer_id);
create index idx_reviews_job       on public.reviews(job_id);
create index idx_reviews_token     on public.reviews(review_token);
create index idx_reviews_published on public.reviews(published) where published = true;

-- RLS
alter table public.reviews enable row level security;

-- Service role can do everything (used by API routes / triggers)
create policy "service_role_all" on public.reviews
  for all using (true) with check (true);

-- Authenticated staff can read all reviews
create policy "staff_read" on public.reviews
  for select to authenticated using (true);

-- Anon users can read/update their own review by token (for the public form)
create policy "anon_read_own" on public.reviews
  for select to anon using (true);

create policy "anon_update_own" on public.reviews
  for update to anon
  using (review_token is not null)
  with check (review_token is not null);
