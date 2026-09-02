export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          duration_minutes: number
          id: string
          job_id: string | null
          notes: string | null
          resource_id: string | null
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          duration_minutes?: number
          id?: string
          job_id?: string | null
          notes?: string | null
          resource_id?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          duration_minutes?: number
          id?: string
          job_id?: string | null
          notes?: string | null
          resource_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      blackouts: {
        Row: {
          all_day: boolean
          created_at: string
          end_date: string
          id: string
          resource_id: string | null
          start_date: string
          title: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          end_date: string
          id?: string
          resource_id?: string | null
          start_date: string
          title: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          end_date?: string
          id?: string
          resource_id?: string | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blackouts_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          btw_number: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          kvk_number: string | null
          locale: string
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          status: Database["public"]["Enums"]["customer_status"]
          type: Database["public"]["Enums"]["customer_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          btw_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          kvk_number?: string | null
          locale?: string
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          btw_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          kvk_number?: string | null
          locale?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          customer_id: string
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["doc_type"]
          gallery_consent: boolean | null
          id: string
          invoice_id: string | null
          issued_at: string | null
          issued_by: string | null
          job_id: string | null
          locale: string
          offer_id: string | null
          payload: Json | null
          pdf_path: string | null
          pdf_sha256: string | null
          sent_at: string | null
          share_expires_at: string | null
          share_token: string | null
          signature_path: string | null
          signed_at: string | null
          signed_by_name: string | null
          signed_ip: string | null
          status: Database["public"]["Enums"]["doc_status"]
          supersedes_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          doc_number?: string | null
          doc_type: Database["public"]["Enums"]["doc_type"]
          gallery_consent?: boolean | null
          id?: string
          invoice_id?: string | null
          issued_at?: string | null
          issued_by?: string | null
          job_id?: string | null
          locale?: string
          offer_id?: string | null
          payload?: Json | null
          pdf_path?: string | null
          pdf_sha256?: string | null
          sent_at?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          signature_path?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
          signed_ip?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          supersedes_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type"]
          gallery_consent?: boolean | null
          id?: string
          invoice_id?: string | null
          issued_at?: string | null
          issued_by?: string | null
          job_id?: string | null
          locale?: string
          offer_id?: string | null
          payload?: Json | null
          pdf_path?: string | null
          pdf_sha256?: string | null
          sent_at?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          signature_path?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
          signed_ip?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          supersedes_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          from_email: string
          id: string
          message_id: string | null
          received_at: string | null
          snippet: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          from_email: string
          id?: string
          message_id?: string | null
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          from_email?: string
          id?: string
          message_id?: string | null
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          created_at: string
          description: string
          discount_pct: number
          id: string
          invoice_id: string
          kind: Database["public"]["Enums"]["offer_line_kind"]
          line_total_cents: number
          part_number: string | null
          quantity: number
          sort_order: number
          tax_code: Database["public"]["Enums"]["tax_code"]
          unit: string
          unit_price_cents: number
          vat_amount_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_pct?: number
          id?: string
          invoice_id: string
          kind?: Database["public"]["Enums"]["offer_line_kind"]
          line_total_cents?: number
          part_number?: string | null
          quantity?: number
          sort_order?: number
          tax_code?: Database["public"]["Enums"]["tax_code"]
          unit?: string
          unit_price_cents?: number
          vat_amount_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_pct?: number
          id?: string
          invoice_id?: string
          kind?: Database["public"]["Enums"]["offer_line_kind"]
          line_total_cents?: number
          part_number?: string | null
          quantity?: number
          sort_order?: number
          tax_code?: Database["public"]["Enums"]["tax_code"]
          unit?: string
          unit_price_cents?: number
          vat_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          credit_note_id: string | null
          customer_id: string
          discount_cents: number
          due_date: string | null
          id: string
          invoice_number: string | null
          issued_at: string | null
          issued_by: string | null
          job_id: string | null
          locale: string
          mollie_payment_id: string | null
          notes: string | null
          offer_id: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payment_token: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents: number
          tax_summary: Json | null
          terms: string | null
          total_cents: number
          updated_at: string
          vat_cents: number
          vehicle_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_id?: string | null
          customer_id: string
          discount_cents?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          issued_by?: string | null
          job_id?: string | null
          locale?: string
          mollie_payment_id?: string | null
          notes?: string | null
          offer_id?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_token?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_summary?: Json | null
          terms?: string | null
          total_cents?: number
          updated_at?: string
          vat_cents?: number
          vehicle_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_id?: string | null
          customer_id?: string
          discount_cents?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          issued_by?: string | null
          job_id?: string | null
          locale?: string
          mollie_payment_id?: string | null
          notes?: string | null
          offer_id?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_token?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_summary?: Json | null
          terms?: string | null
          total_cents?: number
          updated_at?: string
          vat_cents?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_credit_note_id_fkey"
            columns: ["credit_note_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          from_stage: string | null
          id: string
          job_id: string
          note: string | null
          payload: Json | null
          to_stage: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_stage?: string | null
          id?: string
          job_id: string
          note?: string | null
          payload?: Json | null
          to_stage?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_stage?: string | null
          id?: string
          job_id?: string
          note?: string | null
          payload?: Json | null
          to_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          job_id: string
          phase: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id: string
          phase?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string
          phase?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tasks: {
        Row: {
          actual_minutes: number | null
          assigned_to: string | null
          blocked_reason: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          job_id: string
          offer_line_id: string | null
          sort_order: number
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          job_id: string
          offer_line_id?: string | null
          sort_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          job_id?: string
          offer_line_id?: string | null
          sort_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          customer_id: string | null
          estimated_delivery_at: string | null
          estimated_hours: number | null
          id: string
          intake_km: number | null
          job_type: Database["public"]["Enums"]["job_type"] | null
          notes: string | null
          number: number
          payer_type: Database["public"]["Enums"]["payer_type"] | null
          priority: Database["public"]["Enums"]["job_priority"] | null
          stage: string
          target_date: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_delivery_at?: string | null
          estimated_hours?: number | null
          id?: string
          intake_km?: number | null
          job_type?: Database["public"]["Enums"]["job_type"] | null
          notes?: string | null
          number?: number
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          priority?: Database["public"]["Enums"]["job_priority"] | null
          stage?: string
          target_date?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_delivery_at?: string | null
          estimated_hours?: number | null
          id?: string
          intake_km?: number | null
          job_type?: Database["public"]["Enums"]["job_type"] | null
          notes?: string | null
          number?: number
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          priority?: Database["public"]["Enums"]["job_priority"] | null
          stage?: string
          target_date?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_rates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          kind: string
          name: string
          payer_type: Database["public"]["Enums"]["payer_type"] | null
          sort_order: number
          tax_code: string
          unit: string
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          kind?: string
          name: string
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          sort_order?: number
          tax_code?: string
          unit?: string
          unit_price_cents?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          sort_order?: number
          tax_code?: string
          unit?: string
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      lead_photos: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_photos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          appointment_type: string | null
          assigned_to: string | null
          channel: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          customer_id: string | null
          damage_description: string | null
          id: string
          is_foreign_plate: boolean
          kenteken: string | null
          locale: string
          location: string | null
          location_address: string | null
          lost_reason: string | null
          notes: string | null
          number: number
          origin: string | null
          paint_code: string | null
          preferred_date: string | null
          rdw_snapshot: Json | null
          repair_locations: string[]
          scheduled_date: string | null
          scheduled_time: string | null
          service_types: string[]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          vehicle_colour: string | null
          vehicle_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_vin: string | null
          vehicle_year: number | null
        }
        Insert: {
          appointment_type?: string | null
          assigned_to?: string | null
          channel?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          damage_description?: string | null
          id?: string
          is_foreign_plate?: boolean
          kenteken?: string | null
          locale?: string
          location?: string | null
          location_address?: string | null
          lost_reason?: string | null
          notes?: string | null
          number?: number
          origin?: string | null
          paint_code?: string | null
          preferred_date?: string | null
          rdw_snapshot?: Json | null
          repair_locations?: string[]
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_types?: string[]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vehicle_colour?: string | null
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Update: {
          appointment_type?: string | null
          assigned_to?: string | null
          channel?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          damage_description?: string | null
          id?: string
          is_foreign_plate?: boolean
          kenteken?: string | null
          locale?: string
          location?: string | null
          location_address?: string | null
          lost_reason?: string | null
          notes?: string | null
          number?: number
          origin?: string | null
          paint_code?: string | null
          preferred_date?: string | null
          rdw_snapshot?: Json | null
          repair_locations?: string[]
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_types?: string[]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          vehicle_colour?: string | null
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          ref_id: string | null
          ref_type: string | null
          staff_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          ref_id?: string | null
          ref_type?: string | null
          staff_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          ref_id?: string | null
          ref_type?: string | null
          staff_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      number_ranges: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id: string
          next_number: number
          prefix: string
          year: number
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id?: string
          next_number?: number
          prefix: string
          year: number
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          next_number?: number
          prefix?: string
          year?: number
        }
        Relationships: []
      }
      offer_lines: {
        Row: {
          created_at: string
          description: string
          discount_pct: number
          id: string
          kind: Database["public"]["Enums"]["offer_line_kind"]
          line_total_cents: number
          offer_id: string
          part_number: string | null
          quantity: number
          sort_order: number
          tax_code: Database["public"]["Enums"]["tax_code"]
          unit: string
          unit_price_cents: number
          vat_amount_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_pct?: number
          id?: string
          kind?: Database["public"]["Enums"]["offer_line_kind"]
          line_total_cents?: number
          offer_id: string
          part_number?: string | null
          quantity?: number
          sort_order?: number
          tax_code?: Database["public"]["Enums"]["tax_code"]
          unit?: string
          unit_price_cents?: number
          vat_amount_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_pct?: number
          id?: string
          kind?: Database["public"]["Enums"]["offer_line_kind"]
          line_total_cents?: number
          offer_id?: string
          part_number?: string | null
          quantity?: number
          sort_order?: number
          tax_code?: Database["public"]["Enums"]["tax_code"]
          unit?: string
          unit_price_cents?: number
          vat_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_lines_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          approved_at: string | null
          approved_by_name: string | null
          approved_ip: unknown
          created_at: string
          created_by: string | null
          customer_id: string
          discount_cents: number
          estimated_delivery_at: string | null
          id: string
          job_id: string | null
          lead_id: string | null
          locale: string
          notes: string | null
          offer_number: string | null
          origin: Database["public"]["Enums"]["offer_origin"]
          parent_offer_id: string | null
          payer_type: Database["public"]["Enums"]["payer_type"] | null
          rejected_at: string | null
          rejected_reason: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["offer_status"]
          subtotal_cents: number
          supersedes_id: string | null
          total_cents: number
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
          valid_until: string | null
          vat_cents: number
          vehicle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_name?: string | null
          approved_ip?: unknown
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount_cents?: number
          estimated_delivery_at?: string | null
          id?: string
          job_id?: string | null
          lead_id?: string | null
          locale?: string
          notes?: string | null
          offer_number?: string | null
          origin?: Database["public"]["Enums"]["offer_origin"]
          parent_offer_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          rejected_at?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          subtotal_cents?: number
          supersedes_id?: string | null
          total_cents?: number
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          valid_until?: string | null
          vat_cents?: number
          vehicle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by_name?: string | null
          approved_ip?: unknown
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount_cents?: number
          estimated_delivery_at?: string | null
          id?: string
          job_id?: string | null
          lead_id?: string | null
          locale?: string
          notes?: string | null
          offer_number?: string | null
          origin?: Database["public"]["Enums"]["offer_origin"]
          parent_offer_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          rejected_at?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          subtotal_cents?: number
          supersedes_id?: string | null
          total_cents?: number
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          valid_until?: string | null
          vat_cents?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          open_time: string
        }
        Insert: {
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          open_time: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          open_time?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          blocking: boolean
          created_at: string
          created_by: string | null
          description: string
          expected_at: string | null
          id: string
          job_id: string
          notes: string | null
          offer_line_id: string | null
          ordered_at: string | null
          part_number: string | null
          quantity: number
          received_at: string | null
          status: Database["public"]["Enums"]["part_status"]
          supplier: string | null
          total_cents: number
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          blocking?: boolean
          created_at?: string
          created_by?: string | null
          description: string
          expected_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          offer_line_id?: string | null
          ordered_at?: string | null
          part_number?: string | null
          quantity?: number
          received_at?: string | null
          status?: Database["public"]["Enums"]["part_status"]
          supplier?: string | null
          total_cents?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Update: {
          blocking?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          expected_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          offer_line_id?: string | null
          ordered_at?: string | null
          part_number?: string | null
          quantity?: number
          received_at?: string | null
          status?: Database["public"]["Enums"]["part_status"]
          supplier?: string | null
          total_cents?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          mollie_payment_id: string | null
          mollie_status: string | null
          paid_at: string | null
          reference: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          mollie_payment_id?: string | null
          mollie_status?: string | null
          paid_at?: string | null
          reference?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          mollie_payment_id?: string | null
          mollie_status?: string | null
          paid_at?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_date: string
          job_id: string | null
          paid: boolean
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          purchase_number: string | null
          receipt_path: string | null
          reference: string | null
          subtotal_cents: number
          supplier_name: string
          supplier_vat_number: string | null
          tax_code: Database["public"]["Enums"]["tax_code"]
          total_cents: number
          updated_at: string
          vat_cents: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          job_id?: string | null
          paid?: boolean
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          purchase_number?: string | null
          receipt_path?: string | null
          reference?: string | null
          subtotal_cents?: number
          supplier_name: string
          supplier_vat_number?: string | null
          tax_code?: Database["public"]["Enums"]["tax_code"]
          total_cents?: number
          updated_at?: string
          vat_cents?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          job_id?: string | null
          paid?: boolean
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          purchase_number?: string | null
          receipt_path?: string | null
          reference?: string | null
          subtotal_cents?: number
          supplier_name?: string
          supplier_vat_number?: string | null
          tax_code?: Database["public"]["Enums"]["tax_code"]
          total_cents?: number
          updated_at?: string
          vat_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      signatures: {
        Row: {
          created_at: string
          document_id: string
          id: string
          ip_address: string | null
          signature_data: string
          signer_name: string
          signer_role: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signer_name: string
          signer_role?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signer_name?: string
          signer_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pageviews: {
        Row: {
          id: string
          page_path: string
          page_title: string | null
          session_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          page_path: string
          page_title?: string | null
          session_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          page_path?: string
          page_title?: string | null
          session_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_pageviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "site_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      site_sessions: {
        Row: {
          browser: string | null
          channel: string
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          device: string
          duration_seconds: number
          ended_at: string | null
          entry_page: string
          exit_page: string | null
          id: string
          is_bot: boolean
          locale: string | null
          os: string | null
          page_count: number
          referrer: string | null
          session_id: string
          started_at: string
        }
        Insert: {
          browser?: string | null
          channel?: string
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          device?: string
          duration_seconds?: number
          ended_at?: string | null
          entry_page: string
          exit_page?: string | null
          id?: string
          is_bot?: boolean
          locale?: string | null
          os?: string | null
          page_count?: number
          referrer?: string | null
          session_id: string
          started_at?: string
        }
        Update: {
          browser?: string | null
          channel?: string
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          device?: string
          duration_seconds?: number
          ended_at?: string | null
          entry_page?: string
          exit_page?: string | null
          id?: string
          is_bot?: boolean
          locale?: string | null
          os?: string | null
          page_count?: number
          referrer?: string | null
          session_id?: string
          started_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          colour: string | null
          created_at: string
          email: string
          id: string
          locale: string
          name: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          weekly_hours: number | null
        }
        Insert: {
          active?: boolean
          colour?: string | null
          created_at?: string
          email: string
          id: string
          locale?: string
          name: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          weekly_hours?: number | null
        }
        Update: {
          active?: boolean
          colour?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string
          name?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          weekly_hours?: number | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          break_minutes: number
          clock_in: string
          clock_out: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          job_id: string | null
          notes: string | null
          staff_id: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          clock_in: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id?: string | null
          notes?: string | null
          staff_id: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id?: string | null
          notes?: string | null
          staff_id?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "job_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      vat_returns: {
        Row: {
          box1a_supplies_high: number
          box1b_supplies_low: number
          box1c_supplies_other: number
          box1d_private_use: number
          box1e_supplies_zero: number
          box2a_supplies_from_eu: number
          box4a_vat_on_supplies: number
          box4b_vat_on_eu: number
          box5a_vat_deductible: number
          box5b_vat_balance: number
          box5c_small_business: number
          box5d_estimate_previous: number
          box5e_total_payable: number
          box5f_total_refund: number
          created_at: string
          filed_at: string | null
          filed_by: string | null
          id: string
          locked: boolean
          notes: string | null
          period: number
          period_type: Database["public"]["Enums"]["vat_period_type"]
          status: Database["public"]["Enums"]["vat_return_status"]
          updated_at: string
          year: number
        }
        Insert: {
          box1a_supplies_high?: number
          box1b_supplies_low?: number
          box1c_supplies_other?: number
          box1d_private_use?: number
          box1e_supplies_zero?: number
          box2a_supplies_from_eu?: number
          box4a_vat_on_supplies?: number
          box4b_vat_on_eu?: number
          box5a_vat_deductible?: number
          box5b_vat_balance?: number
          box5c_small_business?: number
          box5d_estimate_previous?: number
          box5e_total_payable?: number
          box5f_total_refund?: number
          created_at?: string
          filed_at?: string | null
          filed_by?: string | null
          id?: string
          locked?: boolean
          notes?: string | null
          period: number
          period_type?: Database["public"]["Enums"]["vat_period_type"]
          status?: Database["public"]["Enums"]["vat_return_status"]
          updated_at?: string
          year: number
        }
        Update: {
          box1a_supplies_high?: number
          box1b_supplies_low?: number
          box1c_supplies_other?: number
          box1d_private_use?: number
          box1e_supplies_zero?: number
          box2a_supplies_from_eu?: number
          box4a_vat_on_supplies?: number
          box4b_vat_on_eu?: number
          box5a_vat_deductible?: number
          box5b_vat_balance?: number
          box5c_small_business?: number
          box5d_estimate_previous?: number
          box5e_total_payable?: number
          box5f_total_refund?: number
          created_at?: string
          filed_at?: string | null
          filed_by?: string | null
          id?: string
          locked?: boolean
          notes?: string | null
          period?: number
          period_type?: Database["public"]["Enums"]["vat_period_type"]
          status?: Database["public"]["Enums"]["vat_return_status"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vat_returns_filed_by_fkey"
            columns: ["filed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_brands: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      vehicle_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "vehicle_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_type: string | null
          bouwjaar: number | null
          brandstof: string | null
          chassisnummer: string | null
          colour: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          fuel: string | null
          id: string
          kenteken: string | null
          kleur: string | null
          make: string | null
          merk: string | null
          model: string | null
          notes: string | null
          paint_code: string | null
          plate_origin: string | null
          rdw_snapshot: Json | null
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
          vin: string | null
          wok: boolean
          wok_date: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          bouwjaar?: number | null
          brandstof?: string | null
          chassisnummer?: string | null
          colour?: string | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          fuel?: string | null
          id?: string
          kenteken?: string | null
          kleur?: string | null
          make?: string | null
          merk?: string | null
          model?: string | null
          notes?: string | null
          paint_code?: string | null
          plate_origin?: string | null
          rdw_snapshot?: Json | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          vin?: string | null
          wok?: boolean
          wok_date?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          bouwjaar?: number | null
          brandstof?: string | null
          chassisnummer?: string | null
          colour?: string | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          fuel?: string | null
          id?: string
          kenteken?: string | null
          kleur?: string | null
          make?: string | null
          merk?: string | null
          model?: string | null
          notes?: string | null
          paint_code?: string | null
          plate_origin?: string | null
          rdw_snapshot?: Json | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          vin?: string | null
          wok?: boolean
          wok_date?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_number: {
        Args: {
          p_doc_type: Database["public"]["Enums"]["doc_type"]
          p_year?: number
        }
        Returns: string
      }
      is_active_staff: { Args: never; Returns: boolean }
      is_admin_staff: { Args: never; Returns: boolean }
      is_office_or_admin_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      appointment_status: "requested" | "confirmed" | "cancelled" | "completed"
      appointment_type: "inspection" | "drop_off" | "collection" | "repair_slot"
      customer_status: "active" | "inactive" | "blocked"
      customer_type: "private" | "company" | "fleet" | "dealer"
      doc_status: "draft" | "issued" | "cancelled"
      doc_type:
        | "offer"
        | "repair_order"
        | "handover_note"
        | "invoice"
        | "credit_note"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "overdue"
        | "cancelled"
        | "credited"
      job_event_type:
        | "stage_change"
        | "note"
        | "photo_added"
        | "part_ordered"
        | "part_received"
        | "task_completed"
        | "document_issued"
        | "payment_received"
        | "assignment_change"
      job_priority: "normal" | "urgent" | "rush"
      job_stage:
        | "intake"
        | "quoted"
        | "approved"
        | "scheduled"
        | "checked_in"
        | "in_progress"
        | "qc"
        | "ready"
        | "delivered"
        | "closed"
      job_type:
        | "bodywork"
        | "mechanical"
        | "paint"
        | "electrical"
        | "diagnostics"
        | "apk"
        | "maintenance"
      lead_status: "new" | "contacted" | "quoted" | "won" | "lost"
      notification_type:
        | "new_lead"
        | "stage_change"
        | "new_email"
        | "appointment_confirmed"
        | "appointment_cancelled"
        | "part_received"
        | "payment_received"
        | "document_issued"
        | "system"
      offer_line_kind: "labour" | "part" | "material" | "other"
      offer_origin:
        | "website"
        | "manual"
        | "phone"
        | "email"
        | "walk_in"
        | "Offerte-Web"
      offer_status: "draft" | "sent" | "approved" | "rejected" | "superseded"
      offer_type: "offer" | "supplement"
      part_status: "needed" | "ordered" | "shipped" | "received" | "returned"
      payer_type: "casco" | "wa" | "particulier" | "lease"
      payment_method: "ideal" | "bank_transfer" | "cash" | "card" | "mollie"
      photo_phase: "before" | "during" | "after"
      resource_type: "bay" | "booth" | "staff"
      staff_role: "admin" | "office" | "tech"
      task_status: "todo" | "in_progress" | "done" | "blocked"
      tax_code: "H21" | "L9" | "N0" | "V0" | "M0" | "ICP" | "EX"
      vat_period_type: "quarter" | "month"
      vat_return_status: "open" | "draft" | "filed" | "corrected"
      vehicle_status: "created" | "in_progress" | "done" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["requested", "confirmed", "cancelled", "completed"],
      appointment_type: ["inspection", "drop_off", "collection", "repair_slot"],
      customer_status: ["active", "inactive", "blocked"],
      customer_type: ["private", "company", "fleet", "dealer"],
      doc_status: ["draft", "issued", "cancelled"],
      doc_type: [
        "offer",
        "repair_order",
        "handover_note",
        "invoice",
        "credit_note",
      ],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "overdue",
        "cancelled",
        "credited",
      ],
      job_event_type: [
        "stage_change",
        "note",
        "photo_added",
        "part_ordered",
        "part_received",
        "task_completed",
        "document_issued",
        "payment_received",
        "assignment_change",
      ],
      job_priority: ["normal", "urgent", "rush"],
      job_stage: [
        "intake",
        "quoted",
        "approved",
        "scheduled",
        "checked_in",
        "in_progress",
        "qc",
        "ready",
        "delivered",
        "closed",
      ],
      job_type: [
        "bodywork",
        "mechanical",
        "paint",
        "electrical",
        "diagnostics",
        "apk",
        "maintenance",
      ],
      lead_status: ["new", "contacted", "quoted", "won", "lost"],
      notification_type: [
        "new_lead",
        "stage_change",
        "new_email",
        "appointment_confirmed",
        "appointment_cancelled",
        "part_received",
        "payment_received",
        "document_issued",
        "system",
      ],
      offer_line_kind: ["labour", "part", "material", "other"],
      offer_origin: [
        "website",
        "manual",
        "phone",
        "email",
        "walk_in",
        "Offerte-Web",
      ],
      offer_status: ["draft", "sent", "approved", "rejected", "superseded"],
      offer_type: ["offer", "supplement"],
      part_status: ["needed", "ordered", "shipped", "received", "returned"],
      payer_type: ["casco", "wa", "particulier", "lease"],
      payment_method: ["ideal", "bank_transfer", "cash", "card", "mollie"],
      photo_phase: ["before", "during", "after"],
      resource_type: ["bay", "booth", "staff"],
      staff_role: ["admin", "office", "tech"],
      task_status: ["todo", "in_progress", "done", "blocked"],
      tax_code: ["H21", "L9", "N0", "V0", "M0", "ICP", "EX"],
      vat_period_type: ["quarter", "month"],
      vat_return_status: ["open", "draft", "filed", "corrected"],
      vehicle_status: ["created", "in_progress", "done", "archived"],
    },
  },
} as const

// Convenience type aliases used throughout the codebase
export type AppointmentStatus = Database['public']['Enums']['appointment_status']
export type AppointmentType = Database['public']['Enums']['appointment_type']
export type CustomerStatus = Database['public']['Enums']['customer_status']
export type CustomerType = Database['public']['Enums']['customer_type']
export type DocStatus = Database['public']['Enums']['doc_status']
export type DocType = Database['public']['Enums']['doc_type']
export type InvoiceStatus = Database['public']['Enums']['invoice_status']
export type JobEventType = Database['public']['Enums']['job_event_type']
export type JobPriority = Database['public']['Enums']['job_priority']
export type JobStage = Database['public']['Enums']['job_stage']
export type JobType = Database['public']['Enums']['job_type']
export type LeadStatus = Database['public']['Enums']['lead_status']
export type NotificationType = Database['public']['Enums']['notification_type']
export type OfferLineKind = Database['public']['Enums']['offer_line_kind']
export type OfferOrigin = Database['public']['Enums']['offer_origin']
export type OfferStatus = Database['public']['Enums']['offer_status']
export type OfferType = Database['public']['Enums']['offer_type']
export type PartStatus = Database['public']['Enums']['part_status']
export type PayerType = Database['public']['Enums']['payer_type']
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type PhotoPhase = Database['public']['Enums']['photo_phase']
export type ResourceType = Database['public']['Enums']['resource_type']
export type StaffRole = Database['public']['Enums']['staff_role']
export type TaskStatus = Database['public']['Enums']['task_status']
export type TaxCode = Database['public']['Enums']['tax_code']
export type VatPeriodType = Database['public']['Enums']['vat_period_type']
export type VatReturnStatus = Database['public']['Enums']['vat_return_status']
export type VehicleStatus = Database['public']['Enums']['vehicle_status']
export type NoteEntityType = 'job' | 'lead' | 'customer' | 'vehicle' | 'invoice' | 'offer'
export type PurchaseCategory = string
export type LabourRate = Database['public']['Tables']['labour_rates']['Row']
