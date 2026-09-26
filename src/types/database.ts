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
    PostgrestVersion: "14.5"
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
      customer_activities: {
        Row: {
          author: string | null
          created_at: string | null
          customer_id: string
          id: string
          occurred_at: string
          ref_id: string | null
          ref_table: string | null
          summary: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          occurred_at?: string
          ref_id?: string | null
          ref_table?: string | null
          summary: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          author?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          occurred_at?: string
          ref_id?: string | null
          ref_table?: string | null
          summary?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "customer_activities_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          addition: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_id: string
          distance_km: number | null
          house_no: string | null
          id: string
          is_default: boolean | null
          lat: number | null
          lng: number | null
          pickup_windows: Json | null
          postal_code: string | null
          street: string | null
          travel_min: number | null
          type: Database["public"]["Enums"]["address_type"] | null
          updated_at: string | null
        }
        Insert: {
          addition?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id: string
          distance_km?: number | null
          house_no?: string | null
          id?: string
          is_default?: boolean | null
          lat?: number | null
          lng?: number | null
          pickup_windows?: Json | null
          postal_code?: string | null
          street?: string | null
          travel_min?: number | null
          type?: Database["public"]["Enums"]["address_type"] | null
          updated_at?: string | null
        }
        Update: {
          addition?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: string
          distance_km?: number | null
          house_no?: string | null
          id?: string
          is_default?: boolean | null
          lat?: number | null
          lng?: number | null
          pickup_windows?: Json | null
          postal_code?: string | null
          street?: string | null
          travel_min?: number | null
          type?: Database["public"]["Enums"]["address_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_agreements: {
        Row: {
          authorisation_threshold_eur: number | null
          calculation_system:
            | Database["public"]["Enums"]["calculation_system"]
            | null
          contract_document_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          discount_labour_pct: number | null
          discount_parts_pct: number | null
          excess_handling: Database["public"]["Enums"]["excess_handling"] | null
          id: string
          labour_rates: Json | null
          network: Database["public"]["Enums"]["repair_network"] | null
          notes: string | null
          paint_material_method:
            | Database["public"]["Enums"]["paint_material_method"]
            | null
          paint_material_value: number | null
          repairer_code: string | null
          replacement_vehicle_policy:
            | Database["public"]["Enums"]["replacement_vehicle_policy"]
            | null
          sla: Json | null
          status: Database["public"]["Enums"]["agreement_status"] | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
          version: number
        }
        Insert: {
          authorisation_threshold_eur?: number | null
          calculation_system?:
            | Database["public"]["Enums"]["calculation_system"]
            | null
          contract_document_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          discount_labour_pct?: number | null
          discount_parts_pct?: number | null
          excess_handling?:
            | Database["public"]["Enums"]["excess_handling"]
            | null
          id?: string
          labour_rates?: Json | null
          network?: Database["public"]["Enums"]["repair_network"] | null
          notes?: string | null
          paint_material_method?:
            | Database["public"]["Enums"]["paint_material_method"]
            | null
          paint_material_value?: number | null
          repairer_code?: string | null
          replacement_vehicle_policy?:
            | Database["public"]["Enums"]["replacement_vehicle_policy"]
            | null
          sla?: Json | null
          status?: Database["public"]["Enums"]["agreement_status"] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          version?: number
        }
        Update: {
          authorisation_threshold_eur?: number | null
          calculation_system?:
            | Database["public"]["Enums"]["calculation_system"]
            | null
          contract_document_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          discount_labour_pct?: number | null
          discount_parts_pct?: number | null
          excess_handling?:
            | Database["public"]["Enums"]["excess_handling"]
            | null
          id?: string
          labour_rates?: Json | null
          network?: Database["public"]["Enums"]["repair_network"] | null
          notes?: string | null
          paint_material_method?:
            | Database["public"]["Enums"]["paint_material_method"]
            | null
          paint_material_value?: number | null
          repairer_code?: string | null
          replacement_vehicle_policy?:
            | Database["public"]["Enums"]["replacement_vehicle_policy"]
            | null
          sla?: Json | null
          status?: Database["public"]["Enums"]["agreement_status"] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_agreements_contract_doc_fk"
            columns: ["contract_document_id"]
            isOneToOne: false
            referencedRelation: "customer_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_agreements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          customer_id: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          customer_id: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          customer_id?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_audit_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_billing: {
        Row: {
          created_at: string | null
          credit_hold: boolean | null
          credit_hold_reason: string | null
          credit_hold_set_at: string | null
          credit_hold_set_by: string | null
          credit_limit_eur: number | null
          customer_id: string
          external_credit_date: string | null
          external_credit_rating: string | null
          external_credit_source: string | null
          iban: string | null
          invoice_email: string | null
          invoicing_mode: Database["public"]["Enums"]["invoicing_mode"] | null
          payment_terms_days: number | null
          peppol_id: string | null
          po_required: boolean | null
          portal_upload_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_hold?: boolean | null
          credit_hold_reason?: string | null
          credit_hold_set_at?: string | null
          credit_hold_set_by?: string | null
          credit_limit_eur?: number | null
          customer_id: string
          external_credit_date?: string | null
          external_credit_rating?: string | null
          external_credit_source?: string | null
          iban?: string | null
          invoice_email?: string | null
          invoicing_mode?: Database["public"]["Enums"]["invoicing_mode"] | null
          payment_terms_days?: number | null
          peppol_id?: string | null
          po_required?: boolean | null
          portal_upload_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_hold?: boolean | null
          credit_hold_reason?: string | null
          credit_hold_set_at?: string | null
          credit_hold_set_by?: string | null
          credit_limit_eur?: number | null
          customer_id?: string
          external_credit_date?: string | null
          external_credit_rating?: string | null
          external_credit_source?: string | null
          iban?: string | null
          invoice_email?: string | null
          invoicing_mode?: Database["public"]["Enums"]["invoicing_mode"] | null
          payment_terms_days?: number | null
          peppol_id?: string | null
          po_required?: boolean | null
          portal_upload_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_billing_credit_hold_set_by_fkey"
            columns: ["credit_hold_set_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_billing_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_consents: {
        Row: {
          basis: Database["public"]["Enums"]["consent_basis"]
          channel: Database["public"]["Enums"]["consent_channel"]
          contact_id: string | null
          created_at: string | null
          customer_id: string
          granted_at: string
          id: string
          purpose: Database["public"]["Enums"]["consent_purpose"]
          source: string | null
          withdrawn_at: string | null
        }
        Insert: {
          basis: Database["public"]["Enums"]["consent_basis"]
          channel: Database["public"]["Enums"]["consent_channel"]
          contact_id?: string | null
          created_at?: string | null
          customer_id: string
          granted_at?: string
          id?: string
          purpose: Database["public"]["Enums"]["consent_purpose"]
          source?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          basis?: Database["public"]["Enums"]["consent_basis"]
          channel?: Database["public"]["Enums"]["consent_channel"]
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string
          granted_at?: string
          id?: string
          purpose?: Database["public"]["Enums"]["consent_purpose"]
          source?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_consents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          active: boolean | null
          authority_limit_eur: number | null
          created_at: string | null
          customer_id: string
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          mobile: string | null
          notes: string | null
          phone: string | null
          preferred_channel:
            | Database["public"]["Enums"]["preferred_channel"]
            | null
          role: Database["public"]["Enums"]["contact_role"] | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          authority_limit_eur?: number | null
          created_at?: string | null
          customer_id: string
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["preferred_channel"]
            | null
          role?: Database["public"]["Enums"]["contact_role"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          authority_limit_eur?: number | null
          created_at?: string | null
          customer_id?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["preferred_channel"]
            | null
          role?: Database["public"]["Enums"]["contact_role"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          customer_id: string
          expires_at: string | null
          file_name: string
          id: string
          mime: string | null
          size: number | null
          storage_path: string
          type: Database["public"]["Enums"]["customer_document_type"] | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          customer_id: string
          expires_at?: string | null
          file_name: string
          id?: string
          mime?: string | null
          size?: number | null
          storage_path: string
          type?: Database["public"]["Enums"]["customer_document_type"] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          customer_id?: string
          expires_at?: string | null
          file_name?: string
          id?: string
          mime?: string | null
          size?: number | null
          storage_path?: string
          type?: Database["public"]["Enums"]["customer_document_type"] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_insurance_relations: {
        Row: {
          created_at: string | null
          customer_id: string
          default_payer: Database["public"]["Enums"]["default_payer"] | null
          id: string
          notes: string | null
          party_customer_id: string | null
          party_name: string | null
          party_type: Database["public"]["Enums"]["insurance_party_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          default_payer?: Database["public"]["Enums"]["default_payer"] | null
          id?: string
          notes?: string | null
          party_customer_id?: string | null
          party_name?: string | null
          party_type: Database["public"]["Enums"]["insurance_party_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          default_payer?: Database["public"]["Enums"]["default_payer"] | null
          id?: string
          notes?: string | null
          party_customer_id?: string | null
          party_name?: string | null
          party_type?: Database["public"]["Enums"]["insurance_party_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_insurance_relations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_insurance_relations_party_customer_id_fkey"
            columns: ["party_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          author: string | null
          body: string
          created_at: string | null
          customer_id: string
          id: string
          pinned: boolean | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          body: string
          created_at?: string | null
          customer_id: string
          id?: string
          pinned?: boolean | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          body?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          pinned?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_manager_id: string | null
          address: string | null
          btw_id: string | null
          btw_number: string | null
          btw_verified_at: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          customer_no: string
          customer_since: string | null
          deleted_at: string | null
          description: string | null
          email: string | null
          fleet_profile: string | null
          fleet_size: number | null
          id: string
          kvk_number: string | null
          legal_form: Database["public"]["Enums"]["legal_form"] | null
          legal_name: string | null
          locale: string
          name: string
          notes: string | null
          parent_customer_id: string | null
          phone: string | null
          postcode: string | null
          preferred_channel:
            | Database["public"]["Enums"]["preferred_channel"]
            | null
          preferred_language:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          relationship_reviewed_at: string | null
          relationship_reviewed_by: string | null
          relationship_score_manual: number | null
          status: Database["public"]["Enums"]["customer_status"]
          strategic_value: Database["public"]["Enums"]["strategic_value"] | null
          tags: string[] | null
          trade_name: string | null
          type: Database["public"]["Enums"]["customer_type"]
          typical_damage_profile: string | null
          updated_at: string
          updated_by: string | null
          vat_treatment: Database["public"]["Enums"]["vat_treatment"] | null
          vestigingsnummer: string | null
          vies_consultation_no: string | null
          website: string | null
          workshop_instructions: string | null
        }
        Insert: {
          account_manager_id?: string | null
          address?: string | null
          btw_id?: string | null
          btw_number?: string | null
          btw_verified_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_no: string
          customer_since?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          fleet_profile?: string | null
          fleet_size?: number | null
          id?: string
          kvk_number?: string | null
          legal_form?: Database["public"]["Enums"]["legal_form"] | null
          legal_name?: string | null
          locale?: string
          name: string
          notes?: string | null
          parent_customer_id?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["preferred_channel"]
            | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          relationship_reviewed_at?: string | null
          relationship_reviewed_by?: string | null
          relationship_score_manual?: number | null
          status?: Database["public"]["Enums"]["customer_status"]
          strategic_value?:
            | Database["public"]["Enums"]["strategic_value"]
            | null
          tags?: string[] | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["customer_type"]
          typical_damage_profile?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_treatment?: Database["public"]["Enums"]["vat_treatment"] | null
          vestigingsnummer?: string | null
          vies_consultation_no?: string | null
          website?: string | null
          workshop_instructions?: string | null
        }
        Update: {
          account_manager_id?: string | null
          address?: string | null
          btw_id?: string | null
          btw_number?: string | null
          btw_verified_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_no?: string
          customer_since?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          fleet_profile?: string | null
          fleet_size?: number | null
          id?: string
          kvk_number?: string | null
          legal_form?: Database["public"]["Enums"]["legal_form"] | null
          legal_name?: string | null
          locale?: string
          name?: string
          notes?: string | null
          parent_customer_id?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["preferred_channel"]
            | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          relationship_reviewed_at?: string | null
          relationship_reviewed_by?: string | null
          relationship_score_manual?: number | null
          status?: Database["public"]["Enums"]["customer_status"]
          strategic_value?:
            | Database["public"]["Enums"]["strategic_value"]
            | null
          tags?: string[] | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["customer_type"]
          typical_damage_profile?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_treatment?: Database["public"]["Enums"]["vat_treatment"] | null
          vestigingsnummer?: string | null
          vies_consultation_no?: string | null
          website?: string | null
          workshop_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_parent_customer_id_fkey"
            columns: ["parent_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_relationship_reviewed_by_fkey"
            columns: ["relationship_reviewed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
          body_text: string | null
          created_at: string
          direction: string
          entity_id: string | null
          entity_type: string
          from_email: string
          id: string
          in_reply_to: string | null
          message_id: string | null
          received_at: string | null
          sent_by: string | null
          snippet: string | null
          subject: string | null
          to_email: string | null
        }
        Insert: {
          body_text?: string | null
          created_at?: string
          direction?: string
          entity_id?: string | null
          entity_type?: string
          from_email: string
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
          received_at?: string | null
          sent_by?: string | null
          snippet?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Update: {
          body_text?: string | null
          created_at?: string
          direction?: string
          entity_id?: string | null
          entity_type?: string
          from_email?: string
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
          received_at?: string | null
          sent_by?: string | null
          snippet?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Relationships: []
      }
      ins_approvals: {
        Row: {
          document_hash: string
          id: string
          identification: string
          inspection_id: string
          ip_address: unknown
          role: string
          signature_path: string | null
          signed_at: string
          signer_email: string | null
          signer_name: string
          signer_user_id: string | null
          statement_text: string
          user_agent: string | null
        }
        Insert: {
          document_hash: string
          id?: string
          identification: string
          inspection_id: string
          ip_address?: unknown
          role: string
          signature_path?: string | null
          signed_at?: string
          signer_email?: string | null
          signer_name: string
          signer_user_id?: string | null
          statement_text: string
          user_agent?: string | null
        }
        Update: {
          document_hash?: string
          id?: string
          identification?: string
          inspection_id?: string
          ip_address?: unknown
          role?: string
          signature_path?: string | null
          signed_at?: string
          signer_email?: string | null
          signer_name?: string
          signer_user_id?: string | null
          statement_text?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ins_approvals_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_approvals_signer_user_id_fkey"
            columns: ["signer_user_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_components: {
        Row: {
          active: boolean
          key: string
          name_en: string | null
          name_nl: string
          name_tr: string | null
          paintable: boolean
          panel_group: string
          panel_size: string
          sort_order: number
          zone: string
        }
        Insert: {
          active?: boolean
          key: string
          name_en?: string | null
          name_nl: string
          name_tr?: string | null
          paintable?: boolean
          panel_group: string
          panel_size?: string
          sort_order?: number
          zone: string
        }
        Update: {
          active?: boolean
          key?: string
          name_en?: string | null
          name_nl?: string
          name_tr?: string | null
          paintable?: boolean
          panel_group?: string
          panel_size?: string
          sort_order?: number
          zone?: string
        }
        Relationships: []
      }
      ins_damage_types: {
        Row: {
          code: string
          implies_paint: boolean
          name_en: string | null
          name_nl: string
          name_tr: string | null
          sort_order: number
        }
        Insert: {
          code: string
          implies_paint?: boolean
          name_en?: string | null
          name_nl: string
          name_tr?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          implies_paint?: boolean
          name_en?: string | null
          name_nl?: string
          name_tr?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      ins_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: number
          inspection_id: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: number
          inspection_id: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: number
          inspection_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ins_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_events_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_finding_parts: {
        Row: {
          description: string
          finding_id: string
          id: string
          inspection_id: string
          part_number: string | null
          qty: number
          source: string
          unit_price_cents: number | null
        }
        Insert: {
          description: string
          finding_id: string
          id?: string
          inspection_id: string
          part_number?: string | null
          qty?: number
          source?: string
          unit_price_cents?: number | null
        }
        Update: {
          description?: string
          finding_id?: string
          id?: string
          inspection_id?: string
          part_number?: string | null
          qty?: number
          source?: string
          unit_price_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ins_finding_parts_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "ins_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_finding_parts_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_findings: {
        Row: {
          adas_possible: boolean
          blend_components: string[]
          component_key: string
          created_at: string
          created_by: string
          damage_types: string[]
          description: string | null
          disposition: string
          hidden_damage_note: string | null
          hidden_damage_possible: boolean
          hotspot_point: Json | null
          id: string
          inspection_id: string
          origin: string
          paint_hours: number
          paint_operation: string | null
          paint_required: boolean
          reference: string
          repair_hours: number
          repair_technique: string | null
          sequence_no: number
          severity: number
          sub_location: string | null
          updated_at: string
        }
        Insert: {
          adas_possible?: boolean
          blend_components?: string[]
          component_key: string
          created_at?: string
          created_by: string
          damage_types?: string[]
          description?: string | null
          disposition?: string
          hidden_damage_note?: string | null
          hidden_damage_possible?: boolean
          hotspot_point?: Json | null
          id: string
          inspection_id: string
          origin?: string
          paint_hours?: number
          paint_operation?: string | null
          paint_required?: boolean
          reference: string
          repair_hours?: number
          repair_technique?: string | null
          sequence_no: number
          severity?: number
          sub_location?: string | null
          updated_at?: string
        }
        Update: {
          adas_possible?: boolean
          blend_components?: string[]
          component_key?: string
          created_at?: string
          created_by?: string
          damage_types?: string[]
          description?: string | null
          disposition?: string
          hidden_damage_note?: string | null
          hidden_damage_possible?: boolean
          hotspot_point?: Json | null
          id?: string
          inspection_id?: string
          origin?: string
          paint_hours?: number
          paint_operation?: string | null
          paint_required?: boolean
          reference?: string
          repair_hours?: number
          repair_technique?: string | null
          sequence_no?: number
          severity?: number
          sub_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ins_findings_component_key_fkey"
            columns: ["component_key"]
            isOneToOne: false
            referencedRelation: "ins_components"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "ins_findings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_findings_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_inspections: {
        Row: {
          claim_number: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          deleted_at: string | null
          event_date: string | null
          event_description: string | null
          finding_count: number
          first_reg_date: string | null
          fuel: string | null
          id: string
          indicative_total_cents: number | null
          inspector_id: string
          insurer_name: string | null
          job_id: string | null
          licence_plate: string
          locked_at: string | null
          make: string | null
          model: string | null
          odometer_km: number | null
          parent_inspection_id: string | null
          photo_count: number
          purpose: string
          rdw_payload: Json | null
          rdw_verified: boolean
          reference: string
          started_at: string
          status: string
          submitted_at: string | null
          total_hours: number
          updated_at: string
          vehicle_id: string
          vin: string | null
        }
        Insert: {
          claim_number?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          deleted_at?: string | null
          event_date?: string | null
          event_description?: string | null
          finding_count?: number
          first_reg_date?: string | null
          fuel?: string | null
          id?: string
          indicative_total_cents?: number | null
          inspector_id: string
          insurer_name?: string | null
          job_id?: string | null
          licence_plate: string
          locked_at?: string | null
          make?: string | null
          model?: string | null
          odometer_km?: number | null
          parent_inspection_id?: string | null
          photo_count?: number
          purpose?: string
          rdw_payload?: Json | null
          rdw_verified?: boolean
          reference?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
          vehicle_id: string
          vin?: string | null
        }
        Update: {
          claim_number?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          deleted_at?: string | null
          event_date?: string | null
          event_description?: string | null
          finding_count?: number
          first_reg_date?: string | null
          fuel?: string | null
          id?: string
          indicative_total_cents?: number | null
          inspector_id?: string
          insurer_name?: string | null
          job_id?: string | null
          licence_plate?: string
          locked_at?: string | null
          make?: string | null
          model?: string | null
          odometer_km?: number | null
          parent_inspection_id?: string | null
          photo_count?: number
          purpose?: string
          rdw_payload?: Json | null
          rdw_verified?: boolean
          reference?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
          vehicle_id?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ins_inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_inspections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_inspections_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_inspections_parent_inspection_id_fkey"
            columns: ["parent_inspection_id"]
            isOneToOne: false
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_photo_derivatives: {
        Row: {
          generated_at: string
          id: string
          photo_id: string
          storage_path: string
          variant: string
        }
        Insert: {
          generated_at?: string
          id?: string
          photo_id: string
          storage_path: string
          variant: string
        }
        Update: {
          generated_at?: string
          id?: string
          photo_id?: string
          storage_path?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ins_photo_derivatives_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "ins_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_photos: {
        Row: {
          bytes: number
          caption: string | null
          captured_at: string
          captured_by: string
          created_at: string
          finding_id: string | null
          id: string
          inspection_id: string
          kind: string
          mime_type: string
          reference: string
          sequence_no: number
          sha256: string
          shot_key: string | null
          storage_path: string
        }
        Insert: {
          bytes: number
          caption?: string | null
          captured_at: string
          captured_by: string
          created_at?: string
          finding_id?: string | null
          id: string
          inspection_id: string
          kind?: string
          mime_type: string
          reference: string
          sequence_no: number
          sha256: string
          shot_key?: string | null
          storage_path: string
        }
        Update: {
          bytes?: number
          caption?: string | null
          captured_at?: string
          captured_by?: string
          created_at?: string
          finding_id?: string | null
          id?: string
          inspection_id?: string
          kind?: string
          mime_type?: string
          reference?: string
          sequence_no?: number
          sha256?: string
          shot_key?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "ins_photos_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_photos_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "ins_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_share_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          inspection_id: string
          recipient_email: string | null
          revoked_at: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          inspection_id: string
          recipient_email?: string | null
          revoked_at?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          inspection_id?: string
          recipient_email?: string | null
          revoked_at?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ins_share_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ins_share_tokens_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      ins_snapshots: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          pdf_hash: string | null
          pdf_path: string | null
          snapshot: Json
          snapshot_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          pdf_hash?: string | null
          pdf_path?: string | null
          snapshot: Json
          snapshot_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          pdf_hash?: string | null
          pdf_path?: string | null
          snapshot?: Json
          snapshot_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "ins_snapshots_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: true
            referencedRelation: "ins_inspections"
            referencedColumns: ["id"]
          },
        ]
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
          invoice_type: string
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
          invoice_type?: string
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
          invoice_type?: string
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
          tracking_code: string
          tracking_enabled: boolean
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
          tracking_code?: string
          tracking_enabled?: boolean
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
          tracking_code?: string
          tracking_enabled?: boolean
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
          deleted_at: string | null
          deleted_by: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
      portfolio_photos: {
        Row: {
          alt_en: string | null
          alt_nl: string | null
          alt_tr: string | null
          created_at: string
          height: number | null
          id: string
          is_cover: boolean
          pair_group: number | null
          phase: Database["public"]["Enums"]["photo_phase"]
          project_id: string
          redaction_confirmed_at: string | null
          redaction_confirmed_by: string | null
          redaction_regions: Json
          sort_order: number
          source_job_photo_id: string | null
          storage_path: string
          width: number | null
        }
        Insert: {
          alt_en?: string | null
          alt_nl?: string | null
          alt_tr?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          pair_group?: number | null
          phase?: Database["public"]["Enums"]["photo_phase"]
          project_id: string
          redaction_confirmed_at?: string | null
          redaction_confirmed_by?: string | null
          redaction_regions?: Json
          sort_order?: number
          source_job_photo_id?: string | null
          storage_path: string
          width?: number | null
        }
        Update: {
          alt_en?: string | null
          alt_nl?: string | null
          alt_tr?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          pair_group?: number | null
          phase?: Database["public"]["Enums"]["photo_phase"]
          project_id?: string
          redaction_confirmed_at?: string | null
          redaction_confirmed_by?: string | null
          redaction_regions?: Json
          sort_order?: number
          source_job_photo_id?: string | null
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "portfolio_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_photos_source_job_photo_id_fkey"
            columns: ["source_job_photo_id"]
            isOneToOne: false
            referencedRelation: "job_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          brand_id: string | null
          build_year: number | null
          category: string
          colour_name: string | null
          consent_document_id: string | null
          consent_status: string
          converted_at: string | null
          converted_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          dossier_number: string | null
          duration_working_days: number | null
          featured: boolean
          handling: string | null
          id: string
          job_id: string | null
          model_free_text: string | null
          model_id: string | null
          paint_code: string | null
          published_at: string | null
          sort_order: number
          source: string
          status: string
          summary_en: string | null
          summary_nl: string | null
          summary_tr: string | null
          title_en: string | null
          title_nl: string
          title_tr: string | null
          updated_at: string
          work_items: string[]
        }
        Insert: {
          brand_id?: string | null
          build_year?: number | null
          category?: string
          colour_name?: string | null
          consent_document_id?: string | null
          consent_status?: string
          converted_at?: string | null
          converted_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dossier_number?: string | null
          duration_working_days?: number | null
          featured?: boolean
          handling?: string | null
          id?: string
          job_id?: string | null
          model_free_text?: string | null
          model_id?: string | null
          paint_code?: string | null
          published_at?: string | null
          sort_order?: number
          source?: string
          status?: string
          summary_en?: string | null
          summary_nl?: string | null
          summary_tr?: string | null
          title_en?: string | null
          title_nl?: string
          title_tr?: string | null
          updated_at?: string
          work_items?: string[]
        }
        Update: {
          brand_id?: string | null
          build_year?: number | null
          category?: string
          colour_name?: string | null
          consent_document_id?: string | null
          consent_status?: string
          converted_at?: string | null
          converted_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dossier_number?: string | null
          duration_working_days?: number | null
          featured?: boolean
          handling?: string | null
          id?: string
          job_id?: string | null
          model_free_text?: string | null
          model_id?: string | null
          paint_code?: string | null
          published_at?: string | null
          sort_order?: number
          source?: string
          status?: string
          summary_en?: string | null
          summary_nl?: string | null
          summary_tr?: string | null
          title_en?: string | null
          title_nl?: string
          title_tr?: string | null
          updated_at?: string
          work_items?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "vehicle_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_consent_document_id_fkey"
            columns: ["consent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
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
          ip_hash: string | null
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
          ip_hash?: string | null
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
          ip_hash?: string | null
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
          driver_contact_id: string | null
          fuel: string | null
          id: string
          insurer_id: string | null
          kenteken: string | null
          kleur: string | null
          lease_company_id: string | null
          make: string | null
          merk: string | null
          model: string | null
          notes: string | null
          ownership: Database["public"]["Enums"]["vehicle_ownership"] | null
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
          driver_contact_id?: string | null
          fuel?: string | null
          id?: string
          insurer_id?: string | null
          kenteken?: string | null
          kleur?: string | null
          lease_company_id?: string | null
          make?: string | null
          merk?: string | null
          model?: string | null
          notes?: string | null
          ownership?: Database["public"]["Enums"]["vehicle_ownership"] | null
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
          driver_contact_id?: string | null
          fuel?: string | null
          id?: string
          insurer_id?: string | null
          kenteken?: string | null
          kleur?: string | null
          lease_company_id?: string | null
          make?: string | null
          merk?: string | null
          model?: string | null
          notes?: string | null
          ownership?: Database["public"]["Enums"]["vehicle_ownership"] | null
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
          {
            foreignKeyName: "vehicles_driver_contact_id_fkey"
            columns: ["driver_contact_id"]
            isOneToOne: false
            referencedRelation: "customer_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_lease_company_id_fkey"
            columns: ["lease_company_id"]
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
      generate_tracking_code: { Args: never; Returns: string }
      ins_in_transition: { Args: never; Returns: boolean }
      ins_next_reference: { Args: never; Returns: string }
      is_active_staff: { Args: never; Returns: boolean }
      is_admin_staff: { Args: never; Returns: boolean }
      is_office_or_admin_staff: { Args: never; Returns: boolean }
      portfolio_assign_dossier_number: {
        Args: { p_project_id: string }
        Returns: string
      }
    }
    Enums: {
      activity_type: "call" | "email" | "visit" | "whatsapp" | "system"
      address_type: "registered" | "invoice" | "pickup_delivery"
      agreement_status: "draft" | "active" | "expired" | "superseded"
      appointment_status: "requested" | "confirmed" | "cancelled" | "completed"
      appointment_type: "inspection" | "drop_off" | "collection" | "repair_slot"
      calculation_system: "audatex_qapter" | "silverdat" | "autotaal" | "none"
      consent_basis: "consent" | "contract" | "legitimate_interest"
      consent_channel: "email" | "sms" | "whatsapp" | "phone"
      consent_purpose:
        | "marketing"
        | "review_request"
        | "service_reminder"
        | "seasonal"
      contact_role:
        | "fleet_manager"
        | "damage_coordinator"
        | "accounts_payable"
        | "signatory"
        | "procurement"
        | "driver_support"
        | "driver"
        | "other"
      customer_document_type:
        | "kvk_extract"
        | "contract"
        | "rate_card"
        | "insurance_certificate"
        | "other"
      customer_status:
        | "active"
        | "inactive"
        | "blocked"
        | "prospect"
        | "suspended"
        | "ended"
      customer_type:
        | "private"
        | "company"
        | "fleet"
        | "dealer"
        | "sme"
        | "corporate_fleet"
        | "lease_company"
        | "rental"
        | "taxi_transport"
        | "bodyshop_partner"
        | "insurer"
        | "insurance_intermediary"
        | "government"
      default_payer: "customer" | "insurer" | "split" | "lease" | "third_party"
      doc_status: "draft" | "issued" | "cancelled"
      doc_type:
        | "offer"
        | "repair_order"
        | "handover_note"
        | "invoice"
        | "credit_note"
        | "project_dossier"
      excess_handling:
        | "customer_pays_us"
        | "insurer_deducts"
        | "invoice_driver"
        | "n_a"
      insurance_party_type: "insurer" | "lease_company" | "intermediary"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "overdue"
        | "cancelled"
        | "credited"
      invoicing_mode: "per_job" | "weekly_collective" | "monthly_collective"
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
      legal_form:
        | "bv"
        | "nv"
        | "vof"
        | "eenmanszaak"
        | "stichting"
        | "cv"
        | "foreign"
        | "other"
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
      paint_material_method: "pct_of_list" | "per_m2" | "index"
      part_status: "needed" | "ordered" | "shipped" | "received" | "returned"
      payer_type: "casco" | "wa" | "particulier" | "lease"
      payment_method: "ideal" | "bank_transfer" | "cash" | "card" | "mollie"
      photo_phase: "before" | "during" | "after"
      preferred_channel: "email" | "phone" | "whatsapp" | "portal"
      preferred_language: "nl" | "en" | "tr" | "bg" | "de"
      repair_network: "none" | "schadegarant" | "topherstel" | "other"
      replacement_vehicle_policy:
        | "included"
        | "charged"
        | "customer_supplies"
        | "none"
      resource_type: "bay" | "booth" | "staff"
      staff_role: "admin" | "office" | "tech"
      strategic_value: "key" | "growth" | "maintain" | "exit"
      task_status: "todo" | "in_progress" | "done" | "blocked"
      tax_code: "H21" | "L9" | "N0" | "V0" | "M0" | "ICP" | "EX"
      vat_period_type: "quarter" | "month"
      vat_return_status: "open" | "draft" | "filed" | "corrected"
      vat_treatment: "nl_standard" | "eu_reverse_charge" | "non_eu" | "exempt"
      vehicle_ownership: "owned" | "leased" | "rental" | "unknown"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_type: ["call", "email", "visit", "whatsapp", "system"],
      address_type: ["registered", "invoice", "pickup_delivery"],
      agreement_status: ["draft", "active", "expired", "superseded"],
      appointment_status: ["requested", "confirmed", "cancelled", "completed"],
      appointment_type: ["inspection", "drop_off", "collection", "repair_slot"],
      calculation_system: ["audatex_qapter", "silverdat", "autotaal", "none"],
      consent_basis: ["consent", "contract", "legitimate_interest"],
      consent_channel: ["email", "sms", "whatsapp", "phone"],
      consent_purpose: [
        "marketing",
        "review_request",
        "service_reminder",
        "seasonal",
      ],
      contact_role: [
        "fleet_manager",
        "damage_coordinator",
        "accounts_payable",
        "signatory",
        "procurement",
        "driver_support",
        "driver",
        "other",
      ],
      customer_document_type: [
        "kvk_extract",
        "contract",
        "rate_card",
        "insurance_certificate",
        "other",
      ],
      customer_status: [
        "active",
        "inactive",
        "blocked",
        "prospect",
        "suspended",
        "ended",
      ],
      customer_type: [
        "private",
        "company",
        "fleet",
        "dealer",
        "sme",
        "corporate_fleet",
        "lease_company",
        "rental",
        "taxi_transport",
        "bodyshop_partner",
        "insurer",
        "insurance_intermediary",
        "government",
      ],
      default_payer: ["customer", "insurer", "split", "lease", "third_party"],
      doc_status: ["draft", "issued", "cancelled"],
      doc_type: [
        "offer",
        "repair_order",
        "handover_note",
        "invoice",
        "credit_note",
        "project_dossier",
      ],
      excess_handling: [
        "customer_pays_us",
        "insurer_deducts",
        "invoice_driver",
        "n_a",
      ],
      insurance_party_type: ["insurer", "lease_company", "intermediary"],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "overdue",
        "cancelled",
        "credited",
      ],
      invoicing_mode: ["per_job", "weekly_collective", "monthly_collective"],
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
      legal_form: [
        "bv",
        "nv",
        "vof",
        "eenmanszaak",
        "stichting",
        "cv",
        "foreign",
        "other",
      ],
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
      paint_material_method: ["pct_of_list", "per_m2", "index"],
      part_status: ["needed", "ordered", "shipped", "received", "returned"],
      payer_type: ["casco", "wa", "particulier", "lease"],
      payment_method: ["ideal", "bank_transfer", "cash", "card", "mollie"],
      photo_phase: ["before", "during", "after"],
      preferred_channel: ["email", "phone", "whatsapp", "portal"],
      preferred_language: ["nl", "en", "tr", "bg", "de"],
      repair_network: ["none", "schadegarant", "topherstel", "other"],
      replacement_vehicle_policy: [
        "included",
        "charged",
        "customer_supplies",
        "none",
      ],
      resource_type: ["bay", "booth", "staff"],
      staff_role: ["admin", "office", "tech"],
      strategic_value: ["key", "growth", "maintain", "exit"],
      task_status: ["todo", "in_progress", "done", "blocked"],
      tax_code: ["H21", "L9", "N0", "V0", "M0", "ICP", "EX"],
      vat_period_type: ["quarter", "month"],
      vat_return_status: ["open", "draft", "filed", "corrected"],
      vat_treatment: ["nl_standard", "eu_reverse_charge", "non_eu", "exempt"],
      vehicle_ownership: ["owned", "leased", "rental", "unknown"],
      vehicle_status: ["created", "in_progress", "done", "archived"],
    },
  },
} as const

// ── Custom type aliases (keep in sync after regeneration) ──

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
