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
      blog_authors: {
        Row: {
          avatar_initials: string
          bio: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_initials: string
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_initials?: string
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt: string
          id?: string
          image_url: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_blog_posts_author_id"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          date: string
          id: string
          purpose: string | null
          room_id: string
          status: string
          time_slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          purpose?: string | null
          room_id: string
          status?: string
          time_slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          purpose?: string | null
          room_id?: string
          status?: string
          time_slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bookings_rooms"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_hub_applications: {
        Row: {
          abstract: string | null
          admin_notes: string | null
          aim: string | null
          approved_by: string | null
          created_at: string
          department: string | null
          designer_signature: string | null
          email: string
          estimated_budget: string | null
          expected_duration: string | null
          expected_results: string | null
          faculty: string | null
          full_description: string | null
          full_name: string
          id: string
          incubation_requirements: string | null
          novelty_of_invention: string | null
          organisation: string | null
          other_requirements: string | null
          phone: string | null
          position: string | null
          problem_statement: string | null
          project_description: string
          project_strategy: string | null
          project_title: string
          proposed_funding: string | null
          rationale: string | null
          received_by: string | null
          received_date: string | null
          resources_needed: string | null
          signature_date: string | null
          stage_of_invention: string | null
          status: string
          student_number: string | null
          supervisor: string | null
          team_members: string | null
          team_members_required: string | null
          title: string | null
          trl_level: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abstract?: string | null
          admin_notes?: string | null
          aim?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          designer_signature?: string | null
          email: string
          estimated_budget?: string | null
          expected_duration?: string | null
          expected_results?: string | null
          faculty?: string | null
          full_description?: string | null
          full_name: string
          id?: string
          incubation_requirements?: string | null
          novelty_of_invention?: string | null
          organisation?: string | null
          other_requirements?: string | null
          phone?: string | null
          position?: string | null
          problem_statement?: string | null
          project_description: string
          project_strategy?: string | null
          project_title: string
          proposed_funding?: string | null
          rationale?: string | null
          received_by?: string | null
          received_date?: string | null
          resources_needed?: string | null
          signature_date?: string | null
          stage_of_invention?: string | null
          status?: string
          student_number?: string | null
          supervisor?: string | null
          team_members?: string | null
          team_members_required?: string | null
          title?: string | null
          trl_level?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abstract?: string | null
          admin_notes?: string | null
          aim?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          designer_signature?: string | null
          email?: string
          estimated_budget?: string | null
          expected_duration?: string | null
          expected_results?: string | null
          faculty?: string | null
          full_description?: string | null
          full_name?: string
          id?: string
          incubation_requirements?: string | null
          novelty_of_invention?: string | null
          organisation?: string | null
          other_requirements?: string | null
          phone?: string | null
          position?: string | null
          problem_statement?: string | null
          project_description?: string
          project_strategy?: string | null
          project_title?: string
          proposed_funding?: string | null
          rationale?: string | null
          received_by?: string | null
          received_date?: string | null
          resources_needed?: string | null
          signature_date?: string | null
          stage_of_invention?: string | null
          status?: string
          student_number?: string | null
          supervisor?: string | null
          team_members?: string | null
          team_members_required?: string | null
          title?: string | null
          trl_level?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          updated_at: string | null
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          updated_at?: string | null
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string | null
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          admin_comments: string | null
          comment_updated_at: string | null
          commented_by: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          project_id: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          admin_comments?: string | null
          comment_updated_at?: string | null
          commented_by?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          project_id: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          admin_comments?: string | null
          comment_updated_at?: string | null
          commented_by?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          project_id?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string
          notification_type: string
          project_id: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          message: string
          notification_type: string
          project_id: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          project_id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          evidence_url: string | null
          id: string
          is_completed: boolean
          notes: string | null
          project_id: string
          stage_name: string
          trl_level: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          project_id: string
          stage_name: string
          trl_level: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          project_id?: string
          stage_name?: string
          trl_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_stages_projects"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          award_category: string | null
          budget_cost: number | null
          category: string
          completed_stages: Json
          created_at: string
          current_trl_level: number
          department: string | null
          description: string | null
          expected_completion_date: string | null
          id: string
          idf_document_url: string | null
          impact_level: string
          mou_moa_document_url: string | null
          patent_application_url: string | null
          start_date: string
          status: string
          supervisor: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          award_category?: string | null
          budget_cost?: number | null
          category?: string
          completed_stages?: Json
          created_at?: string
          current_trl_level?: number
          department?: string | null
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          idf_document_url?: string | null
          impact_level?: string
          mou_moa_document_url?: string | null
          patent_application_url?: string | null
          start_date?: string
          status?: string
          supervisor?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          award_category?: string | null
          budget_cost?: number | null
          category?: string
          completed_stages?: Json
          created_at?: string
          current_trl_level?: number
          department?: string | null
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          idf_document_url?: string | null
          impact_level?: string
          mou_moa_document_url?: string | null
          patent_application_url?: string | null
          start_date?: string
          status?: string
          supervisor?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          description: string | null
          floor: number
          id: string
          name: string
          status: string
          type: string
        }
        Insert: {
          capacity?: number | null
          description?: string | null
          floor?: number
          id?: string
          name: string
          status?: string
          type: string
        }
        Update: {
          capacity?: number | null
          description?: string | null
          floor?: number
          id?: string
          name?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          code: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          permissions: Json | null
          phone: string | null
          role: string
          student_number: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          student_number?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          student_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_password_requirements: {
        Args: { password: string }
        Returns: boolean
      }
      check_user_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
      }
      generate_password_reset_token: {
        Args: { user_email: string }
        Returns: string
      }
      generate_project_code: {
        Args: { project_year: number; user_department: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      reset_admin_password: {
        Args: { admin_email?: string; new_password?: string }
        Returns: undefined
      }
      update_password_with_validation: {
        Args: { new_password: string; user_email: string }
        Returns: boolean
      }
      update_user_password: {
        Args: { new_password: string; user_email: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { p_new_role: string; p_permissions?: Json; p_user_id: string }
        Returns: undefined
      }
      validate_password_reset_token: {
        Args: { p_new_password: string; p_token: string }
        Returns: boolean
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
