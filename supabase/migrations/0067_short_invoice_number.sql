-- 0067: Shorten allocate_number format from PREFIX-YYYY-NNNNN to PREFIX-YYNNNNN
-- Example: IN-2026-00001 → IN-260001
-- Matches the project dossier style (CK-263901)

CREATE OR REPLACE FUNCTION allocate_number(p_doc_type doc_type, p_year int DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year   int;
  v_prefix text;
  v_num    int;
BEGIN
  v_year := coalesce(p_year, extract(year FROM now())::int);

  SELECT prefix, next_number INTO v_prefix, v_num
  FROM number_ranges
  WHERE doc_type = p_doc_type AND year = v_year
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT prefix INTO v_prefix
    FROM number_ranges
    WHERE doc_type = p_doc_type
    ORDER BY year DESC LIMIT 1;

    IF v_prefix IS NULL THEN
      v_prefix := upper(left(p_doc_type::text, 3));
    END IF;

    INSERT INTO number_ranges (doc_type, year, prefix, next_number)
    VALUES (p_doc_type, v_year, v_prefix, 2)
    RETURNING next_number - 1 INTO v_num;
  ELSE
    UPDATE number_ranges
    SET next_number = next_number + 1
    WHERE doc_type = p_doc_type AND year = v_year;
  END IF;

  -- Short format: PREFIX-YYNNNNN (e.g. IN-260001)
  RETURN v_prefix || '-' || right(v_year::text, 2) || lpad(v_num::text, 4, '0');
END;
$$;
