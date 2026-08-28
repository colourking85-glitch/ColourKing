// Auto-generated types — reflects migrations 0001-0036.
// Regenerate after every migration: supabase gen types typescript --local > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StaffRole = 'admin' | 'office' | 'tech';
export type CustomerType = 'private' | 'company' | 'fleet' | 'dealer';
export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
export type OfferType = 'offer' | 'supplement';
export type OfferStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'superseded';
export type OfferOrigin = 'website' | 'manual' | 'phone' | 'email' | 'walk_in' | 'Offerte-Web';
export type JobStage = 'intake' | 'quoted' | 'approved' | 'scheduled' | 'checked_in' | 'in_progress' | 'qc' | 'ready' | 'delivered' | 'closed';
export type JobEventType = 'stage_change' | 'note' | 'photo_added' | 'part_ordered' | 'part_received' | 'task_completed' | 'document_issued' | 'payment_received' | 'assignment_change';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type PhotoPhase = 'before' | 'during' | 'after';
export type PartStatus = 'needed' | 'ordered' | 'shipped' | 'received' | 'returned';
export type AppointmentType = 'inspection' | 'drop_off' | 'collection' | 'repair_slot';
export type AppointmentStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed';
export type ResourceType = 'bay' | 'booth' | 'staff';
export type DocType = 'offer' | 'repair_order' | 'handover_note' | 'invoice' | 'credit_note';
export type DocStatus = 'draft' | 'issued' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'credited';
export type PaymentMethod = 'ideal' | 'bank_transfer' | 'cash' | 'card' | 'mollie';
export type OfferLineKind = 'labour' | 'part' | 'material' | 'other';
export type JobType = 'bodywork' | 'mechanical' | 'paint' | 'electrical' | 'diagnostics' | 'apk' | 'maintenance';
export type JobPriority = 'normal' | 'urgent' | 'rush';
export type PayerType = 'casco' | 'wa' | 'particulier' | 'lease';
export interface LabourRate {
  id: string;
  name: string;
  kind: OfferLineKind;
  payer_type: PayerType | null;
  description: string | null;
  unit: string;
  unit_price_cents: number;
  tax_code: TaxCode;
  is_default: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type VatReturnStatus = 'open' | 'draft' | 'filed' | 'corrected';
export type VatPeriodType = 'quarter' | 'month';
export type TaxCode = 'H21' | 'L9' | 'N0' | 'V0' | 'M0' | 'ICP' | 'EX';
export type NotificationType = 'new_lead' | 'stage_change' | 'new_email' | 'appointment_confirmed' | 'appointment_cancelled' | 'part_received' | 'payment_received' | 'document_issued' | 'system';
export type NoteEntityType = 'job' | 'lead' | 'customer' | 'vehicle' | 'invoice' | 'offer';

export interface InternalNote {
  id: string;
  entity_type: NoteEntityType;
  entity_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  locale: string;
  colour: string | null;
  weekly_hours: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  key: string;
  value: Json;
  created_at: string;
  updated_at: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  country: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  locale: string;
  notes: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  kenteken: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  paint_code: string | null;
  fuel: string | null;
  body_type: string | null;
  rdw_snapshot: Json | null;
  wok: boolean;
  notes: string | null;
  plate_origin: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Lead {
  id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  kenteken: string | null;
  damage_description: string | null;
  origin: string;
  assigned_to: string | null;
  notes: string | null;
  preferred_date: string | null;
  channel: string | null;
  locale: string;
  status: LeadStatus;
  lost_reason: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_colour: string | null;
  vehicle_vin: string | null;
  paint_code: string | null;
  is_foreign_plate: boolean;
  service_types: string[];
  repair_locations: string[];
  rdw_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface LeadPhoto {
  id: string;
  lead_id: string;
  storage_path: string;
  created_at: string;
}

export interface Notification {
  id: string;
  staff_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  ref_type: string | null;
  ref_id: string | null;
  read: boolean;
  created_at: string;
}

export interface NumberRange {
  id: string;
  doc_type: DocType;
  year: number;
  prefix: string;
  next_number: number;
  created_at: string;
}

export interface Document {
  id: string;
  doc_type: DocType;
  doc_number: string | null;
  status: DocStatus;
  supersedes_id: string | null;
  job_id: string | null;
  offer_id: string | null;
  invoice_id: string | null;
  customer_id: string;
  vehicle_id: string | null;
  locale: string;
  payload: Json | null;
  pdf_path: string | null;
  pdf_sha256: string | null;
  issued_at: string | null;
  issued_by: string | null;
  sent_at: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  signature_path: string | null;
  signed_ip: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  gallery_consent: boolean | null;
  share_token: string | null;
  share_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  type: OfferType;
  status: OfferStatus;
  origin: OfferOrigin;
  offer_number: string | null;
  customer_id: string;
  vehicle_id: string | null;
  lead_id: string | null;
  job_id: string | null;
  parent_offer_id: string | null;
  supersedes_id: string | null;
  locale: string;
  valid_until: string | null;
  notes: string | null;
  payer_type: PayerType | null;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  discount_cents: number;
  approved_at: string | null;
  approved_by_name: string | null;
  approved_ip: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferLine {
  id: string;
  offer_id: string;
  sort_order: number;
  kind: OfferLineKind;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  discount_pct: number;
  line_total_cents: number;
  tax_code: TaxCode;
  vat_amount_cents: number;
  part_number: string | null;
  created_at: string;
}

export interface Part {
  id: string;
  job_id: string;
  offer_line_id: string | null;
  description: string;
  part_number: string | null;
  supplier: string | null;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  status: PartStatus;
  ordered_at: string | null;
  expected_at: string | null;
  received_at: string | null;
  blocking: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  capacity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  created_at: string;
}

export interface Blackout {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  resource_id: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  customer_id: string | null;
  vehicle_id: string | null;
  job_id: string | null;
  resource_id: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: string;
  document_id: string;
  signer_name: string;
  signer_role: string;
  signature_data: string;
  ip_address: string | null;
  created_at: string;
}

export interface JobTask {
  id: string;
  job_id: string;
  offer_line_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  sort_order: number;
  started_at: string | null;
  completed_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  staff_id: string;
  job_id: string | null;
  task_id: string | null;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VatReturn {
  id: string;
  period_type: VatPeriodType;
  year: number;
  period: number;
  status: VatReturnStatus;
  box1a_supplies_high: number;
  box1b_supplies_low: number;
  box1c_supplies_other: number;
  box1d_private_use: number;
  box1e_supplies_zero: number;
  box2a_supplies_from_eu: number;
  box4a_vat_on_supplies: number;
  box4b_vat_on_eu: number;
  box5a_vat_deductible: number;
  box5b_vat_balance: number;
  box5c_small_business: number;
  box5d_estimate_previous: number;
  box5e_total_payable: number;
  box5f_total_refund: number;
  filed_at: string | null;
  filed_by: string | null;
  notes: string | null;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export type PurchaseCategory = 'general' | 'parts' | 'paint' | 'materials' | 'tools' | 'rent' | 'utilities' | 'insurance' | 'other';

export interface Job {
  id: string;
  number: number;
  customer_id: string;
  vehicle_id: string | null;
  lead_id: string | null;
  offer_id: string | null;
  stage: JobStage;
  job_type: JobType;
  priority: JobPriority;
  payer_type: PayerType | null;
  assigned_to: string | null;
  intake_km: number | null;
  outtake_km: number | null;
  estimated_hours: number | null;
  target_date: string | null;
  estimated_delivery_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface JobEvent {
  id: string;
  job_id: string;
  event_type: JobEventType;
  description: string | null;
  old_value: string | null;
  new_value: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  storage_path: string;
  phase: PhotoPhase;
  caption: string | null;
  created_at: string;
}

export interface Purchase {
  id: string;
  purchase_number: string | null;
  supplier_name: string;
  supplier_vat_number: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  tax_code: TaxCode;
  category: PurchaseCategory;
  description: string | null;
  reference: string | null;
  paid: boolean;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  receipt_path: string | null;
  job_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: Staff;
        Insert: Omit<Staff, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Staff, 'id' | 'created_at' | 'updated_at'>>;
      };
      settings: {
        Row: Settings;
        Insert: Omit<Settings, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Settings, 'key' | 'created_at' | 'updated_at'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { id?: string };
        Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { id?: string };
        Update: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>;
      };
      lead_photos: {
        Row: LeadPhoto;
        Insert: Omit<LeadPhoto, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<LeadPhoto, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'read'> & { id?: string; read?: boolean };
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>;
      };
      number_ranges: {
        Row: NumberRange;
        Insert: Omit<NumberRange, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<NumberRange, 'id' | 'created_at'>>;
      };
      offers: {
        Row: Offer;
        Insert: Omit<Offer, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Offer, 'id' | 'created_at' | 'updated_at'>>;
      };
      offer_lines: {
        Row: OfferLine;
        Insert: Omit<OfferLine, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<OfferLine, 'id' | 'created_at'>>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'number' | 'created_at' | 'updated_at' | 'closed_at'> & { id?: string; number?: number };
        Update: Partial<Omit<Job, 'id' | 'number' | 'created_at' | 'updated_at'>>;
      };
      job_events: {
        Row: JobEvent;
        Insert: Omit<JobEvent, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<JobEvent, 'id' | 'created_at'>>;
      };
      job_photos: {
        Row: JobPhoto;
        Insert: Omit<JobPhoto, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<JobPhoto, 'id' | 'created_at'>>;
      };
      parts: {
        Row: Part;
        Insert: Omit<Part, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Part, 'id' | 'created_at' | 'updated_at'>>;
      };
      resources: {
        Row: Resource;
        Insert: Omit<Resource, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>;
      };
      opening_hours: {
        Row: OpeningHours;
        Insert: Omit<OpeningHours, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<OpeningHours, 'id' | 'created_at'>>;
      };
      blackouts: {
        Row: Blackout;
        Insert: Omit<Blackout, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Blackout, 'id' | 'created_at'>>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>;
      };
      signatures: {
        Row: Signature;
        Insert: Omit<Signature, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Signature, 'id' | 'created_at'>>;
      };
      job_tasks: {
        Row: JobTask;
        Insert: Omit<JobTask, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<JobTask, 'id' | 'created_at' | 'updated_at'>>;
      };
      time_entries: {
        Row: TimeEntry;
        Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
      vat_returns: {
        Row: VatReturn;
        Insert: Omit<VatReturn, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<VatReturn, 'id' | 'created_at' | 'updated_at'>>;
      };
      purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Purchase, 'id' | 'created_at' | 'updated_at'>>;
      };
      labour_rates: {
        Row: LabourRate;
        Insert: Omit<LabourRate, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<LabourRate, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      staff_role: StaffRole;
      customer_type: CustomerType;
      lead_status: LeadStatus;
      offer_type: OfferType;
      offer_status: OfferStatus;
      offer_origin: OfferOrigin;
      job_stage: JobStage;
      job_event_type: JobEventType;
      task_status: TaskStatus;
      photo_phase: PhotoPhase;
      part_status: PartStatus;
      appointment_type: AppointmentType;
      appointment_status: AppointmentStatus;
      resource_type: ResourceType;
      doc_type: DocType;
      doc_status: DocStatus;
      invoice_status: InvoiceStatus;
      payment_method: PaymentMethod;
      offer_line_kind: OfferLineKind;
      job_type: JobType;
      job_priority: JobPriority;
      payer_type: PayerType;
      vat_return_status: VatReturnStatus;
      vat_period_type: VatPeriodType;
      tax_code: TaxCode;
      notification_type: NotificationType;
    };
  };
}
