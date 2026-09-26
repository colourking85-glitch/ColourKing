-- ============================================================
-- 0059: Customer 360 — Phase 1b: Backfill enums + new tables
-- ============================================================
-- Must run AFTER 0058 commits (enum values need committed transaction).
-- DOWN MIGRATION:
-- DROP TABLE IF EXISTS customer_audit_log, customer_activities, customer_notes,
--   customer_documents, customer_consents, customer_insurance_relations,
--   customer_billing, customer_agreements, customer_addresses, customer_contacts CASCADE;
-- DROP TYPE IF EXISTS contact_role, address_type, agreement_status, ...;

-- ── Backfill customer_type renames ─────────────────────────

UPDATE customers SET type = 'sme' WHERE type = 'company';
UPDATE customers SET type = 'corporate_fleet' WHERE type = 'fleet';

-- ── Backfill customer_status renames ───────────────────────

UPDATE customers SET status = 'suspended' WHERE status = 'inactive';

-- ── New enums for sub-tables ───────────────────────────────

DO $$ BEGIN
  CREATE TYPE contact_role AS ENUM (
    'fleet_manager','damage_coordinator','accounts_payable','signatory',
    'procurement','driver_support','driver','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE address_type AS ENUM ('registered','invoice','pickup_delivery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE agreement_status AS ENUM ('draft','active','expired','superseded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE paint_material_method AS ENUM ('pct_of_list','per_m2','index');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE calculation_system AS ENUM ('audatex_qapter','silverdat','autotaal','none');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE repair_network AS ENUM ('none','schadegarant','topherstel','other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE replacement_vehicle_policy AS ENUM ('included','charged','customer_supplies','none');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE excess_handling AS ENUM ('customer_pays_us','insurer_deducts','invoice_driver','n_a');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invoicing_mode AS ENUM ('per_job','weekly_collective','monthly_collective');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE insurance_party_type AS ENUM ('insurer','lease_company','intermediary');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE default_payer AS ENUM ('customer','insurer','split','lease','third_party');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_channel AS ENUM ('email','sms','whatsapp','phone');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_purpose AS ENUM ('marketing','review_request','service_reminder','seasonal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_basis AS ENUM ('consent','contract','legitimate_interest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_document_type AS ENUM ('kvk_extract','contract','rate_card','insurance_certificate','other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('call','email','visit','whatsapp','system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_ownership AS ENUM ('owned','leased','rental','unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 1. customer_contacts ───────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  role            contact_role DEFAULT 'other',
  phone           text,
  mobile          text,
  whatsapp        text,
  email           text,
  preferred_channel preferred_channel,
  authority_limit_eur int,
  is_primary      bool DEFAULT false,
  notes           text,
  active          bool DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_contacts_primary_unique
  ON customer_contacts (customer_id) WHERE is_primary = true AND active = true;

CREATE INDEX IF NOT EXISTS customer_contacts_customer_idx
  ON customer_contacts (customer_id);

ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_contacts"
  ON customer_contacts FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_contacts"
  ON customer_contacts FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- ── 2. customer_addresses ──────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type            address_type DEFAULT 'registered',
  street          text,
  house_no        text,
  addition        text,
  postal_code     text,
  city            text,
  country         char(2) DEFAULT 'NL',
  lat             numeric,
  lng             numeric,
  distance_km     numeric,
  travel_min      int,
  pickup_windows  jsonb,
  is_default      bool DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx
  ON customer_addresses (customer_id);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_addresses"
  ON customer_addresses FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_addresses"
  ON customer_addresses FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- ── 3. customer_agreements ─────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_agreements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  version         int NOT NULL DEFAULT 1,
  status          agreement_status DEFAULT 'draft',
  valid_from      date,
  valid_to        date,
  labour_rates    jsonb DEFAULT '{}',
  paint_material_method paint_material_method,
  paint_material_value  int,
  discount_parts_pct    numeric,
  discount_labour_pct   numeric,
  calculation_system    calculation_system DEFAULT 'none',
  network               repair_network DEFAULT 'none',
  repairer_code         text,
  authorisation_threshold_eur int,
  replacement_vehicle_policy  replacement_vehicle_policy DEFAULT 'none',
  excess_handling       excess_handling DEFAULT 'n_a',
  sla                   jsonb DEFAULT '{}',
  contract_document_id  uuid,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  created_by            uuid REFERENCES staff(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_agreements_active_unique
  ON customer_agreements (customer_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS customer_agreements_customer_idx
  ON customer_agreements (customer_id);

ALTER TABLE customer_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_agreements"
  ON customer_agreements FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_agreements"
  ON customer_agreements FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- ── 4. customer_billing (1:1) ──────────────────────────────

CREATE TABLE IF NOT EXISTS customer_billing (
  customer_id         uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  payment_terms_days  int DEFAULT 14,
  invoicing_mode      invoicing_mode DEFAULT 'per_job',
  po_required         bool DEFAULT false,
  peppol_id           text,
  portal_upload_url   text,
  invoice_email       text,
  iban                text,
  credit_limit_eur    int,
  external_credit_rating  text,
  external_credit_source  text,
  external_credit_date    date,
  credit_hold         bool DEFAULT false,
  credit_hold_reason  text,
  credit_hold_set_by  uuid REFERENCES staff(id),
  credit_hold_set_at  timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE customer_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_billing"
  ON customer_billing FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_billing"
  ON customer_billing FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- ── 5. customer_insurance_relations ────────────────────────

CREATE TABLE IF NOT EXISTS customer_insurance_relations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  party_type          insurance_party_type NOT NULL,
  party_customer_id   uuid REFERENCES customers(id),
  party_name          text,
  default_payer       default_payer DEFAULT 'customer',
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_insurance_relations_customer_idx
  ON customer_insurance_relations (customer_id);

ALTER TABLE customer_insurance_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_insurance_relations"
  ON customer_insurance_relations FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_insurance_relations"
  ON customer_insurance_relations FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- ── 6. customer_consents (append-only) ─────────────────────

CREATE TABLE IF NOT EXISTS customer_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES customer_contacts(id),
  channel         consent_channel NOT NULL,
  purpose         consent_purpose NOT NULL,
  basis           consent_basis NOT NULL,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  withdrawn_at    timestamptz,
  source          text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_consents_customer_idx
  ON customer_consents (customer_id);

ALTER TABLE customer_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_consents"
  ON customer_consents FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can insert customer_consents"
  ON customer_consents FOR INSERT WITH CHECK (is_active_staff());

-- ── 7. customer_documents ──────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type            customer_document_type DEFAULT 'other',
  storage_path    text NOT NULL,
  file_name       text NOT NULL,
  mime            text,
  size            int,
  uploaded_by     uuid REFERENCES staff(id),
  uploaded_at     timestamptz DEFAULT now(),
  expires_at      timestamptz
);

CREATE INDEX IF NOT EXISTS customer_documents_customer_idx
  ON customer_documents (customer_id);

ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_documents"
  ON customer_documents FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_documents"
  ON customer_documents FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- Add FK from agreements to documents now that customer_documents exists
ALTER TABLE customer_agreements
  ADD CONSTRAINT customer_agreements_contract_doc_fk
    FOREIGN KEY (contract_document_id) REFERENCES customer_documents(id);

-- ── 8. customer_notes ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  body            text NOT NULL,
  pinned          bool DEFAULT false,
  author          uuid REFERENCES staff(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_notes_customer_idx
  ON customer_notes (customer_id);

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_notes"
  ON customer_notes FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_notes"
  ON customer_notes FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- ── 9. customer_activities ─────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_activities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type            activity_type NOT NULL DEFAULT 'system',
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  summary         text NOT NULL,
  ref_table       text,
  ref_id          uuid,
  author          uuid REFERENCES staff(id),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_activities_customer_idx
  ON customer_activities (customer_id);
CREATE INDEX IF NOT EXISTS customer_activities_occurred_idx
  ON customer_activities (customer_id, occurred_at DESC);

ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_activities"
  ON customer_activities FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can manage customer_activities"
  ON customer_activities FOR ALL USING (is_active_staff()) WITH CHECK (is_active_staff());

-- ── 10. customer_audit_log (append-only) ───────────────────

CREATE TABLE IF NOT EXISTS customer_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  table_name      text NOT NULL,
  record_id       uuid NOT NULL,
  action          text NOT NULL,
  old_data        jsonb,
  new_data        jsonb,
  changed_by      uuid,
  changed_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_audit_log_customer_idx
  ON customer_audit_log (customer_id);

ALTER TABLE customer_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read customer_audit_log"
  ON customer_audit_log FOR SELECT USING (is_active_staff());
CREATE POLICY "staff can insert customer_audit_log"
  ON customer_audit_log FOR INSERT WITH CHECK (is_active_staff());

-- ── 11. Vehicle FKs ────────────────────────────────────────

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS lease_company_id   uuid REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS insurer_id         uuid REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS driver_contact_id  uuid REFERENCES customer_contacts(id),
  ADD COLUMN IF NOT EXISTS ownership          vehicle_ownership DEFAULT 'unknown';

-- ── 12. updated_at trigger for new tables ──────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'customer_contacts','customer_addresses','customer_agreements',
    'customer_billing','customer_insurance_relations','customer_notes'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 13. Supabase Storage bucket ────────────────────────────
-- Run manually in Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('customer-docs', 'customer-docs', false);
