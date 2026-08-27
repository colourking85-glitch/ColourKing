-- 0027: Add status to customers
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blocked');

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS status customer_status NOT NULL DEFAULT 'active';

CREATE INDEX idx_customers_status ON customers (status);
