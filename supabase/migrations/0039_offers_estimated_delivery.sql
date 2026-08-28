-- 0039: add estimated delivery date to offers
-- Delivery estimate belongs on the quote/offer, not the job.

ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz;

COMMENT ON COLUMN offers.estimated_delivery_at IS 'Estimated date/time when the vehicle will be ready for delivery';
