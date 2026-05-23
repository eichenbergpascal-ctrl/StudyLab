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
      attempts: {
        Row: {
          created_at: string
          exam_question_id: string | null
          flashcard_id: string | null
          id: string
          is_correct: boolean
          session_type: Database["public"]["Enums"]["session_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_question_id?: string | null
          flashcard_id?: string | null
          id?: string
          is_correct: boolean
          session_type: Database["public"]["Enums"]["session_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          exam_question_id?: string | null
          flashcard_id?: string | null
          id?: string
          is_correct?: boolean
          session_type?: Database["public"]["Enums"]["session_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_exam_question_id_fkey"
            columns: ["exam_question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          name: string
          weight_percent: number
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          name: string
          weight_percent: number
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          name?: string
          weight_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "blocks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          answer_data: Json
          created_at: string
          id: string
          is_user_created: boolean
          question_data: Json
          question_type: Database["public"]["Enums"]["question_type"]
          section_id: string
        }
        Insert: {
          answer_data: Json
          created_at?: string
          id?: string
          is_user_created?: boolean
          question_data: Json
          question_type: Database["public"]["Enums"]["question_type"]
          section_id: string
        }
        Update: {
          answer_data?: Json
          created_at?: string
          id?: string
          is_user_created?: boolean
          question_data?: Json
          question_type?: Database["public"]["Enums"]["question_type"]
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          answers: Json
          block_id: string | null
          completed_at: string | null
          created_at: string
          exam_id: string
          id: string
          question_ids: Json
          status: Database["public"]["Enums"]["exam_session_status"]
          user_id: string
        }
        Insert: {
          answers?: Json
          block_id?: string | null
          completed_at?: string | null
          created_at?: string
          exam_id: string
          id?: string
          question_ids?: Json
          status?: Database["public"]["Enums"]["exam_session_status"]
          user_id: string
        }
        Update: {
          answers?: Json
          block_id?: string | null
          completed_at?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          question_ids?: Json
          status?: Database["public"]["Enums"]["exam_session_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          exam_date: string | null
          id: string
          name: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          id?: string
          name: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          id?: string
          name?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_user_created: boolean
          question: string
          section_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_user_created?: boolean
          question: string
          section_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_user_created?: boolean
          question?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          content_text: string
          created_at: string
          id: string
          sort_order: number
          summary_id: string
          title: string
        }
        Insert: {
          content_text: string
          created_at?: string
          id?: string
          sort_order: number
          summary_id: string
          title: string
        }
        Update: {
          content_text?: string
          created_at?: string
          id?: string
          sort_order?: number
          summary_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          block_id: string
          created_at: string
          filename: string
          id: string
          parsed_content: Json | null
          processing_error: string | null
          processing_status: Database["public"]["Enums"]["processing_status"]
          sections_processed: number
          sections_total: number | null
          storage_path: string
        }
        Insert: {
          block_id: string
          created_at?: string
          filename: string
          id?: string
          parsed_content?: Json | null
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          sections_processed?: number
          sections_total?: number | null
          storage_path: string
        }
        Update: {
          block_id?: string
          created_at?: string
          filename?: string
          id?: string
          parsed_content?: Json | null
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          sections_processed?: number
          sections_total?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      error_pool: {
        Row: {
          created_at: string | null
          exam_question_id: string | null
          flashcard_id: string | null
          id: string | null
          is_correct: boolean | null
          session_type: Database["public"]["Enums"]["session_type"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempts_exam_question_id_fkey"
            columns: ["exam_question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      exam_session_status: "in_progress" | "completed" | "abandoned"
      processing_status:
        | "pending"
        | "parsing"
        | "generating"
        | "completed"
        | "failed"
      question_type: "mc" | "fill_blank" | "matching" | "free_text"
      session_type: "flashcard" | "exam" | "error_session"
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
      exam_session_status: ["in_progress", "completed", "abandoned"],
      processing_status: [
        "pending",
        "parsing",
        "generating",
        "completed",
        "failed",
      ],
      question_type: ["mc", "fill_blank", "matching", "free_text"],
      session_type: ["flashcard", "exam", "error_session"],
    },
  },
} as const
