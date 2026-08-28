-- 0048: INS module — seed data (components + damage types)

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('ins-originals', 'ins-originals', false),
  ('ins-derivatives', 'ins-derivatives', false)
on conflict do nothing;

-- Storage policies: staff can upload/read, service role manages
create policy "staff upload ins originals" on storage.objects for insert
  with check (bucket_id = 'ins-originals' and auth.uid() in (select s.id from staff s where s.active));
create policy "staff read ins originals" on storage.objects for select
  using (bucket_id = 'ins-originals' and auth.uid() in (select s.id from staff s where s.active));
create policy "staff upload ins derivatives" on storage.objects for insert
  with check (bucket_id = 'ins-derivatives' and auth.uid() in (select s.id from staff s where s.active));
create policy "staff read ins derivatives" on storage.objects for select
  using (bucket_id = 'ins-derivatives' and auth.uid() in (select s.id from staff s where s.active));
create policy "staff manage ins derivatives" on storage.objects for update
  using (bucket_id = 'ins-derivatives' and auth.uid() in (select s.id from staff s where s.active));

-- Components (~55 rows)
-- VOOR
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('bumper_front',   'Voorbumper',          'Front Bumper',          'Ön Tampon',             'voor',     'kunststof', true,  'xl', 10),
  ('grille',         'Grille',              'Grille',                'Izgara',                'voor',     'kunststof', false, 'xs', 20),
  ('bonnet',         'Motorkap',            'Bonnet',                'Motor Kaputu',          'voor',     'plaat',     true,  'l',  30),
  ('headlamp_l',     'Koplamp links',       'Headlamp Left',        'Sol Far',               'voor',     'verlichting', false, 'xs', 40),
  ('headlamp_r',     'Koplamp rechts',      'Headlamp Right',       'Sağ Far',               'voor',     'verlichting', false, 'xs', 50),
  ('fog_l',          'Mistlamp links',      'Fog Light Left',       'Sol Sis Lambası',       'voor',     'verlichting', false, 'xs', 60),
  ('fog_r',          'Mistlamp rechts',     'Fog Light Right',      'Sağ Sis Lambası',       'voor',     'verlichting', false, 'xs', 70),
  ('front_panel',    'Frontpaneel',         'Front Panel',           'Ön Panel',              'voor',     'plaat',     true,  's',  80),
  ('wiper_front',    'Ruitenwisser voor',   'Front Wiper',           'Ön Silecek',            'voor',     'trim',      false, 'xs', 90);

-- LINKS
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('fender_fl',      'Spatbord linksvoor',    'Front Left Fender',    'Sol Ön Çamurluk',      'links',    'plaat',     true,  'm',  100),
  ('door_fl',        'Portier linksvoor',     'Front Left Door',      'Sol Ön Kapı',          'links',    'plaat',     true,  'l',  110),
  ('door_rl',        'Portier linksachter',   'Rear Left Door',       'Sol Arka Kapı',        'links',    'plaat',     true,  'l',  120),
  ('slide_door_l',   'Schuifdeur links',      'Left Sliding Door',    'Sol Sürgülü Kapı',     'links',    'plaat',     true,  'xl', 130),
  ('quarter_l',      'Zijpaneel links',       'Left Quarter Panel',   'Sol Yan Panel',        'links',    'plaat',     true,  'l',  140),
  ('sill_l',         'Dorpel links',          'Left Sill',            'Sol Eşik',             'links',    'plaat',     true,  's',  150),
  ('mirror_l',       'Spiegel links',         'Left Mirror',          'Sol Ayna',             'links',    'kunststof', true,  'xs', 160);

-- RECHTS
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('fender_fr',      'Spatbord rechtsvoor',   'Front Right Fender',   'Sağ Ön Çamurluk',     'rechts',   'plaat',     true,  'm',  200),
  ('door_fr',        'Portier rechtsvoor',    'Front Right Door',     'Sağ Ön Kapı',         'rechts',   'plaat',     true,  'l',  210),
  ('door_rr',        'Portier rechtsachter',  'Rear Right Door',      'Sağ Arka Kapı',       'rechts',   'plaat',     true,  'l',  220),
  ('slide_door_r',   'Schuifdeur rechts',     'Right Sliding Door',   'Sağ Sürgülü Kapı',    'rechts',   'plaat',     true,  'xl', 230),
  ('quarter_r',      'Zijpaneel rechts',      'Right Quarter Panel',  'Sağ Yan Panel',       'rechts',   'plaat',     true,  'l',  240),
  ('sill_r',         'Dorpel rechts',         'Right Sill',           'Sağ Eşik',            'rechts',   'plaat',     true,  's',  250),
  ('mirror_r',       'Spiegel rechts',        'Right Mirror',         'Sağ Ayna',            'rechts',   'kunststof', true,  'xs', 260);

-- ACHTER
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('bumper_rear',    'Achterbumper',          'Rear Bumper',           'Arka Tampon',          'achter',   'kunststof', true,  'xl', 300),
  ('tailgate',       'Achterklep',            'Tailgate',              'Bagaj Kapağı',         'achter',   'plaat',     true,  'l',  310),
  ('boot_lid',       'Kofferklep',            'Boot Lid',              'Bagaj Kapısı',         'achter',   'plaat',     true,  'l',  320),
  ('rear_panel',     'Achterpaneel',          'Rear Panel',            'Arka Panel',           'achter',   'plaat',     true,  'm',  330),
  ('taillamp_l',     'Achterlicht links',     'Tail Light Left',       'Sol Arka Lamba',       'achter',   'verlichting', false, 'xs', 340),
  ('taillamp_r',     'Achterlicht rechts',    'Tail Light Right',      'Sağ Arka Lamba',       'achter',   'verlichting', false, 'xs', 350);

-- DAK
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('roof',           'Dak',                   'Roof',                  'Tavan',                'dak',      'plaat',     true,  'xl', 400),
  ('roof_rail_l',    'Dakrail links',         'Left Roof Rail',        'Sol Tavan Rayı',       'dak',      'trim',      true,  's',  410),
  ('roof_rail_r',    'Dakrail rechts',        'Right Roof Rail',       'Sağ Tavan Rayı',       'dak',      'trim',      true,  's',  420);

-- GLAS
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('windscreen',     'Voorruit',              'Windscreen',            'Ön Cam',               'glas',     'glas',      false, 'l',  500),
  ('rear_screen',    'Achterruit',            'Rear Screen',           'Arka Cam',             'glas',     'glas',      false, 'l',  510),
  ('door_glass_fl',  'Zijruit linksvoor',     'Front Left Window',     'Sol Ön Cam',           'glas',     'glas',      false, 's',  520),
  ('door_glass_fr',  'Zijruit rechtsvoor',    'Front Right Window',    'Sağ Ön Cam',           'glas',     'glas',      false, 's',  530),
  ('door_glass_rl',  'Zijruit linksachter',   'Rear Left Window',      'Sol Arka Cam',         'glas',     'glas',      false, 's',  540),
  ('door_glass_rr',  'Zijruit rechtsachter',  'Rear Right Window',     'Sağ Arka Cam',         'glas',     'glas',      false, 's',  550),
  ('quarter_glass_l','Zijruitje links',       'Left Quarter Glass',    'Sol Küçük Cam',        'glas',     'glas',      false, 'xs', 560),
  ('quarter_glass_r','Zijruitje rechts',      'Right Quarter Glass',   'Sağ Küçük Cam',        'glas',     'glas',      false, 'xs', 570);

-- WIELEN
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('wheel_fl',       'Velg linksvoor',        'Front Left Wheel',      'Sol Ön Jant',          'wielen',   'wiel',      false, 's',  600),
  ('wheel_fr',       'Velg rechtsvoor',       'Front Right Wheel',     'Sağ Ön Jant',          'wielen',   'wiel',      false, 's',  610),
  ('wheel_rl',       'Velg linksachter',      'Rear Left Wheel',       'Sol Arka Jant',        'wielen',   'wiel',      false, 's',  620),
  ('wheel_rr',       'Velg rechtsachter',     'Rear Right Wheel',      'Sağ Arka Jant',        'wielen',   'wiel',      false, 's',  630),
  ('tyre_fl',        'Band linksvoor',        'Front Left Tyre',       'Sol Ön Lastik',        'wielen',   'wiel',      false, 's',  640),
  ('tyre_fr',        'Band rechtsvoor',       'Front Right Tyre',      'Sağ Ön Lastik',        'wielen',   'wiel',      false, 's',  650),
  ('tyre_rl',        'Band linksachter',      'Rear Left Tyre',        'Sol Arka Lastik',      'wielen',   'wiel',      false, 's',  660),
  ('tyre_rr',        'Band rechtsachter',     'Rear Right Tyre',       'Sağ Arka Lastik',      'wielen',   'wiel',      false, 's',  670);

-- INTERIEUR
insert into ins_components (key, name_nl, name_en, name_tr, zone, panel_group, paintable, panel_size, sort_order) values
  ('dashboard',      'Dashboard',             'Dashboard',             'Gösterge Paneli',      'interieur','trim',      false, 'l',  700),
  ('seat_fl',        'Stoel linksvoor',       'Front Left Seat',       'Sol Ön Koltuk',        'interieur','trim',      false, 'm',  710),
  ('seat_fr',        'Stoel rechtsvoor',      'Front Right Seat',      'Sağ Ön Koltuk',        'interieur','trim',      false, 'm',  720),
  ('trim_door_fl',   'Deurpaneel linksvoor',  'Front Left Door Trim',  'Sol Ön Kapı Döşemesi', 'interieur','trim',      false, 's',  730),
  ('trim_door_fr',   'Deurpaneel rechtsvoor', 'Front Right Door Trim', 'Sağ Ön Kapı Döşemesi', 'interieur','trim',      false, 's',  740);

-- Damage types (12 rows)
insert into ins_damage_types (code, name_nl, name_en, name_tr, implies_paint, sort_order) values
  ('kras',         'Kras',              'Scratch',          'Çizik',           true,  10),
  ('deuk',         'Deuk',              'Dent',             'Göçük',           false, 20),
  ('diepe_kras',   'Diepe kras',        'Deep Scratch',     'Derin Çizik',     true,  30),
  ('scheur',       'Scheur',            'Crack',            'Çatlak',          false, 40),
  ('breuk',        'Breuk',             'Break',            'Kırık',           false, 50),
  ('vervorming',   'Vervorming',        'Deformation',      'Deformasyon',     false, 60),
  ('corrosie',     'Corrosie',          'Corrosion',        'Korozyon',        true,  70),
  ('lakschade',    'Lakschade',         'Paint Damage',     'Boya Hasarı',     true,  80),
  ('steenslag',    'Steenslag',         'Stone Chip',       'Taş İzi',         true,  90),
  ('ontbreekt',    'Ontbreekt',         'Missing',          'Eksik',           false, 100),
  ('los',          'Los / verschoven',  'Loose / Shifted',  'Gevşek / Kaymış', false, 110),
  ('onbekend',     'Onbekend',          'Unknown',          'Bilinmeyen',      false, 120);
