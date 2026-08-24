// Auto-generated types — reflects migrations 0001-0009.
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
export type OfferOrigin = 'website' | 'manual' | 'phone' | 'email' | 'walk_in';
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
export type VatReturnStatus = 'open' | 'draft' | 'filed' | 'corrected';
export type VatPeriodType = 'quarter' | 'month';
export type TaxCode = 'H21' | 'L9' | 'N0' | 'V0' | 'M0' | 'ICP' | 'EX';
export type NotificationType = 'new_lead' | 'stage_change' | 'new_email' | 'appointment_confirmed' | 'appointment_cancelled' | 'part_received' | 'payment_received' | 'document_issued' | 'system';

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
      vat_return_status: VatReturnStatus;
      vat_period_type: VatPeriodType;
      tax_code: TaxCode;
      notification_type: NotificationType;
    };
  };
}
