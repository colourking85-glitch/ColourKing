-- 0026: Fix RLS policies for vehicle_brands and vehicle_models
-- Use auth.role() check instead of staff table lookup

-- Drop old policies
DROP POLICY IF EXISTS "staff can read brands" ON vehicle_brands;
DROP POLICY IF EXISTS "staff can manage brands" ON vehicle_brands;
DROP POLICY IF EXISTS "staff can read models" ON vehicle_models;
DROP POLICY IF EXISTS "staff can manage models" ON vehicle_models;

-- Authenticated users can read
CREATE POLICY "authenticated can read brands" ON vehicle_brands
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated can manage brands" ON vehicle_brands
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated can read models" ON vehicle_models
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated can manage models" ON vehicle_models
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
