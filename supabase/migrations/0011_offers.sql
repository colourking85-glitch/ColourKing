-- Sprint 4: Offers + Offer Lines
-- ================================

-- offers table
CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type offer_type NOT NULL DEFAULT 'offer',
  status offer_status NOT NULL DEFAULT 'draft',
  origin offer_origin NOT NULL DEFAULT 'manual',
  offer_number text UNIQUE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  vehicle_id uuid REFERENCES vehicles(id),
  lead_id uuid REFERENCES leads(id),
  job_id uuid REFERENCES jobs(id),
  parent_offer_id uuid REFERENCES offers(id),
  supersedes_id uuid REFERENCES offers(id),
  locale text NOT NULL DEFAULT 'nl',
  valid_until date,
  notes text,
  subtotal_cents integer NOT NULL DEFAULT 0,
  vat_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  approved_at timestamptz,
  approved_by_name text,
  approved_ip inet,
  rejected_at timestamptz,
  rejected_reason text,
  sent_at timestamptz,
  created_by uuid REFERENCES staff(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- offer_lines table
CREATE TABLE offer_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  kind offer_line_kind NOT NULL DEFAULT 'labour',
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'st',
  unit_price_cents integer NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  line_total_cents integer NOT NULL DEFAULT 0,
  tax_code tax_code NOT NULL DEFAULT 'H21',
  vat_amount_cents integer NOT NULL DEFAULT 0,
  part_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_offers_customer ON offers(customer_id);
CREATE INDEX idx_offers_vehicle ON offers(vehicle_id);
CREATE INDEX idx_offers_lead ON offers(lead_id);
CREATE INDEX idx_offers_job ON offers(job_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_type ON offers(type);
CREATE INDEX idx_offers_supersedes ON offers(supersedes_id);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);
CREATE INDEX idx_offer_lines_offer ON offer_lines(offer_id);

-- Trigger: auto-update offers.updated_at
CREATE OR REPLACE FUNCTION set_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION set_offers_updated_at();

-- RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_lines ENABLE ROW LEVEL SECURITY;

-- Staff can read all offers
CREATE POLICY offers_select ON offers
  FOR SELECT TO authenticated
  USING (true);

-- Staff can insert offers
CREATE POLICY offers_insert ON offers
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Staff can update offers
CREATE POLICY offers_update ON offers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Staff can delete draft offers
CREATE POLICY offers_delete ON offers
  FOR DELETE TO authenticated
  USING (status = 'draft');

-- Offer lines: staff can do everything (cascades from offer)
CREATE POLICY offer_lines_select ON offer_lines
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY offer_lines_insert ON offer_lines
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY offer_lines_update ON offer_lines
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY offer_lines_delete ON offer_lines
  FOR DELETE TO authenticated
  USING (true);
