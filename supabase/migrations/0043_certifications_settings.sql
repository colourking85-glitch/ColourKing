-- Insert default certifications settings row
INSERT INTO settings (key, value)
VALUES (
  'certifications',
  '{
    "bovag": false,
    "rdw_apk": false,
    "erkend_leerbedrijf": false,
    "erkend_duurzaam": false,
    "paint_system": "",
    "insurer_partners": "",
    "google_review_score": "",
    "google_review_count": 0,
    "response_sla_hours": 0,
    "show_replacement_vehicle": false,
    "show_pickup_delivery": false
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
