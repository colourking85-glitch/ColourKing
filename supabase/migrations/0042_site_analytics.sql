-- 0042: Site analytics — session + pageview tracking for colourking.nl

create table site_sessions (
  id              uuid primary key default gen_random_uuid(),
  session_id      text not null unique,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  duration_seconds integer not null default 0,
  page_count      integer not null default 1,
  entry_page      text not null,
  exit_page       text,
  referrer        text,
  channel         text not null default 'direct'
                    check (channel in ('direct','referral','organic_search','social','ai','email')),
  country_code    text,
  country_name    text,
  city            text,
  device          text not null default 'desktop'
                    check (device in ('desktop','mobile','tablet')),
  browser         text,
  os              text,
  locale          text,
  is_bot          boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table site_sessions enable row level security;

create policy "staff can read site_sessions"
  on site_sessions for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "anon can insert site_sessions"
  on site_sessions for insert
  with check (true);

create policy "anon can update site_sessions"
  on site_sessions for update
  using (true)
  with check (true);

create index site_sessions_started_at_idx on site_sessions (started_at desc);
create index site_sessions_channel_idx on site_sessions (channel);
create index site_sessions_device_idx on site_sessions (device);
create index site_sessions_country_idx on site_sessions (country_code);
create index site_sessions_is_bot_idx on site_sessions (is_bot);

create table site_pageviews (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null references site_sessions(session_id) on delete cascade,
  page_path   text not null,
  page_title  text,
  viewed_at   timestamptz not null default now()
);

alter table site_pageviews enable row level security;

create policy "staff can read site_pageviews"
  on site_pageviews for select
  using (auth.uid() in (select s.id from staff s where s.active));

create policy "anon can insert site_pageviews"
  on site_pageviews for insert
  with check (true);

create index site_pageviews_session_idx on site_pageviews (session_id);
create index site_pageviews_viewed_at_idx on site_pageviews (viewed_at desc);
create index site_pageviews_page_path_idx on site_pageviews (page_path);
