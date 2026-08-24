-- 0002: Enums for state machines and typed columns

-- Staff roles
create type staff_role as enum ('admin', 'office', 'tech');

-- Customer types
create type customer_type as enum ('private', 'company', 'fleet', 'dealer');

-- Lead status
create type lead_status as enum ('new', 'contacted', 'quoted', 'won', 'lost');

-- Offer type & status
create type offer_type as enum ('offer', 'supplement');
create type offer_status as enum ('draft', 'sent', 'approved', 'rejected', 'superseded');
create type offer_origin as enum ('website', 'manual', 'phone', 'email', 'walk_in');

-- Job stages (10 stages as per spec)
create type job_stage as enum (
  'intake',
  'quoted',
  'approved',
  'scheduled',
  'checked_in',
  'in_progress',
  'qc',
  'ready',
  'delivered',
  'closed'
);

-- Job event types
create type job_event_type as enum (
  'stage_change',
  'note',
  'photo_added',
  'part_ordered',
  'part_received',
  'task_completed',
  'document_issued',
  'payment_received',
  'assignment_change'
);

-- Job task status
create type task_status as enum ('todo', 'in_progress', 'done', 'blocked');

-- Photo phases
create type photo_phase as enum ('before', 'during', 'after');

-- Part status
create type part_status as enum ('needed', 'ordered', 'shipped', 'received', 'returned');

-- Appointment types
create type appointment_type as enum ('inspection', 'drop_off', 'collection', 'repair_slot');
create type appointment_status as enum ('requested', 'confirmed', 'cancelled', 'completed');

-- Resource types
create type resource_type as enum ('bay', 'booth', 'staff');

-- Document types & status
create type doc_type as enum ('offer', 'repair_order', 'handover_note', 'invoice', 'credit_note');
create type doc_status as enum ('draft', 'issued', 'cancelled');

-- Invoice status
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'credited');

-- Payment methods
create type payment_method as enum ('ideal', 'bank_transfer', 'cash', 'card', 'mollie');

-- Offer line kinds
create type offer_line_kind as enum ('labour', 'part', 'material', 'other');

-- VAT return status
create type vat_return_status as enum ('open', 'draft', 'filed', 'corrected');
create type vat_period_type as enum ('quarter', 'month');

-- Tax codes (Dutch BTW)
create type tax_code as enum ('H21', 'L9', 'N0', 'V0', 'M0', 'ICP', 'EX');
