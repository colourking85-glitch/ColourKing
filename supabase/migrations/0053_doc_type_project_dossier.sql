-- 0053: Number range type for project dossiers (PF module).
-- Separate migration: a new enum value cannot be used in the same
-- transaction that adds it (0054 seeds the range and uses it).
ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'project_dossier';
