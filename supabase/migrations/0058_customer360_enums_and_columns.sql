-- ============================================================
-- 0058: Customer 360 — Phase 1a: Enums + extend customers table
-- ============================================================
-- DOWN MIGRATION:
-- ALTER TABLE customers DROP COLUMN IF EXISTS customer_no, legal_name, trade_name, ...;
-- (full column list at bottom of this file)
-- DROP TYPE IF EXISTS legal_form, vat_treatment, preferred_language, preferred_channel, strategic_value;
-- Note: Postgres cannot remove individual enum values from customer_type/customer_status.

-- ── New enums ──────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE legal_form AS ENUM (
    'bv','nv','vof','eenmanszaak','stichting','cv','foreign','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vat_treatment AS ENUM (
    'nl_standard','eu_reverse_charge','non_eu','exempt'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE preferred_language AS ENUM ('nl','en','tr','bg','de');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE preferred_channel AS ENUM ('email','phone','whatsapp','portal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE strategic_value AS ENUM ('key','growth','maintain','exit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Extend customer_status enum ────────────────────────────

ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'prospect';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'ended';

-- ── Extend customer_type enum ──────────────────────────────

ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'sme';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'corporate_fleet';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'lease_company';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'rental';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'taxi_transport';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'bodyshop_partner';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'insurer';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'insurance_intermediary';
ALTER TYPE customer_type ADD VALUE IF NOT EXISTS 'government';

-- ── Extend customers table ─────────────────────────────────

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS customer_no        text,
  ADD COLUMN IF NOT EXISTS legal_name         text,
  ADD COLUMN IF NOT EXISTS trade_name         text,
  ADD COLUMN IF NOT EXISTS legal_form         legal_form,
  ADD COLUMN IF NOT EXISTS parent_customer_id uuid REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS vestigingsnummer   text,
  ADD COLUMN IF NOT EXISTS btw_id             text,
  ADD COLUMN IF NOT EXISTS btw_verified_at    timestamptz,
  ADD COLUMN IF NOT EXISTS vies_consultation_no text,
  ADD COLUMN IF NOT EXISTS vat_treatment      vat_treatment DEFAULT 'nl_standard',
  ADD COLUMN IF NOT EXISTS website            text,
  ADD COLUMN IF NOT EXISTS customer_since     date,
  ADD COLUMN IF NOT EXISTS account_manager_id uuid REFERENCES staff(id),
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS workshop_instructions text,
  ADD COLUMN IF NOT EXISTS tags               text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_language  preferred_language DEFAULT 'nl',
  ADD COLUMN IF NOT EXISTS preferred_channel   preferred_channel,
  ADD COLUMN IF NOT EXISTS fleet_size          int,
  ADD COLUMN IF NOT EXISTS fleet_profile       text,
  ADD COLUMN IF NOT EXISTS typical_damage_profile text,
  ADD COLUMN IF NOT EXISTS strategic_value     strategic_value,
  ADD COLUMN IF NOT EXISTS relationship_score_manual smallint,
  ADD COLUMN IF NOT EXISTS relationship_reviewed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS relationship_reviewed_by  uuid REFERENCES staff(id),
  ADD COLUMN IF NOT EXISTS created_by          uuid REFERENCES staff(id),
  ADD COLUMN IF NOT EXISTS updated_by          uuid REFERENCES staff(id);

-- ── Check constraints ──────────────────────────────────────

ALTER TABLE customers
  ADD CONSTRAINT chk_kvk_format
    CHECK (kvk_number IS NULL OR kvk_number ~ '^\d{8}$'),
  ADD CONSTRAINT chk_btw_id_format
    CHECK (btw_id IS NULL OR btw_id ~ '^[A-Z]{2}[A-Z0-9]{2,12}$'),
  ADD CONSTRAINT chk_vestiging_format
    CHECK (vestigingsnummer IS NULL OR vestigingsnummer ~ '^\d{12}$'),
  ADD CONSTRAINT chk_relationship_score_range
    CHECK (relationship_score_manual IS NULL OR relationship_score_manual BETWEEN 1 AND 5);

-- ── Unique indexes for deduplication ───────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_no_key
  ON customers (customer_no) WHERE customer_no IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_kvk_unique
  ON customers (kvk_number) WHERE kvk_number IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_btw_id_unique
  ON customers (btw_id) WHERE btw_id IS NOT NULL AND deleted_at IS NULL;

-- ── Backfill customer_no sequence ──────────────────────────

DO $$
DECLARE
  r RECORD;
  seq int := 0;
BEGIN
  FOR r IN
    SELECT id FROM customers
    WHERE customer_no IS NULL
    ORDER BY created_at
  LOOP
    seq := seq + 1;
    UPDATE customers
      SET customer_no = 'CUS-' || lpad(seq::text, 6, '0')
      WHERE id = r.id;
  END LOOP;
END $$;

-- Make customer_no NOT NULL after backfill
ALTER TABLE customers ALTER COLUMN customer_no SET NOT NULL;

-- ── Backfill btw_id from btw_number ────────────────────────

UPDATE customers
  SET btw_id = btw_number
  WHERE btw_number IS NOT NULL AND btw_id IS NULL
    AND btw_number ~ '^[A-Z]{2}[A-Z0-9]{2,12}$';

-- ── Backfill enum migrations ───────────────────────────────
-- These run in a separate transaction since ALTER TYPE ... ADD VALUE
-- must commit before the values can be used in DML.

-- (Run separately after this migration commits — see 0059)
