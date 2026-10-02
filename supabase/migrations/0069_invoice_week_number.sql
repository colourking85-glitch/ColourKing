-- 0069: Change invoice/credit-note numbering to week-based format
-- Format: PREFIX-YYwwNN (e.g. IN-264001 = year 26, week 40, sequence 01)
-- Matches the CK dossier pattern (CK-264001)
-- Other doc types keep the existing PREFIX-YYNNNNN format.

CREATE OR REPLACE FUNCTION allocate_number(p_doc_type doc_type, p_year int DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year   int;
  v_prefix text;
  v_num    int;
  v_yyww   text;
  v_seq    int;
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

  -- Invoice and credit note: week-based format PREFIX-YYwwNN
  IF p_doc_type IN ('invoice', 'credit_note') THEN
    v_yyww := to_char(now() AT TIME ZONE 'Europe/Amsterdam', 'IYIW');

    SELECT coalesce(max(substring(invoice_number FROM length(v_prefix) + 6)::int), 0) + 1
    INTO v_seq
    FROM invoices
    WHERE invoice_number LIKE v_prefix || '-' || v_yyww || '%';

    RETURN v_prefix || '-' || v_yyww || lpad(v_seq::text, 2, '0');
  END IF;

  -- All other doc types: PREFIX-YYNNNNN
  RETURN v_prefix || '-' || right(v_year::text, 2) || lpad(v_num::text, 4, '0');
END;
$$;
