-- 0043: INS module — catalog tables (components, damage types) + reference sequence

-- Fixed panel list. ~55 rows. Keys are permanent — seed carefully.
create table ins_components (
  key           text primary key,
  name_nl       text not null,
  name_en       text,
  name_tr       text,
  zone          text not null,
  panel_group   text not null,
  paintable     boolean not null default true,
  panel_size    text not null default 'm',
  sort_order    int not null default 0,
  active        boolean not null default true,
  constraint ins_comp_zone_chk  check (zone in ('voor','achter','links','rechts','dak','glas','wielen','interieur')),
  constraint ins_comp_group_chk check (panel_group in ('plaat','kunststof','glas','verlichting','wiel','trim')),
  constraint ins_comp_size_chk  check (panel_size in ('xs','s','m','l','xl'))
);

-- Damage types. ~12 rows.
create table ins_damage_types (
  code          text primary key,
  name_nl       text not null,
  name_en       text,
  name_tr       text,
  implies_paint boolean not null default false,
  sort_order    int not null default 0
);

-- Reference sequence and function (must exist before ins_inspections table)
create sequence if not exists ins_reference_seq;

create or replace function ins_next_reference() returns text language sql as $$
  select 'INS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('ins_reference_seq')::text, 5, '0');
$$;
