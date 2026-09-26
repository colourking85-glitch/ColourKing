-- Seed company settings with Colourking's real data
INSERT INTO settings (key, value)
VALUES (
  'company',
  '{
    "name": "Colourking",
    "legal_name": "Autospuitbedrijf Colour King",
    "address": "Satijnbloem 6",
    "postcode": "3068 JP",
    "city": "Rotterdam",
    "country": "NL",
    "phone": "0681631020",
    "email": "info@colourking.nl",
    "website": "colourking.nl",
    "kvk": "82199884",
    "vat_number": "NL003653356B56",
    "iban": "NL12 INGB 0675 6533 04",
    "bic": "INGBNL2A",
    "bank_name": "ING Bank",
    "payment_terms_days": 14,
    "quote_validity_days": 30,
    "default_invoice_notes": ""
  }'::jsonb
)
ON CONFLICT (key)
DO UPDATE SET value = EXCLUDED.value;
