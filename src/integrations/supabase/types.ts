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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      complaints: {
        Row: {
          ack_sent_at: string | null
          created_at: string | null
          email: string
          id: string
          notes: string | null
          owner_id: string | null
          resend_message_ids: string[] | null
          song_url: string | null
          status: Database["public"]["Enums"]["complaint_status"] | null
          updated_at: string | null
        }
        Insert: {
          ack_sent_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          resend_message_ids?: string[] | null
          song_url?: string | null
          status?: Database["public"]["Enums"]["complaint_status"] | null
          updated_at?: string | null
        }
        Update: {
          ack_sent_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          resend_message_ids?: string[] | null
          song_url?: string | null
          status?: Database["public"]["Enums"]["complaint_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          active: boolean
          body_html: string
          body_text: string | null
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          active?: boolean
          body_html: string
          body_text?: string | null
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          active?: boolean
          body_html?: string
          body_text?: string | null
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      genre_families: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          admitted_at: string | null
          admitted_group: string | null
          created_at: string | null
          email: string
          id: string
          ip_join_confirmed: boolean | null
          member_id: string | null
          name: string
          notes: string | null
          owner_id: string | null
          resend_message_ids: string[] | null
          soundcloud_url: string | null
          status: Database["public"]["Enums"]["inquiry_status"] | null
          updated_at: string | null
        }
        Insert: {
          admitted_at?: string | null
          admitted_group?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_join_confirmed?: boolean | null
          member_id?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          resend_message_ids?: string[] | null
          soundcloud_url?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          updated_at?: string | null
        }
        Update: {
          admitted_at?: string | null
          admitted_group?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_join_confirmed?: boolean | null
          member_id?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          resend_message_ids?: string[] | null
          soundcloud_url?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_events: {
        Row: {
          event_type: string
          id: string
          message_id: string
          meta: Json | null
          object_id: string
          object_type: string
          timestamp: string | null
        }
        Insert: {
          event_type: string
          id?: string
          message_id: string
          meta?: Json | null
          object_id: string
          object_type: string
          timestamp?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          message_id?: string
          meta?: Json | null
          object_id?: string
          object_type?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          classification_source: string | null
          created_at: string | null
          credits_given: number | null
          credits_used: number | null
          emails: string[] | null
          families: string[] | null
          followers: number | null
          id: string
          last_classified_at: string | null
          last_submission_at: string | null
          monthly_credit_limit: number | null
          monthly_submission_limit: number | null
          name: string
          net_credits: number | null
          primary_email: string | null
          reach_factor: number | null
          size_tier: Database["public"]["Enums"]["size_tier"] | null
          soundcloud_followers: number | null
          soundcloud_url: string | null
          spotify_genres: string[] | null
          spotify_genres_updated_at: string | null
          spotify_url: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          subgenres: string[] | null
          submissions_this_month: number | null
          updated_at: string | null
        }
        Insert: {
          classification_source?: string | null
          created_at?: string | null
          credits_given?: number | null
          credits_used?: number | null
          emails?: string[] | null
          families?: string[] | null
          followers?: number | null
          id?: string
          last_classified_at?: string | null
          last_submission_at?: string | null
          monthly_credit_limit?: number | null
          monthly_submission_limit?: number | null
          name: string
          net_credits?: number | null
          primary_email?: string | null
          reach_factor?: number | null
          size_tier?: Database["public"]["Enums"]["size_tier"] | null
          soundcloud_followers?: number | null
          soundcloud_url?: string | null
          spotify_genres?: string[] | null
          spotify_genres_updated_at?: string | null
          spotify_url?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          subgenres?: string[] | null
          submissions_this_month?: number | null
          updated_at?: string | null
        }
        Update: {
          classification_source?: string | null
          created_at?: string | null
          credits_given?: number | null
          credits_used?: number | null
          emails?: string[] | null
          families?: string[] | null
          followers?: number | null
          id?: string
          last_classified_at?: string | null
          last_submission_at?: string | null
          monthly_credit_limit?: number | null
          monthly_submission_limit?: number | null
          name?: string
          net_credits?: number | null
          primary_email?: string | null
          reach_factor?: number | null
          size_tier?: Database["public"]["Enums"]["size_tier"] | null
          soundcloud_followers?: number | null
          soundcloud_url?: string | null
          spotify_genres?: string[] | null
          spotify_genres_updated_at?: string | null
          spotify_url?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          subgenres?: string[] | null
          submissions_this_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queue_assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_allocated: number
          id: string
          position: number
          proof_submitted_at: string | null
          proof_url: string | null
          queue_id: string
          status: string
          submission_id: string
          supporter_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_allocated?: number
          id?: string
          position: number
          proof_submitted_at?: string | null
          proof_url?: string | null
          queue_id: string
          status?: string
          submission_id: string
          supporter_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_allocated?: number
          id?: string
          position?: number
          proof_submitted_at?: string | null
          proof_url?: string | null
          queue_id?: string
          status?: string
          submission_id?: string
          supporter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_assignments_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_assignments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_assignments_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          approved_at: string | null
          approved_by_id: string | null
          created_at: string
          created_by_id: string | null
          date: string
          filled_slots: number
          id: string
          notes: string | null
          published_at: string | null
          status: string
          total_slots: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date: string
          filled_slots?: number
          id?: string
          notes?: string | null
          published_at?: string | null
          status?: string
          total_slots?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date?: string
          filled_slots?: number
          id?: string
          notes?: string | null
          published_at?: string | null
          status?: string
          total_slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          adjacency_matrix: Json | null
          created_at: string | null
          decision_sla_hours: number | null
          default_reach_factor: number | null
          id: string
          inactivity_days: number | null
          preview_cache_days: number | null
          proof_sla_hours: number | null
          size_tier_thresholds: Json | null
          slack_channel: string | null
          slack_enabled: boolean | null
          slack_webhook: string | null
          target_band_mode:
            | Database["public"]["Enums"]["target_band_mode"]
            | null
          updated_at: string | null
        }
        Insert: {
          adjacency_matrix?: Json | null
          created_at?: string | null
          decision_sla_hours?: number | null
          default_reach_factor?: number | null
          id?: string
          inactivity_days?: number | null
          preview_cache_days?: number | null
          proof_sla_hours?: number | null
          size_tier_thresholds?: Json | null
          slack_channel?: string | null
          slack_enabled?: boolean | null
          slack_webhook?: string | null
          target_band_mode?:
            | Database["public"]["Enums"]["target_band_mode"]
            | null
          updated_at?: string | null
        }
        Update: {
          adjacency_matrix?: Json | null
          created_at?: string | null
          decision_sla_hours?: number | null
          default_reach_factor?: number | null
          id?: string
          inactivity_days?: number | null
          preview_cache_days?: number | null
          proof_sla_hours?: number | null
          size_tier_thresholds?: Json | null
          slack_channel?: string | null
          slack_enabled?: boolean | null
          slack_webhook?: string | null
          target_band_mode?:
            | Database["public"]["Enums"]["target_band_mode"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subgenres: {
        Row: {
          active: boolean | null
          created_at: string | null
          family_id: string
          id: string
          name: string
          order_index: number | null
          patterns: string[] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          family_id: string
          id?: string
          name: string
          order_index?: number | null
          patterns?: string[] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          family_id?: string
          id?: string
          name?: string
          order_index?: number | null
          patterns?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subgenres_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "genre_families"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          artist_name: string | null
          created_at: string | null
          expected_reach_max: number | null
          expected_reach_min: number | null
          expected_reach_planned: number | null
          family: string | null
          id: string
          member_id: string
          need_live_link: boolean | null
          notes: string | null
          owner_id: string | null
          qa_flag: boolean | null
          qa_reason: string | null
          resend_message_ids: string[] | null
          status: Database["public"]["Enums"]["submission_status"] | null
          subgenres: string[] | null
          submitted_at: string | null
          suggested_supporters: string[] | null
          support_date: string | null
          support_url: string | null
          track_url: string
          updated_at: string | null
        }
        Insert: {
          artist_name?: string | null
          created_at?: string | null
          expected_reach_max?: number | null
          expected_reach_min?: number | null
          expected_reach_planned?: number | null
          family?: string | null
          id?: string
          member_id: string
          need_live_link?: boolean | null
          notes?: string | null
          owner_id?: string | null
          qa_flag?: boolean | null
          qa_reason?: string | null
          resend_message_ids?: string[] | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          subgenres?: string[] | null
          submitted_at?: string | null
          suggested_supporters?: string[] | null
          support_date?: string | null
          support_url?: string | null
          track_url: string
          updated_at?: string | null
        }
        Update: {
          artist_name?: string | null
          created_at?: string | null
          expected_reach_max?: number | null
          expected_reach_min?: number | null
          expected_reach_planned?: number | null
          family?: string | null
          id?: string
          member_id?: string
          need_live_link?: boolean | null
          notes?: string | null
          owner_id?: string | null
          qa_flag?: boolean | null
          qa_reason?: string | null
          resend_message_ids?: string[] | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          subgenres?: string[] | null
          submitted_at?: string | null
          suggested_supporters?: string[] | null
          support_date?: string | null
          support_url?: string | null
          track_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_is_member: {
        Args: { _user_email: string }
        Returns: boolean
      }
      get_member_for_user: {
        Args: { _user_email: string }
        Returns: {
          emails: string[]
          id: string
          monthly_submission_limit: number
          name: string
          net_credits: number
          primary_email: string
          size_tier: Database["public"]["Enums"]["size_tier"]
          status: Database["public"]["Enums"]["member_status"]
          submissions_this_month: number
        }[]
      }
      get_member_id_for_user: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "member"
      complaint_status: "todo" | "in_progress" | "done"
      inquiry_status: "undecided" | "admitted" | "rejected"
      member_status: "active" | "needs_reconnect"
      notification_type:
        | "info"
        | "success"
        | "warning"
        | "error"
        | "submission"
        | "inquiry"
        | "queue"
        | "support"
      size_tier: "T1" | "T2" | "T3" | "T4"
      submission_status: "new" | "approved" | "rejected" | "pending" | "qa_flag"
      target_band_mode: "balance" | "size"
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
      app_role: ["admin", "moderator", "member"],
      complaint_status: ["todo", "in_progress", "done"],
      inquiry_status: ["undecided", "admitted", "rejected"],
      member_status: ["active", "needs_reconnect"],
      notification_type: [
        "info",
        "success",
        "warning",
        "error",
        "submission",
        "inquiry",
        "queue",
        "support",
      ],
      size_tier: ["T1", "T2", "T3", "T4"],
      submission_status: ["new", "approved", "rejected", "pending", "qa_flag"],
      target_band_mode: ["balance", "size"],
    },
  },
} as const
