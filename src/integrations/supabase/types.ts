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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      contact_messages: {
        Row: {
          archived: boolean
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          subject: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          subject: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          subject?: string
        }
        Relationships: []
      }
      escrow_audit_logs: {
        Row: {
          accepted: boolean
          created_at: string
          id: string
          old_status: string
          payment_id: string | null
          reason: string
          requested_new_status: string
          transaction_id: string
        }
        Insert: {
          accepted: boolean
          created_at?: string
          id?: string
          old_status: string
          payment_id?: string | null
          reason: string
          requested_new_status: string
          transaction_id: string
        }
        Update: {
          accepted?: boolean
          created_at?: string
          id?: string
          old_status?: string
          payment_id?: string | null
          reason?: string
          requested_new_status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_audit_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_applications: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          major: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tools: string | null
          university: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          major: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tools?: string | null
          university: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          major?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tools?: string | null
          university?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          task_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          task_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          escrow_id: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          id: string
          payee_id: string
          payer_id: string
          status: Database["public"]["Enums"]["payment_status"]
          task_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          escrow_id?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          id?: string
          payee_id: string
          payer_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          task_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          escrow_id?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          id?: string
          payee_id?: string
          payer_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"] | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          password_set: boolean
          role: Database["public"]["Enums"]["user_role"]
          tools: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"] | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          password_set?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          tools?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"] | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          password_set?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          tools?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string | null
          comment: string | null
          created_at: string
          freelancer_id: string
          id: string
          rating: number
          task_id: string
        }
        Insert: {
          client_id?: string | null
          comment?: string | null
          created_at?: string
          freelancer_id: string
          id?: string
          rating: number
          task_id: string
        }
        Update: {
          client_id?: string | null
          comment?: string | null
          created_at?: string
          freelancer_id?: string
          id?: string
          rating?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_calls: {
        Row: {
          budget: string
          call_type: string
          company_name: string
          created_at: string
          description: string
          email: string
          full_name: string
          id: string
          phone: string
          timeline: string
          website: string | null
        }
        Insert: {
          budget: string
          call_type: string
          company_name: string
          created_at?: string
          description: string
          email: string
          full_name: string
          id?: string
          phone: string
          timeline: string
          website?: string | null
        }
        Update: {
          budget?: string
          call_type?: string
          company_name?: string
          created_at?: string
          description?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          timeline?: string
          website?: string | null
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          created_at: string
          file_url: string | null
          freelancer_id: string
          id: string
          message: string
          task_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          freelancer_id: string
          id?: string
          message: string
          task_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          freelancer_id?: string
          id?: string
          message?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignment_status: Database["public"]["Enums"]["assignment_status"]
          budget: number
          category: string
          client_id: string
          created_at: string
          deadline: string | null
          description: string
          freelancer_id: string | null
          id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          tools: string | null
          updated_at: string
        }
        Insert: {
          assignment_status?: Database["public"]["Enums"]["assignment_status"]
          budget: number
          category: string
          client_id: string
          created_at?: string
          deadline?: string | null
          description: string
          freelancer_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          tools?: string | null
          updated_at?: string
        }
        Update: {
          assignment_status?: Database["public"]["Enums"]["assignment_status"]
          budget?: number
          category?: string
          client_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          freelancer_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          tools?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      account_status: "active" | "frozen" | "suspended" | "revoked"
      assignment_status:
        | "unassigned"
        | "pending_acceptance"
        | "accepted"
        | "rejected"
      escrow_status:
        | "pending"
        | "created"
        | "funded"
        | "holding"
        | "released"
        | "cancelled"
        | "refunded"
        | "failed"
      payment_status:
        | "pending"
        | "funded"
        | "released"
        | "refunded"
        | "failed"
        | "held"
        | "disputed"
        | "awaiting_escrow"
        | "cancelled"
      task_status:
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "draft"
        | "revision_requested"
      user_role: "business" | "freelancer" | "admin"
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
      account_status: ["active", "frozen", "suspended", "revoked"],
      assignment_status: [
        "unassigned",
        "pending_acceptance",
        "accepted",
        "rejected",
      ],
      escrow_status: [
        "pending",
        "created",
        "funded",
        "holding",
        "released",
        "cancelled",
        "refunded",
        "failed",
      ],
      payment_status: [
        "pending",
        "funded",
        "released",
        "refunded",
        "failed",
        "held",
        "disputed",
        "awaiting_escrow",
        "cancelled",
      ],
      task_status: [
        "open",
        "in_progress",
        "completed",
        "cancelled",
        "draft",
        "revision_requested",
      ],
      user_role: ["business", "freelancer", "admin"],
    },
  },
} as const
