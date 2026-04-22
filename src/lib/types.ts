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
      assets: {
        Row: {
          category: string
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          quantity_available: number
          quantity_total: number
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          quantity_available?: number
          quantity_total?: number
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          quantity_available?: number
          quantity_total?: number
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string
          status: string
          subject: string
          template: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string
          status: string
          subject: string
          template: string
        }
        Update: {
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
          template?: string
        }
        Relationships: []
      }
      home_media: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["home_media_kind"]
          storage_path: string | null
          title: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["home_media_kind"]
          storage_path?: string | null
          title?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["home_media_kind"]
          storage_path?: string | null
          title?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          asset_id: string
          borrowed_at: string
          created_at: string
          expected_return_at: string | null
          followup_email_sent_at: string | null
          id: string
          notes: string | null
          operator_id: string
          quantity: number
          sanction_applied_at: string | null
          sanction_due_at: string | null
          sanction_email_sent_at: string | null
          sanction_push_sent_at: string | null
          status: Database["public"]["Enums"]["loan_status"]
          user_id: string
          warning_due_at: string | null
          warning_email_sent_at: string | null
          warning_push_sent_at: string | null
        }
        Insert: {
          asset_id: string
          borrowed_at?: string
          created_at?: string
          expected_return_at?: string | null
          followup_email_sent_at?: string | null
          id?: string
          notes?: string | null
          operator_id: string
          quantity?: number
          sanction_applied_at?: string | null
          sanction_due_at?: string | null
          sanction_email_sent_at?: string | null
          sanction_push_sent_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          user_id: string
          warning_due_at?: string | null
          warning_email_sent_at?: string | null
          warning_push_sent_at?: string | null
        }
        Update: {
          asset_id?: string
          borrowed_at?: string
          created_at?: string
          expected_return_at?: string | null
          followup_email_sent_at?: string | null
          id?: string
          notes?: string | null
          operator_id?: string
          quantity?: number
          sanction_applied_at?: string | null
          sanction_due_at?: string | null
          sanction_email_sent_at?: string | null
          sanction_push_sent_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          user_id?: string
          warning_due_at?: string | null
          warning_email_sent_at?: string | null
          warning_push_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          career: string | null
          cedula: string
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          email: string
          faculty: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          qr_code: string
          semester: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          career?: string | null
          cedula: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          email: string
          faculty?: string | null
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          qr_code?: string
          semester?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          career?: string | null
          cedula?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          email?: string
          faculty?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          qr_code?: string
          semester?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          condition: string
          created_at: string
          evidence_url: string | null
          id: string
          loan_id: string
          notes: string | null
          operator_id: string
          returned_at: string
        }
        Insert: {
          condition: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          operator_id: string
          returned_at?: string
        }
        Update: {
          condition?: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          operator_id?: string
          returned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sanction_reports: {
        Row: {
          attachment_url: string | null
          created_at: string
          created_by: string
          id: string
          loan_id: string | null
          reason: string
          resolved: boolean
          resolved_at: string | null
          severity: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          loan_id?: string | null
          reason: string
          resolved?: boolean
          resolved_at?: string | null
          severity: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          loan_id?: string | null
          reason?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanction_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanction_reports_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanction_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          type: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          type: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_business_hours: {
        Args: { p_hours: number; p_start: string }
        Returns: string
      }
      check_overdue_loans: { Args: never; Returns: undefined }
      create_loan: {
        Args: {
          p_asset_id: string
          p_notes?: string
          p_operator_id: string
          p_quantity: number
          p_user_id: string
        }
        Returns: string
      }
      get_user_by_qr: {
        Args: { p_qr_code: string }
        Returns: {
          career: string
          cedula: string
          email: string
          faculty: string
          first_name: string
          has_active_loan: boolean
          id: string
          last_name: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_business_datetime: { Args: { p_date: string }; Returns: string }
      register_return: {
        Args: {
          p_condition: string
          p_evidence_url?: string
          p_loan_id: string
          p_notes?: string
          p_operator_id: string
        }
        Returns: string
      }
      reset_password_with_otp: {
        Args: { p_code: string; p_email: string }
        Returns: boolean
      }
      user_has_active_loan: { Args: { p_user_id: string }; Returns: boolean }
      validate_ecuadorian_cedula: {
        Args: { p_cedula: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "user"
      asset_status: "available" | "loaned" | "maintenance" | "retired"
      doc_type: "cedula" | "pasaporte"
      home_media_kind: "image" | "video"
      loan_status: "active" | "returned" | "overdue" | "sanction"
      user_status: "pending" | "active" | "suspended" | "inactive"
      user_type: "estudiante" | "docente" | "administrativo"
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
      app_role: ["admin", "operator", "user"],
      asset_status: ["available", "loaned", "maintenance", "retired"],
      doc_type: ["cedula", "pasaporte"],
      home_media_kind: ["image", "video"],
      loan_status: ["active", "returned", "overdue", "sanction"],
      user_status: ["pending", "active", "suspended", "inactive"],
      user_type: ["estudiante", "docente", "administrativo"],
    },
  },
} as const
