-- VAT returns table
CREATE TABLE vat_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type vat_period_type NOT NULL DEFAULT 'quarter',
  year integer NOT NULL,
  period integer NOT NULL, -- Q1=1..Q4=4 for quarter, 1..12 for month
  status vat_return_status NOT NULL DEFAULT 'open',

  -- Box amounts (Dutch BTW aangifte boxes) in cents
  box1a_supplies_high int NOT NULL DEFAULT 0,      -- 1a. Leveringen/diensten belast met hoog tarief
  box1b_supplies_low int NOT NULL DEFAULT 0,       -- 1b. Leveringen/diensten belast met laag tarief
  box1c_supplies_other int NOT NULL DEFAULT 0,     -- 1c. Leveringen/diensten belast met overige tarieven
  box1d_private_use int NOT NULL DEFAULT 0,        -- 1d. Privegebruik
  box1e_supplies_zero int NOT NULL DEFAULT 0,      -- 1e. Leveringen/diensten belast met 0%
  box2a_supplies_from_eu int NOT NULL DEFAULT 0,   -- 2a. Verwerving uit EU
  box4a_vat_on_supplies int NOT NULL DEFAULT 0,    -- 4a. Verschuldigde BTW over 1a t/m 1d
  box4b_vat_on_eu int NOT NULL DEFAULT 0,          -- 4b. Verschuldigde BTW over 2a
  box5a_vat_deductible int NOT NULL DEFAULT 0,     -- 5a. Voorbelasting (deductible input VAT)
  box5b_vat_balance int NOT NULL DEFAULT 0,        -- 5b. Subtotaal (4a+4b - 5a)
  box5c_small_business int NOT NULL DEFAULT 0,     -- 5c. Vermindering KOR
  box5d_estimate_previous int NOT NULL DEFAULT 0,  -- 5d. Schatting vorige aangiften
  box5e_total_payable int NOT NULL DEFAULT 0,      -- 5e. Totaal te betalen
  box5f_total_refund int NOT NULL DEFAULT 0,       -- 5f. Totaal terug te ontvangen

  filed_at timestamptz,
  filed_by uuid REFERENCES staff(id),
  notes text,
  locked boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(period_type, year, period)
);

CREATE TRIGGER vat_returns_updated_at
  BEFORE UPDATE ON vat_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read vat_returns"
  ON vat_returns FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.active)
  );

CREATE POLICY "Admin can manage vat_returns"
  ON vat_returns FOR ALL USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role = 'admin')
  );

CREATE INDEX vat_returns_year_period_idx ON vat_returns (year, period);
CREATE INDEX vat_returns_status_idx ON vat_returns (status);
