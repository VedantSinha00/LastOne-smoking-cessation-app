export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          username: string | null
          target_quit_date: string | null
          current_stage: number
          daily_baseline_cigarettes: number
          cost_per_pack: number
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          username?: string | null
          target_quit_date?: string | null
          current_stage?: number
          daily_baseline_cigarettes?: number
          cost_per_pack?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          username?: string | null
          target_quit_date?: string | null
          current_stage?: number
          daily_baseline_cigarettes?: number
          cost_per_pack?: number
        }
        Relationships: []
      }
      craving_logs: {
        Row: {
          id: string
          user_id: string
          created_at: string
          intensity: number
          context: string
          triggers: string[] | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          intensity: number
          context: string
          triggers?: string[] | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          intensity?: number
          context?: string
          triggers?: string[] | null
          notes?: string | null
        }
        Relationships: []
      }
      slips: {
        Row: {
          id: string
          user_id: string
          created_at: string
          intensity: number
          context: string
          cigarettes_smoked: number
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          intensity: number
          context: string
          cigarettes_smoked: number
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          intensity?: number
          context?: string
          cigarettes_smoked?: number
          notes?: string | null
        }
        Relationships: []
      }
      coping_usages: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          created_at: string
          craving_intensity: number | null
          craving_context: string | null
          user_stage: number | null
          tool_surface: string
          post_tool_state: string
          time_since_last_use: number | null
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          created_at?: string
          craving_intensity?: number | null
          craving_context?: string | null
          user_stage?: number | null
          tool_surface: string
          post_tool_state: string
          time_since_last_use?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          tool_id?: string
          created_at?: string
          craving_intensity?: number | null
          craving_context?: string | null
          user_stage?: number | null
          tool_surface?: string
          post_tool_state?: string
          time_since_last_use?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
