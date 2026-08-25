-- Purchase invoices (inkoopfacturen)
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number text,
  supplier_name text NOT NULL,
  supplier_vat_number text,
  invoice_date date NOT NULL,
  due_date date,

  subtotal_cents int NOT NULL DEFAULT 0,
  vat_cents int NOT NULL DEFAULT 0,
  total_cents int NOT NULL DEFAULT 0,

  tax_code tax_code NOT NULL DEFAULT 'H21',

  category text NOT NULL DEFAULT 'general', -- general, parts, paint, materials, tools, rent, utilities, insurance, other
  description text,
  reference text, -- supplier invoice number

  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  payment_method payment_method,

  receipt_path text, -- Supabase storage path for scanned receipt

  job_id uuid REFERENCES jobs(id),

  created_by uuid REFERENCES staff(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read purchases"
  ON purchases FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.active)
  );

CREATE POLICY "Office/admin can manage purchases"
  ON purchases FOR ALL USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'office'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'office'))
  );

CREATE INDEX purchases_supplier_idx ON purchases (supplier_name);
CREATE INDEX purchases_date_idx ON purchases (invoice_date);
CREATE INDEX purchases_category_idx ON purchases (category);
CREATE INDEX purchases_paid_idx ON purchases (paid);
CREATE INDEX purchases_job_id_idx ON purchases (job_id);
