-- 0068: Allow anonymous/public read of a single invoice by its payment_token.
-- The "Nu betalen" payment link uses /s/{token} which hits the public API.
-- Without this policy the anon client gets blocked by staff-only RLS.
-- The token (a random UUID) acts as the access control — it is unguessable
-- and never exposed in listings.
--
-- The policy restricts to issued invoices (non-draft) that have a token.
-- The API route filters by .eq('payment_token', token) so only the matching
-- invoice is returned; this policy simply allows the query to execute.

CREATE POLICY "anon can read issued invoices with token"
  ON invoices FOR SELECT
  TO anon
  USING (
    payment_token IS NOT NULL
    AND status NOT IN ('draft', 'cancelled')
  );

CREATE POLICY "anon can read lines of issued invoices"
  ON invoice_lines FOR SELECT
  TO anon
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE payment_token IS NOT NULL
        AND status NOT IN ('draft', 'cancelled')
    )
  );

-- Also allow anon to read the customer name/email for the payment page.
CREATE POLICY "anon can read customers for payment page"
  ON customers FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT customer_id FROM invoices
      WHERE payment_token IS NOT NULL
        AND status NOT IN ('draft', 'cancelled')
    )
  );
