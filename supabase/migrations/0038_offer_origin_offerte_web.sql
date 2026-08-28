-- 0038: add 'Offerte-Web' to offer_origin enum
-- Allows quotes created from public offerte page leads to keep their origin.

ALTER TYPE offer_origin ADD VALUE IF NOT EXISTS 'Offerte-Web';
