-- 0025: Vehicle status enum, unique kenteken, brand/model tables

-- 1. Vehicle status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
    CREATE TYPE vehicle_status AS ENUM ('created', 'in_progress', 'done', 'archived');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='status') THEN
    ALTER TABLE vehicles ADD COLUMN status vehicle_status NOT NULL DEFAULT 'created';
  END IF;
END $$;

-- 2. Unique kenteken (only among non-archived, non-deleted vehicles)
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_kenteken_unique_active
  ON vehicles (kenteken)
  WHERE kenteken IS NOT NULL
    AND status != 'archived'
    AND deleted_at IS NULL;

-- 3. Vehicle brands
CREATE TABLE IF NOT EXISTS vehicle_brands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicle_brands ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_brands' AND policyname = 'staff can read brands') THEN
    CREATE POLICY "staff can read brands" ON vehicle_brands FOR SELECT
      USING (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_brands' AND policyname = 'staff can manage brands') THEN
    CREATE POLICY "staff can manage brands" ON vehicle_brands FOR ALL
      USING (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active))
      WITH CHECK (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active));
  END IF;
END $$;

-- 4. Vehicle models
CREATE TABLE IF NOT EXISTS vehicle_models (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid NOT NULL REFERENCES vehicle_brands(id) ON DELETE CASCADE,
  name        text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);

ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_models' AND policyname = 'staff can read models') THEN
    CREATE POLICY "staff can read models" ON vehicle_models FOR SELECT
      USING (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_models' AND policyname = 'staff can manage models') THEN
    CREATE POLICY "staff can manage models" ON vehicle_models FOR ALL
      USING (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active))
      WITH CHECK (auth.uid() IN (SELECT s.id FROM staff s WHERE s.active));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS vehicle_models_brand_id_idx ON vehicle_models (brand_id);

-- 5. Seed common brands and models
INSERT INTO vehicle_brands (name, sort_order) VALUES
  ('Alfa Romeo', 10),
  ('Audi', 20),
  ('BMW', 30),
  ('Citroën', 40),
  ('DAF', 50),
  ('Dacia', 60),
  ('Fiat', 70),
  ('Ford', 80),
  ('Honda', 90),
  ('Hyundai', 100),
  ('Iveco', 110),
  ('Jaguar', 120),
  ('Jeep', 130),
  ('Kia', 140),
  ('Land Rover', 150),
  ('Lexus', 160),
  ('MAN', 170),
  ('Mazda', 180),
  ('Mercedes-Benz', 190),
  ('Mini', 200),
  ('Mitsubishi', 210),
  ('Nissan', 220),
  ('Opel', 230),
  ('Peugeot', 240),
  ('Porsche', 250),
  ('Renault', 260),
  ('Scania', 270),
  ('Seat', 280),
  ('Škoda', 290),
  ('Smart', 300),
  ('SsangYong', 310),
  ('Subaru', 320),
  ('Suzuki', 330),
  ('Tesla', 340),
  ('Toyota', 350),
  ('Volkswagen', 360),
  ('Volvo', 370)
ON CONFLICT (name) DO NOTHING;

-- Seed popular models per brand
DO $$ DECLARE bid uuid; BEGIN
  -- Volkswagen
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Volkswagen';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Caddy', 10), (bid, 'Transporter', 20), (bid, 'Crafter', 30),
      (bid, 'Golf', 40), (bid, 'Polo', 50), (bid, 'Passat', 60),
      (bid, 'Tiguan', 70), (bid, 'T-Roc', 80), (bid, 'ID.3', 90),
      (bid, 'ID.4', 100), (bid, 'ID.Buzz', 110), (bid, 'Up!', 120),
      (bid, 'Amarok', 130), (bid, 'Touran', 140), (bid, 'Arteon', 150)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Mercedes-Benz
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Mercedes-Benz';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Sprinter', 10), (bid, 'Vito', 20), (bid, 'Citan', 30),
      (bid, 'A-Klasse', 40), (bid, 'B-Klasse', 50), (bid, 'C-Klasse', 60),
      (bid, 'E-Klasse', 70), (bid, 'S-Klasse', 80), (bid, 'GLA', 90),
      (bid, 'GLB', 100), (bid, 'GLC', 110), (bid, 'GLE', 120),
      (bid, 'V-Klasse', 130), (bid, 'EQA', 140), (bid, 'EQC', 150)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Ford
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Ford';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Transit', 10), (bid, 'Transit Custom', 20), (bid, 'Transit Connect', 30),
      (bid, 'Ranger', 40), (bid, 'Focus', 50), (bid, 'Fiesta', 60),
      (bid, 'Puma', 70), (bid, 'Kuga', 80), (bid, 'Mustang Mach-E', 90),
      (bid, 'Explorer', 100), (bid, 'Tourneo Custom', 110), (bid, 'Mondeo', 120)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Fiat
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Fiat';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Ducato', 10), (bid, 'Doblo', 20), (bid, 'Fiorino', 30),
      (bid, 'Talento', 40), (bid, '500', 50), (bid, '500e', 60),
      (bid, 'Panda', 70), (bid, 'Tipo', 80), (bid, '500X', 90)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Iveco
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Iveco';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Daily', 10), (bid, 'Eurocargo', 20), (bid, 'S-Way', 30),
      (bid, 'eDaily', 40)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Renault
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Renault';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Master', 10), (bid, 'Trafic', 20), (bid, 'Kangoo', 30),
      (bid, 'Clio', 40), (bid, 'Captur', 50), (bid, 'Mégane', 60),
      (bid, 'Arkana', 70), (bid, 'Austral', 80), (bid, 'Zoe', 90)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Peugeot
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Peugeot';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Boxer', 10), (bid, 'Expert', 20), (bid, 'Partner', 30),
      (bid, '208', 40), (bid, '308', 50), (bid, '2008', 60),
      (bid, '3008', 70), (bid, '5008', 80), (bid, 'e-208', 90)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Citroën
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Citroën';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Jumper', 10), (bid, 'Jumpy', 20), (bid, 'Berlingo', 30),
      (bid, 'C3', 40), (bid, 'C4', 50), (bid, 'C5 Aircross', 60),
      (bid, 'ë-Berlingo', 70)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Opel
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Opel';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Movano', 10), (bid, 'Vivaro', 20), (bid, 'Combo', 30),
      (bid, 'Corsa', 40), (bid, 'Astra', 50), (bid, 'Mokka', 60),
      (bid, 'Grandland', 70), (bid, 'Crossland', 80)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Toyota
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Toyota';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Proace', 10), (bid, 'Proace City', 20), (bid, 'Hilux', 30),
      (bid, 'Yaris', 40), (bid, 'Corolla', 50), (bid, 'C-HR', 60),
      (bid, 'RAV4', 70), (bid, 'Land Cruiser', 80), (bid, 'Aygo X', 90),
      (bid, 'bZ4X', 100)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Nissan
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Nissan';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Interstar', 10), (bid, 'Primastar', 20), (bid, 'Townstar', 30),
      (bid, 'Qashqai', 40), (bid, 'Juke', 50), (bid, 'Leaf', 60),
      (bid, 'X-Trail', 70), (bid, 'Navara', 80), (bid, 'Ariya', 90)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- BMW
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'BMW';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, '1-Serie', 10), (bid, '2-Serie', 20), (bid, '3-Serie', 30),
      (bid, '4-Serie', 40), (bid, '5-Serie', 50), (bid, 'X1', 60),
      (bid, 'X3', 70), (bid, 'X5', 80), (bid, 'iX', 90),
      (bid, 'i4', 100), (bid, 'iX3', 110)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Audi
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Audi';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'A1', 10), (bid, 'A3', 20), (bid, 'A4', 30),
      (bid, 'A5', 40), (bid, 'A6', 50), (bid, 'Q2', 60),
      (bid, 'Q3', 70), (bid, 'Q5', 80), (bid, 'Q7', 90),
      (bid, 'e-tron', 100), (bid, 'Q4 e-tron', 110)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Hyundai
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Hyundai';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'i10', 10), (bid, 'i20', 20), (bid, 'i30', 30),
      (bid, 'Tucson', 40), (bid, 'Kona', 50), (bid, 'IONIQ 5', 60),
      (bid, 'IONIQ 6', 70), (bid, 'Santa Fe', 80)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Kia
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Kia';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Picanto', 10), (bid, 'Rio', 20), (bid, 'Ceed', 30),
      (bid, 'Sportage', 40), (bid, 'Niro', 50), (bid, 'EV6', 60),
      (bid, 'EV9', 70), (bid, 'Sorento', 80), (bid, 'Stonic', 90)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Tesla
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Tesla';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Model 3', 10), (bid, 'Model Y', 20), (bid, 'Model S', 30),
      (bid, 'Model X', 40), (bid, 'Cybertruck', 50)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Volvo
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Volvo';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'XC40', 10), (bid, 'XC60', 20), (bid, 'XC90', 30),
      (bid, 'V60', 40), (bid, 'V90', 50), (bid, 'S60', 60),
      (bid, 'S90', 70), (bid, 'EX30', 80), (bid, 'EX90', 90),
      (bid, 'FH', 100), (bid, 'FM', 110)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Škoda
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Škoda';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Fabia', 10), (bid, 'Octavia', 20), (bid, 'Superb', 30),
      (bid, 'Kamiq', 40), (bid, 'Karoq', 50), (bid, 'Kodiaq', 60),
      (bid, 'Enyaq', 70), (bid, 'Scala', 80)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Dacia
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Dacia';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Sandero', 10), (bid, 'Duster', 20), (bid, 'Jogger', 30),
      (bid, 'Spring', 40), (bid, 'Dokker', 50)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Seat
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Seat';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'Ibiza', 10), (bid, 'Leon', 20), (bid, 'Arona', 30),
      (bid, 'Ateca', 40), (bid, 'Tarraco', 50)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- MAN
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'MAN';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'TGE', 10), (bid, 'TGL', 20), (bid, 'TGM', 30),
      (bid, 'TGS', 40), (bid, 'TGX', 50)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- DAF
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'DAF';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'XD', 10), (bid, 'XF', 20), (bid, 'XG', 30),
      (bid, 'XG+', 40), (bid, 'LF', 50), (bid, 'CF', 60)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;

  -- Scania
  SELECT id INTO bid FROM vehicle_brands WHERE name = 'Scania';
  IF bid IS NOT NULL THEN
    INSERT INTO vehicle_models (brand_id, name, sort_order) VALUES
      (bid, 'P-Serie', 10), (bid, 'G-Serie', 20), (bid, 'R-Serie', 30),
      (bid, 'S-Serie', 40), (bid, 'L-Serie', 50)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END IF;
END $$;
