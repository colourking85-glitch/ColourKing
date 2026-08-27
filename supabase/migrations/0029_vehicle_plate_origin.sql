-- 0029: add plate_origin column to vehicles for license plate country of registration
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS plate_origin text;
