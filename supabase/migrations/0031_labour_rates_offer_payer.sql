-- 0031: labour_rates table for default pricing, add payer_type to offers

CREATE TABLE labour_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'labour' CHECK (kind IN ('labour', 'part', 'material', 'other')),
  payer_type payer_type,
  description text,
  unit text NOT NULL DEFAULT 'uur',
  unit_price_cents integer NOT NULL DEFAULT 0,
  tax_code text NOT NULL DEFAULT 'H21' CHECK (tax_code IN ('H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX')),
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE labour_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_all_labour_rates" ON labour_rates FOR ALL USING (true);

ALTER TABLE offers ADD COLUMN IF NOT EXISTS payer_type payer_type;

INSERT INTO labour_rates (name, kind, unit, unit_price_cents, description, is_default, sort_order) VALUES
  ('Plaatwerk', 'labour', 'uur', 7500, 'Standaard plaatwerk uurloon', true, 1),
  ('Spuitwerk', 'labour', 'uur', 8000, 'Spuitwerk uurloon', true, 2),
  ('Mechanisch', 'labour', 'uur', 8500, 'Mechanisch werk uurloon', true, 3),
  ('Demontage/montage', 'labour', 'uur', 7000, 'Dem/mon uurloon', true, 4),
  ('Onderdeel', 'part', 'st', 0, 'Onderdeel (prijs invullen)', false, 10),
  ('Lakmateriaal', 'material', 'st', 0, 'Lakmateriaal', false, 20),
  ('Kleinmateriaal', 'material', 'st', 0, 'Kleinmateriaal (schuurpapier, tape, etc.)', false, 21),
  ('Uitbesteed werk', 'other', 'st', 0, 'Extern/uitbesteed', false, 30);
