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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          audience: string
          capacity: number
          created_at: string
          ends_at: string | null
          event_type_label: string
          id: string
          price_halalas: number | null
          publication_status: string
          registration_status: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          audience: string
          capacity: number
          created_at?: string
          ends_at?: string | null
          event_type_label: string
          id?: string
          price_halalas?: number | null
          publication_status?: string
          registration_status?: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          capacity?: number
          created_at?: string
          ends_at?: string | null
          event_type_label?: string
          id?: string
          price_halalas?: number | null
          publication_status?: string
          registration_status?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_reminders: {
        Row: {
          id: string
          management_token_hash: string
          prepared_at: string
          registration_id: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          management_token_hash: string
          prepared_at?: string
          registration_id: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          management_token_hash?: string
          prepared_at?: string
          registration_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_reminders_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          attendance_status: string
          attendee_name: string
          booking_token_hash: string | null
          cancelled_at: string | null
          check_in_status: string
          checked_in_at: string | null
          created_at: string
          email: string | null
          event_id: string
          guardian_consent: boolean
          guardian_name: string | null
          id: string
          invitation_accepted_at: string | null
          invitation_expired_at: string | null
          invitation_expires_at: string | null
          invitation_revoked_at: string | null
          invitation_token_hash: string | null
          invited_at: string | null
          participant_age: number | null
          phone_e164: string
          price_halalas_at_booking: number
          promoted_at: string | null
          public_reference: string
          retention_until: string
          status: string
          updated_at: string
        }
        Insert: {
          attendance_status?: string
          attendee_name: string
          booking_token_hash?: string | null
          cancelled_at?: string | null
          check_in_status?: string
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          guardian_consent?: boolean
          guardian_name?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_expired_at?: string | null
          invitation_expires_at?: string | null
          invitation_revoked_at?: string | null
          invitation_token_hash?: string | null
          invited_at?: string | null
          participant_age?: number | null
          phone_e164: string
          price_halalas_at_booking: number
          promoted_at?: string | null
          public_reference?: string
          retention_until: string
          status: string
          updated_at?: string
        }
        Update: {
          attendance_status?: string
          attendee_name?: string
          booking_token_hash?: string | null
          cancelled_at?: string | null
          check_in_status?: string
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          guardian_consent?: boolean
          guardian_name?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_expired_at?: string | null
          invitation_expires_at?: string | null
          invitation_revoked_at?: string | null
          invitation_token_hash?: string | null
          invited_at?: string | null
          participant_age?: number | null
          phone_e164?: string
          price_halalas_at_booking?: number
          promoted_at?: string | null
          public_reference?: string
          retention_until?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          attendee_count: number | null
          created_at: string
          email: string | null
          id: string
          management_token_hash: string
          notes: string | null
          offer_expires_at: string | null
          offer_price_halalas: number | null
          offer_responded_at: string | null
          offer_terms: string | null
          phone_e164: string
          public_reference: string
          request_kind: string
          requested_date: string | null
          requested_end_time: string | null
          requested_start_time: string | null
          requester_name: string
          retention_until: string | null
          status: string
          updated_at: string
          use_or_occasion_type: string | null
          workshop_description: string | null
          workshop_duration: string | null
          workshop_expected_attendance: number | null
          workshop_portfolio_url: string | null
          workshop_requirements: string | null
          workshop_target_audience: string | null
          workshop_title: string | null
        }
        Insert: {
          attendee_count?: number | null
          created_at?: string
          email?: string | null
          id?: string
          management_token_hash: string
          notes?: string | null
          offer_expires_at?: string | null
          offer_price_halalas?: number | null
          offer_responded_at?: string | null
          offer_terms?: string | null
          phone_e164: string
          public_reference?: string
          request_kind: string
          requested_date?: string | null
          requested_end_time?: string | null
          requested_start_time?: string | null
          requester_name: string
          retention_until?: string | null
          status?: string
          updated_at?: string
          use_or_occasion_type?: string | null
          workshop_description?: string | null
          workshop_duration?: string | null
          workshop_expected_attendance?: number | null
          workshop_portfolio_url?: string | null
          workshop_requirements?: string | null
          workshop_target_audience?: string | null
          workshop_title?: string | null
        }
        Update: {
          attendee_count?: number | null
          created_at?: string
          email?: string | null
          id?: string
          management_token_hash?: string
          notes?: string | null
          offer_expires_at?: string | null
          offer_price_halalas?: number | null
          offer_responded_at?: string | null
          offer_terms?: string | null
          phone_e164?: string
          public_reference?: string
          request_kind?: string
          requested_date?: string | null
          requested_end_time?: string | null
          requested_start_time?: string | null
          requester_name?: string
          retention_until?: string | null
          status?: string
          updated_at?: string
          use_or_occasion_type?: string | null
          workshop_description?: string | null
          workshop_duration?: string | null
          workshop_expected_attendance?: number | null
          workshop_portfolio_url?: string | null
          workshop_requirements?: string | null
          workshop_target_audience?: string | null
          workshop_title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_waitlist_invitation: {
        Args: { p_invitation_token_hash: string }
        Returns: undefined
      }
      cancel_booking_by_token: {
        Args: { p_booking_token_hash: string }
        Returns: undefined
      }
      cancel_registration: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
      cancel_service_request_by_token: {
        Args: { p_management_token_hash: string }
        Returns: undefined
      }
      confirm_booking_attendance_by_token: {
        Args: { p_booking_token_hash: string }
        Returns: undefined
      }
      confirm_registration_attendance: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
      create_service_request_offer: {
        Args: {
          p_expires_at?: string
          p_price_halalas: number
          p_request_id: string
          p_terms: string
        }
        Returns: string
      }
      get_booking_by_token: {
        Args: { p_booking_token_hash: string }
        Returns: {
          attendance_status: string
          attendee_name: string
          event_ends_at: string
          event_starts_at: string
          event_title: string
          price_halalas_at_booking: number
          registration_status: string
        }[]
      }
      get_event_registration_states: {
        Args: never
        Returns: {
          active_reservation_count: number
          event_id: string
          registration_availability: string
        }[]
      }
      get_service_request_by_token: {
        Args: { p_management_token_hash: string }
        Returns: {
          attendee_count: number
          notes: string
          offer_expires_at: string
          offer_price_halalas: number
          offer_terms: string
          request_kind: string
          request_status: string
          requested_date: string
          requested_end_time: string
          requested_start_time: string
          requester_name: string
          use_or_occasion_type: string
          workshop_description: string
          workshop_duration: string
          workshop_expected_attendance: number
          workshop_portfolio_url: string
          workshop_requirements: string
          workshop_target_audience: string
          workshop_title: string
        }[]
      }
      get_waitlist_invitation: {
        Args: { p_invitation_token_hash: string }
        Returns: {
          attendee_name: string
          event_starts_at: string
          event_title: string
          invitation_expires_at: string
        }[]
      }
      invite_waitlisted_registration: {
        Args: { p_invitation_token_hash: string; p_registration_id: string }
        Returns: string
      }
      issue_registration_reminder: {
        Args: { p_management_token_hash: string; p_registration_id: string }
        Returns: string
      }
      mark_registration_reminder_sent: {
        Args: { p_reminder_id: string }
        Returns: undefined
      }
      record_registration_check_in: {
        Args: { p_check_in_status: string; p_registration_id: string }
        Returns: undefined
      }
      register_for_event: {
        Args: {
          p_attendee_name: string
          p_booking_token_hash: string
          p_email: string
          p_event_id: string
          p_guardian_consent: boolean
          p_guardian_name: string
          p_participant_age: number
          p_phone_e164: string
        }
        Returns: {
          registration_reference: string
          registration_status: string
        }[]
      }
      respond_to_service_request_offer: {
        Args: { p_management_token_hash: string; p_response: string }
        Returns: undefined
      }
      revoke_waitlist_invitation: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
      start_service_request_review: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      submit_service_request: {
        Args: {
          p_attendee_count: number
          p_email: string
          p_management_token_hash: string
          p_notes: string
          p_phone_e164: string
          p_request_kind: string
          p_requested_date: string
          p_requested_end_time: string
          p_requested_start_time: string
          p_requester_name: string
          p_use_or_occasion_type: string
          p_workshop_description: string
          p_workshop_duration: string
          p_workshop_expected_attendance: number
          p_workshop_portfolio_url: string
          p_workshop_requirements: string
          p_workshop_target_audience: string
          p_workshop_title: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
