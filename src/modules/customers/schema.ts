import { z } from 'zod';

// ── Customer types & statuses (match DB enums after migration) ──

export const CUSTOMER_TYPES = [
  'private','sme','corporate_fleet','lease_company','rental',
  'taxi_transport','dealer','bodyshop_partner','insurer',
  'insurance_intermediary','government',
] as const;

export const CUSTOMER_STATUSES = [
  'prospect','active','suspended','blocked','ended',
] as const;

// ── Main customer schema ──

export const CustomerSchema = z.object({
  type: z.enum(CUSTOMER_TYPES).default('private'),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  name: z.string().min(1, 'Naam is verplicht'),
  legal_name: z.string().nullable().optional(),
  trade_name: z.string().nullable().optional(),
  legal_form: z.enum(['bv','nv','vof','eenmanszaak','stichting','cv','foreign','other']).nullable().optional(),
  parent_customer_id: z.string().uuid().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  kvk_number: z.string().regex(/^\d{8}$/, 'KVK must be 8 digits').nullable().optional(),
  vestigingsnummer: z.string().regex(/^\d{12}$/, 'Vestigingsnummer must be 12 digits').nullable().optional(),
  btw_id: z.string().regex(/^[A-Z]{2}[A-Z0-9]{2,12}$/, 'Invalid BTW format').nullable().optional(),
  btw_number: z.string().nullable().optional(),
  vat_treatment: z.enum(['nl_standard','eu_reverse_charge','non_eu','exempt']).nullable().optional(),
  website: z.string().url().nullable().optional(),
  customer_since: z.string().nullable().optional(),
  account_manager_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  workshop_instructions: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  preferred_language: z.enum(['nl','en','tr','bg','de']).optional(),
  preferred_channel: z.enum(['email','phone','whatsapp','portal']).nullable().optional(),
  fleet_size: z.number().int().min(0).nullable().optional(),
  fleet_profile: z.string().nullable().optional(),
  typical_damage_profile: z.string().nullable().optional(),
  strategic_value: z.enum(['key','growth','maintain','exit']).nullable().optional(),
  relationship_score_manual: z.number().int().min(1).max(5).nullable().optional(),
  locale: z.enum(['nl', 'en', 'tr']).default('nl'),
  notes: z.string().nullable().optional(),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

// ── Contact schema ──

export const ContactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['fleet_manager','damage_coordinator','accounts_payable','signatory','procurement','driver_support','driver','other']).default('other'),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  preferred_channel: z.enum(['email','phone','whatsapp','portal']).nullable().optional(),
  authority_limit_eur: z.number().int().min(0).nullable().optional(),
  is_primary: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

// ── Address schema ──

export const AddressSchema = z.object({
  type: z.enum(['registered','invoice','pickup_delivery']).default('registered'),
  street: z.string().nullable().optional(),
  house_no: z.string().nullable().optional(),
  addition: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().length(2).default('NL'),
  pickup_windows: z.any().nullable().optional(),
  is_default: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof AddressSchema>;

// ── Billing schema ──

export const BillingSchema = z.object({
  payment_terms_days: z.number().int().min(0).optional(),
  invoicing_mode: z.enum(['per_job','weekly_collective','monthly_collective']).optional(),
  po_required: z.boolean().optional(),
  peppol_id: z.string().nullable().optional(),
  portal_upload_url: z.string().url().nullable().optional(),
  invoice_email: z.string().email().nullable().optional(),
  iban: z.string().nullable().optional(),
  credit_limit_eur: z.number().int().min(0).nullable().optional(),
  external_credit_rating: z.string().nullable().optional(),
  external_credit_source: z.string().nullable().optional(),
  external_credit_date: z.string().nullable().optional(),
});

export type BillingInput = z.infer<typeof BillingSchema>;

// ── Insurance relation schema ──

export const InsuranceRelationSchema = z.object({
  party_type: z.enum(['insurer','lease_company','intermediary']),
  party_customer_id: z.string().uuid().nullable().optional(),
  party_name: z.string().nullable().optional(),
  default_payer: z.enum(['customer','insurer','split','lease','third_party']).default('customer'),
  notes: z.string().nullable().optional(),
});

export type InsuranceRelationInput = z.infer<typeof InsuranceRelationSchema>;

// ── Consent schema ──

export const ConsentSchema = z.object({
  contact_id: z.string().uuid().nullable().optional(),
  channel: z.enum(['email','sms','whatsapp','phone']),
  purpose: z.enum(['marketing','review_request','service_reminder','seasonal']),
  basis: z.enum(['consent','contract','legitimate_interest']),
  granted_at: z.string().optional(),
  withdrawn_at: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
});

export type ConsentInput = z.infer<typeof ConsentSchema>;

// ── Note schema ──

export const NoteSchema = z.object({
  body: z.string().min(1),
  pinned: z.boolean().optional(),
});

export type NoteInput = z.infer<typeof NoteSchema>;

// ── Activity schema ──

export const ActivitySchema = z.object({
  type: z.enum(['call','email','visit','whatsapp','system']),
  occurred_at: z.string().optional(),
  summary: z.string().min(1),
  ref_table: z.string().nullable().optional(),
  ref_id: z.string().uuid().nullable().optional(),
});

export type ActivityInput = z.infer<typeof ActivitySchema>;

// ── Credit hold schema ──

export const CreditHoldSchema = z.object({
  credit_hold: z.boolean(),
  reason: z.string().optional(),
});

export type CreditHoldInput = z.infer<typeof CreditHoldSchema>;
