-- 0040: AI configuration settings
insert into settings (key, value) values
  ('ai', '{"photo_check_enabled": true}'::jsonb)
on conflict (key) do nothing;
