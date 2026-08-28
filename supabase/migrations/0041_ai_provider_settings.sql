-- 0041: Expand AI settings for multi-provider support
-- Merge new fields into existing ai settings row
update settings
set value = value || '{"default_provider": "anthropic", "photo_check_provider": null}'::jsonb
where key = 'ai'
  and not (value ? 'default_provider');
