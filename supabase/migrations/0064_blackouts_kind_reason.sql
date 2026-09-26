-- Off days (SY06): blackouts gain a display kind and an optional note.
alter table blackouts
  add column if not exists kind text not null default 'holiday'
    check (kind in ('holiday', 'maintenance', 'other')),
  add column if not exists reason text;
