-- 0058 made customers.customer_no NOT NULL and back-filled CUS-000001.. but never
-- assigned numbers to new rows, so every insert failed. Assign from a sequence.

CREATE SEQUENCE IF NOT EXISTS customers_customer_no_seq;

-- Continue after the highest existing CUS-nnnnnn
SELECT setval(
  'customers_customer_no_seq',
  COALESCE((SELECT max(substring(customer_no from '^CUS-(\d+)$')::int) FROM customers WHERE customer_no ~ '^CUS-\d+$'), 0) + 1,
  false
);

CREATE OR REPLACE FUNCTION customers_assign_customer_no()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.customer_no IS NULL OR NEW.customer_no = '' THEN
    NEW.customer_no := 'CUS-' || lpad(nextval('customers_customer_no_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_assign_customer_no ON customers;
CREATE TRIGGER customers_assign_customer_no
  BEFORE INSERT ON customers
  FOR EACH ROW EXECUTE FUNCTION customers_assign_customer_no();
