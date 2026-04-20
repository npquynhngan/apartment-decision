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
      households: {
        Row: { id: string; name: string; invite_code: string; created_at: string }
        Insert: { id?: string; name: string; invite_code?: string; created_at?: string }
        Update: { id?: string; name?: string; invite_code?: string; created_at?: string }
      }
      users: {
        Row: {
          id: string
          email: string
          household_id: string | null
          display_name: string | null
          user_slot: "a" | "b" | null
          home_address: string | null
          work_address: string | null
          home_coords: { lat: number; lng: number } | null
          work_coords: { lat: number; lng: number } | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          household_id?: string | null
          display_name?: string | null
          user_slot?: "a" | "b" | null
          home_address?: string | null
          work_address?: string | null
          home_coords?: { lat: number; lng: number } | null
          work_coords?: { lat: number; lng: number } | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          household_id?: string | null
          display_name?: string | null
          user_slot?: "a" | "b" | null
          home_address?: string | null
          work_address?: string | null
          home_coords?: { lat: number; lng: number } | null
          work_coords?: { lat: number; lng: number } | null
          created_at?: string
        }
      }
      criteria: {
        Row: {
          id: string
          household_id: string
          category: string
          name: string
          weight_a: number
          weight_b: number
          is_dealbreaker: boolean
          position: number
          auto_source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          category: string
          name: string
          weight_a?: number
          weight_b?: number
          is_dealbreaker?: boolean
          position?: number
          auto_source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          category?: string
          name?: string
          weight_a?: number
          weight_b?: number
          is_dealbreaker?: boolean
          position?: number
          auto_source?: string | null
          created_at?: string
        }
      }
      apartments: {
        Row: {
          id: string
          household_id: string
          name: string
          address: string | null
          lat: number | null
          lng: number | null
          rent: number | null
          url: string | null
          notes: string | null
          viewing_at: string | null
          sqft: number | null
          scrape_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          address?: string | null
          lat?: number | null
          lng?: number | null
          rent?: number | null
          url?: string | null
          notes?: string | null
          viewing_at?: string | null
          sqft?: number | null
          scrape_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          address?: string | null
          lat?: number | null
          lng?: number | null
          rent?: number | null
          url?: string | null
          notes?: string | null
          viewing_at?: string | null
          sqft?: number | null
          scrape_data?: Json | null
          created_at?: string
        }
      }
      scores: {
        Row: {
          apartment_id: string
          criterion_id: string
          user_slot: "a" | "b"
          value: number
          auto: boolean
          needs_review: boolean
          updated_at: string
        }
        Insert: {
          apartment_id: string
          criterion_id: string
          user_slot: "a" | "b"
          value: number
          auto?: boolean
          needs_review?: boolean
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          criterion_id?: string
          user_slot?: "a" | "b"
          value?: number
          auto?: boolean
          needs_review?: boolean
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          household_id: string
          apartment_id: string | null
          text: string
          due_at: string
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          apartment_id?: string | null
          text: string
          due_at: string
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          apartment_id?: string | null
          text?: string
          due_at?: string
          done?: boolean
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          apartment_id: string
          url: string
          analysis: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          apartment_id: string
          url: string
          analysis?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          url?: string
          analysis?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      apartment_scores: {
        Row: {
          apartment_id: string
          household_id: string
          score_a: number | null
          score_b: number | null
          combined_score: number | null
          dealbreaker_failed: boolean
          effective_score: number | null
        }
      }
    }
    Functions: {
      current_household_id: { Args: Record<never, never>; Returns: string | null }
      generate_invite_code: { Args: Record<never, never>; Returns: string }
      create_household: { Args: { p_name: string; p_slot: string }; Returns: string }
      join_household: { Args: { p_invite_code: string; p_slot: string }; Returns: string }
    }
  }
}

// Convenience row types
export type Household = Database["public"]["Tables"]["households"]["Row"]
export type UserProfile = Database["public"]["Tables"]["users"]["Row"]
export type Criterion = Database["public"]["Tables"]["criteria"]["Row"]
export type Apartment = Database["public"]["Tables"]["apartments"]["Row"]
export type Score = Database["public"]["Tables"]["scores"]["Row"]
export type Reminder = Database["public"]["Tables"]["reminders"]["Row"]
export type Photo = Database["public"]["Tables"]["photos"]["Row"]
export type ApartmentScore = Database["public"]["Views"]["apartment_scores"]["Row"]
