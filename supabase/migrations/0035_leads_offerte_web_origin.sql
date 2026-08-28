-- Update existing leads from the /offerte quote form to use 'Offerte-Web' origin
update leads
set origin = 'Offerte-Web'
where channel = 'quote_form'
  and origin = 'website';
