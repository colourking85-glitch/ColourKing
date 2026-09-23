-- 0054: Project portfolio (PF05/PF01/PF10) — completed repairs shown in the
-- public gallery. See docs/portfolio-implementation-plan.md.
--
-- Public photos are licence-plate redacted in the browser before upload;
-- only redacted files ever reach the portfolio-public bucket.

-- ── Number range: Projectdossier, CK-YYWWNN (e.g. CK-263901) ────────────────
-- The row holds the prefix (editable in SY03); numbering is per ISO week,
-- see portfolio_assign_dossier_number() below.
INSERT INTO number_ranges (doc_type, year, prefix, next_number)
VALUES ('project_dossier', extract(year from now())::int, 'CK', 1)
ON CONFLICT (doc_type, year) DO NOTHING;

-- ── Dossiers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_number        text UNIQUE,
  status                text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'archived')),
  category              text NOT NULL DEFAULT 'bodywork'
                        CHECK (category IN ('bodywork', 'paint', 'spot_repair')),
  title_nl              text NOT NULL DEFAULT '',
  title_en              text,
  title_tr              text,
  summary_nl            text,
  summary_en            text,
  summary_tr            text,
  brand_id              uuid REFERENCES vehicle_brands(id) ON DELETE SET NULL,
  model_id              uuid REFERENCES vehicle_models(id) ON DELETE SET NULL,
  model_free_text       text,
  build_year            int CHECK (build_year IS NULL OR build_year BETWEEN 1900 AND 2100),
  colour_name           text,
  paint_code            text,
  work_items            text[] NOT NULL DEFAULT '{}',
  duration_working_days int CHECK (duration_working_days IS NULL OR duration_working_days >= 0),
  handling              text CHECK (handling IN ('insurance', 'private', 'lease', 'fleet')),
  job_id                uuid UNIQUE REFERENCES jobs(id) ON DELETE SET NULL,
  source                text NOT NULL DEFAULT 'manual' CHECK (source IN ('work_order', 'manual')),
  converted_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at          timestamptz,
  consent_status        text NOT NULL DEFAULT 'pending'
                        CHECK (consent_status IN ('received', 'not_required', 'pending')),
  consent_document_id   uuid REFERENCES documents(id) ON DELETE SET NULL,
  featured              boolean NOT NULL DEFAULT false,
  sort_order            int NOT NULL DEFAULT 0,
  published_at          timestamptz,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);

CREATE INDEX IF NOT EXISTS portfolio_projects_public_idx
  ON portfolio_projects (status, sort_order, published_at DESC)
  WHERE deleted_at IS NULL;

-- ── Photos (redacted only) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              uuid NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
  phase                   photo_phase NOT NULL DEFAULT 'after',
  pair_group              int,
  storage_path            text NOT NULL,
  width                   int,
  height                  int,
  is_cover                boolean NOT NULL DEFAULT false,
  sort_order              int NOT NULL DEFAULT 0,
  source_job_photo_id     uuid REFERENCES job_photos(id) ON DELETE SET NULL,
  redaction_regions       jsonb NOT NULL DEFAULT '[]',
  redaction_confirmed_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redaction_confirmed_at  timestamptz,
  alt_nl                  text,
  alt_en                  text,
  alt_tr                  text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_photos_project_idx ON portfolio_photos (project_id, sort_order);

-- ── updated_at ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION portfolio_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS portfolio_projects_updated_at ON portfolio_projects;
CREATE TRIGGER portfolio_projects_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW EXECUTE FUNCTION portfolio_touch_updated_at();

-- ── Dossier number: allocate once, atomically ───────────────────────────────
-- Format PREFIX-YYWWNN: 2-digit ISO year + ISO week of the dossier's creation
-- (Europe/Amsterdam) + sequence within that week (01, 02, … ; 3 digits only
-- if a week ever exceeds 99). Locks the dossier row and the range row, so
-- double clicks and parallel conversions can't produce duplicates.
CREATE OR REPLACE FUNCTION portfolio_assign_dossier_number(p_project_id uuid)
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  v_number  text;
  v_created timestamptz;
  v_prefix  text;
  v_yyww    text;
  v_seq     int;
BEGIN
  SELECT dossier_number, created_at INTO v_number, v_created
  FROM portfolio_projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'portfolio project % not found', p_project_id;
  END IF;

  IF v_number IS NOT NULL THEN
    RETURN v_number;
  END IF;

  -- Serialize allocations on the range row; its prefix is managed in SY03
  SELECT prefix INTO v_prefix
  FROM number_ranges
  WHERE doc_type = 'project_dossier'
  ORDER BY year DESC
  LIMIT 1
  FOR UPDATE;
  v_prefix := coalesce(v_prefix, 'CK');

  v_yyww := to_char(v_created AT TIME ZONE 'Europe/Amsterdam', 'IYIW');

  SELECT coalesce(max(substring(dossier_number FROM length(v_prefix) + 6)::int), 0) + 1
  INTO v_seq
  FROM portfolio_projects
  WHERE dossier_number LIKE v_prefix || '-' || v_yyww || '%';

  v_number := v_prefix || '-' || v_yyww || lpad(v_seq::text, 2, '0');
  UPDATE portfolio_projects SET dossier_number = v_number WHERE id = p_project_id;
  RETURN v_number;
END $$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage portfolio_projects" ON portfolio_projects;
CREATE POLICY "staff manage portfolio_projects" ON portfolio_projects
  FOR ALL USING (is_office_or_admin_staff()) WITH CHECK (is_office_or_admin_staff());

DROP POLICY IF EXISTS "public read published portfolio_projects" ON portfolio_projects;
CREATE POLICY "public read published portfolio_projects" ON portfolio_projects
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "staff manage portfolio_photos" ON portfolio_photos;
CREATE POLICY "staff manage portfolio_photos" ON portfolio_photos
  FOR ALL USING (is_office_or_admin_staff()) WITH CHECK (is_office_or_admin_staff());

DROP POLICY IF EXISTS "public read published portfolio_photos" ON portfolio_photos;
CREATE POLICY "public read published portfolio_photos" ON portfolio_photos
  FOR SELECT TO anon, authenticated
  USING (
    redaction_confirmed_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM portfolio_projects p
      WHERE p.id = project_id AND p.status = 'published' AND p.deleted_at IS NULL
    )
  );

GRANT SELECT ON portfolio_projects, portfolio_photos TO anon;
GRANT ALL ON portfolio_projects, portfolio_photos TO authenticated;

-- ── Storage: redacted public images only ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio-public', 'portfolio-public', true, 5242880, ARRAY['image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
