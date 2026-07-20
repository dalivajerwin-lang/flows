export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "superadmin" | "manager" | "property_consultant";
          display_name: string;
          agent_number: string;
          email: string;
          phone: string;
          profile_photo_url: string | null;
          crf_link: string | null;
          is_active: boolean;
          last_login_at: string | null;
          personal_monthly_target: number;
          onboarding: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "superadmin" | "manager" | "property_consultant";
          display_name: string;
          agent_number: string;
          email: string;
          phone?: string;
          profile_photo_url?: string | null;
          crf_link?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          personal_monthly_target?: number | bigint;
          onboarding?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "superadmin" | "manager" | "property_consultant";
          display_name?: string;
          agent_number?: string;
          email?: string;
          phone?: string;
          profile_photo_url?: string | null;
          crf_link?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          personal_monthly_target?: number | bigint;
          onboarding?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedSchema: "auth";
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          developer: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          developer?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          developer?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          full_name: string;
          contact_number: string;
          email: string | null;
          stage: string;
          previous_stage: string | null;
          assigned_to: string | null;
          project_id: string | null;
          source: string;
          source_other_description: string | null;
          unit_types: string[];
          date_added: string;
          facebook_url: string | null;
          facebook_canonical_id: string | null;
          profile_photo_url: string | null;
          sale_price: number | null;
          deleted_at: string | null;
          reactivated_at: string | null;
          stage_changed_at: string;
          last_activity_at: string;
          crf_submission_date: string | null;
          crf_first_entered_at: string | null;
          crf_expires_at: string | null;
          unit_description: string | null;
          unit_payment_date: string | null;
          unit_payment_status: "paid" | "unpaid" | null;
          reservation_expires_at: string | null;
          reservation_status: "active" | "expired" | null;
          documentation_start_date: string | null;
          sale_payment_date: string | null;
          cancellation_reason: string | null;
          closed_sale_status: "pending_verification" | "verified" | null;
          closed_sale_verified_by: string | null;
          closed_sale_verified_at: string | null;
          closed_sale_rejection_reason: string | null;
          undo_deadline: string | null;
          undo_actor_id: string | null;
          archived_at: string | null;
          archive_reason: string | null;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          contact_number?: string;
          email?: string | null;
          stage?: string;
          previous_stage?: string | null;
          assigned_to?: string | null;
          project_id?: string | null;
          source: string;
          source_other_description?: string | null;
          unit_types?: string[];
          date_added?: string;
          facebook_url?: string | null;
          facebook_canonical_id?: string | null;
          profile_photo_url?: string | null;
          sale_price?: number | bigint | null;
          deleted_at?: string | null;
          reactivated_at?: string | null;
          stage_changed_at?: string;
          last_activity_at?: string;
          crf_submission_date?: string | null;
          crf_first_entered_at?: string | null;
          crf_expires_at?: string | null;
          unit_description?: string | null;
          unit_payment_date?: string | null;
          unit_payment_status?: "paid" | "unpaid" | null;
          reservation_expires_at?: string | null;
          reservation_status?: "active" | "expired" | null;
          documentation_start_date?: string | null;
          sale_payment_date?: string | null;
          cancellation_reason?: string | null;
          closed_sale_status?: "pending_verification" | "verified" | null;
          closed_sale_verified_by?: string | null;
          closed_sale_verified_at?: string | null;
          closed_sale_rejection_reason?: string | null;
          undo_deadline?: string | null;
          undo_actor_id?: string | null;
          archived_at?: string | null;
          archive_reason?: string | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          contact_number?: string;
          email?: string | null;
          stage?: string;
          previous_stage?: string | null;
          assigned_to?: string | null;
          project_id?: string | null;
          source?: string;
          source_other_description?: string | null;
          unit_types?: string[];
          date_added?: string;
          facebook_url?: string | null;
          facebook_canonical_id?: string | null;
          profile_photo_url?: string | null;
          sale_price?: number | bigint | null;
          deleted_at?: string | null;
          reactivated_at?: string | null;
          stage_changed_at?: string;
          last_activity_at?: string;
          crf_submission_date?: string | null;
          crf_first_entered_at?: string | null;
          crf_expires_at?: string | null;
          unit_description?: string | null;
          unit_payment_date?: string | null;
          unit_payment_status?: "paid" | "unpaid" | null;
          reservation_expires_at?: string | null;
          reservation_status?: "active" | "expired" | null;
          documentation_start_date?: string | null;
          sale_payment_date?: string | null;
          cancellation_reason?: string | null;
          closed_sale_status?: "pending_verification" | "verified" | null;
          closed_sale_verified_by?: string | null;
          closed_sale_verified_at?: string | null;
          closed_sale_rejection_reason?: string | null;
          undo_deadline?: string | null;
          undo_actor_id?: string | null;
          archived_at?: string | null;
          archive_reason?: string | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "leads_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "leads_closed_sale_verified_by_fkey";
            columns: ["closed_sale_verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "leads_undo_actor_id_fkey";
            columns: ["undo_actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          author_id: string;
          body: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          author_id: string;
          body: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          author_id?: string;
          body?: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "lead_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      lead_buyers: {
        Row: {
          id: string;
          lead_id: string;
          name: string;
          kind: "primary" | "co_buyer" | "co_owner";
          docs: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          name: string;
          kind: "primary" | "co_buyer" | "co_owner";
          docs?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          name?: string;
          kind?: "primary" | "co_buyer" | "co_owner";
          docs?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_buyers_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedSchema: "public";
          },
        ];
      };
      audit_trail: {
        Row: {
          id: string;
          lead_id: string | null;
          actor_id: string | null;
          type: string;
          summary: string;
          meta: Json;
          severity: "info" | "warning" | "critical";
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          actor_id?: string | null;
          type: string;
          summary: string;
          meta?: Json;
          severity?: "info" | "warning" | "critical";
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          actor_id?: string | null;
          type?: string;
          summary?: string;
          meta?: Json;
          severity?: "info" | "warning" | "critical";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_trail_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "audit_trail_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          appointment_type: string;
          consultant_id: string;
          lead_id: string | null;
          project_id: string | null;
          title: string;
          location: string;
          notes: string;
          starts_at: string;
          ends_at: string;
          is_public: boolean;
          cancellation_requested_by: string | null;
          cancellation_requested_at: string | null;
          reminder_sent_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_type: string;
          consultant_id: string;
          lead_id?: string | null;
          project_id?: string | null;
          title: string;
          location?: string;
          notes?: string;
          starts_at: string;
          ends_at: string;
          is_public?: boolean;
          cancellation_requested_by?: string | null;
          cancellation_requested_at?: string | null;
          reminder_sent_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_type?: string;
          consultant_id?: string;
          lead_id?: string | null;
          project_id?: string | null;
          title?: string;
          location?: string;
          notes?: string;
          starts_at?: string;
          ends_at?: string;
          is_public?: boolean;
          cancellation_requested_by?: string | null;
          cancellation_requested_at?: string | null;
          reminder_sent_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_consultant_id_fkey";
            columns: ["consultant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "appointments_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "appointments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "appointments_cancellation_requested_by_fkey";
            columns: ["cancellation_requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "appointments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      stage_reversion_requests: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string;
          from_stage: string;
          to_stage: string;
          reason: string;
          status: "pending" | "approved" | "denied";
          resolved_by: string | null;
          resolved_at: string | null;
          correction_reason: string | null;
          deny_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id: string;
          from_stage: string;
          to_stage: string;
          reason: string;
          status?: "pending" | "approved" | "denied";
          resolved_by?: string | null;
          resolved_at?: string | null;
          correction_reason?: string | null;
          deny_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          agent_id?: string;
          from_stage?: string;
          to_stage?: string;
          reason?: string;
          status?: "pending" | "approved" | "denied";
          resolved_by?: string | null;
          resolved_at?: string | null;
          correction_reason?: string | null;
          deny_reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stage_reversion_requests_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "stage_reversion_requests_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "stage_reversion_requests_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      crf_extensions: {
        Row: {
          id: string;
          lead_id: string;
          actor_id: string;
          reason: string;
          status: "auto_approved" | "pending" | "approved" | "denied";
          resolved_by: string | null;
          resolved_at: string | null;
          requested_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          actor_id: string;
          reason: string;
          status?: "auto_approved" | "pending" | "approved" | "denied";
          resolved_by?: string | null;
          resolved_at?: string | null;
          requested_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          actor_id?: string;
          reason?: string;
          status?: "auto_approved" | "pending" | "approved" | "denied";
          resolved_by?: string | null;
          resolved_at?: string | null;
          requested_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crf_extensions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "crf_extensions_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "crf_extensions_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string | null;
          title: string;
          body: string;
          is_read: boolean;
          target_route: string | null;
          type: string | null;
          layers: Json;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id?: string | null;
          title: string;
          body: string;
          is_read?: boolean;
          target_route?: string | null;
          type?: string | null;
          layers?: Json;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string | null;
          title?: string;
          body?: string;
          is_read?: boolean;
          target_route?: string | null;
          type?: string | null;
          layers?: Json;
          meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "notifications_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedSchema: "public";
          },
        ];
      };
      broadcasts: {
        Row: {
          id: string;
          sender_id: string;
          message: string;
          image_url: string | null;
          link_url: string | null;
          file_name: string | null;
          file_url: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          message: string;
          image_url?: string | null;
          link_url?: string | null;
          file_name?: string | null;
          file_url?: string | null;
          file_size?: number | bigint | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          message?: string;
          image_url?: string | null;
          link_url?: string | null;
          file_name?: string | null;
          file_url?: string | null;
          file_size?: number | bigint | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "broadcasts_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      broadcast_acknowledgments: {
        Row: {
          id: string;
          broadcast_id: string;
          user_id: string;
          acknowledged_at: string;
        };
        Insert: {
          id?: string;
          broadcast_id: string;
          user_id: string;
          acknowledged_at?: string;
        };
        Update: {
          id?: string;
          broadcast_id?: string;
          user_id?: string;
          acknowledged_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "broadcast_acknowledgments_broadcast_id_fkey";
            columns: ["broadcast_id"];
            isOneToOne: false;
            referencedRelation: "broadcasts";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "broadcast_acknowledgments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
      team_goals: {
        Row: {
          id: string;
          month: string;
          target_amount: number;
        };
        Insert: {
          id?: string;
          month: string;
          target_amount?: number | bigint;
        };
        Update: {
          id?: string;
          month?: string;
          target_amount?: number | bigint;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          id: number;
          company_timezone: string;
          registration_locked: boolean;
          onboarding_enabled: boolean;
        };
        Insert: {
          id?: number;
          company_timezone?: string;
          registration_locked?: boolean;
          onboarding_enabled?: boolean;
        };
        Update: {
          id?: number;
          company_timezone?: string;
          registration_locked?: boolean;
          onboarding_enabled?: boolean;
        };
        Relationships: [];
      };
      registration_tokens: {
        Row: {
          id: string;
          token: string;
          created_by: string;
          intended_role: "manager" | "property_consultant";
          intended_display_name: string;
          intended_agent_number: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token?: string;
          created_by: string;
          intended_role: "manager" | "property_consultant";
          intended_display_name?: string;
          intended_agent_number?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          created_by?: string;
          intended_role?: "manager" | "property_consultant";
          intended_display_name?: string;
          intended_agent_number?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registration_tokens_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
          {
            foreignKeyName: "registration_tokens_used_by_fkey";
            columns: ["used_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedSchema: "public";
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      transition_lead: {
        Args: {
          p_lead_id: string;
          p_to_stage: string;
          p_fields: Json;
          p_actor_id: string;
          p_auto?: boolean;
          p_skip_undo?: boolean;
        };
        Returns: Json;
      };
      undo_transition: {
        Args: {
          p_lead_id: string;
          p_actor_id: string;
        };
        Returns: Json;
      };
      request_stage_reversion: {
        Args: {
          p_lead_id: string;
          p_to_stage: string;
          p_reason: string;
          p_actor_id: string;
        };
        Returns: Json;
      };
      approve_reversion: {
        Args: {
          p_request_id: string;
          p_correction_reason: string;
          p_actor_id: string;
        };
        Returns: Json;
      };
      deny_reversion: {
        Args: {
          p_request_id: string;
          p_deny_reason: string;
          p_actor_id: string;
        };
        Returns: Json;
      };
      sweep_expiries_cron: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      is_superadmin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_update_system_settings: {
        Args: {
          p_registration_locked?: boolean | null;
          p_onboarding_enabled?: boolean | null;
        };
        Returns: void;
      };
      admin_set_role: {
        Args: { p_target_id: string; p_new_role: string };
        Returns: void;
      };
      admin_set_active: {
        Args: { p_target_id: string; p_active: boolean };
        Returns: void;
      };
      admin_revoke_token: {
        Args: { p_token_id: string };
        Returns: void;
      };
      admin_reassign_leads: {
        Args: { p_from_user: string; p_to_user: string; p_lead_ids?: string[] | null };
        Returns: number;
      };
      admin_force_stage: {
        Args: { p_lead_id: string; p_to_stage: string; p_reason: string };
        Returns: void;
      };
      admin_restore_lead: {
        Args: { p_lead_id: string };
        Returns: void;
      };
      admin_purge_trash: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      admin_health_snapshot: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
