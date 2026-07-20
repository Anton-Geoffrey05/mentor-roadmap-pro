// Minimal hand-written Supabase types for the tables this slice touches.
// Once the CLI is linked to your project, replace this file with the
// generated output of: supabase gen types typescript --linked
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          clerk_user_id: string
          email: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      roadmaps: {
        Row: {
          id: string
          profile_id: string
          career_goal_id: string
          title: string
          summary: string | null
          estimated_weeks: number
          readiness_score: number
          ai_model: string
          cache_key: string
          raw_response: Record<string, unknown>
          status: 'active' | 'completed' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['roadmaps']['Row']>
        Update: Partial<Database['public']['Tables']['roadmaps']['Row']>
      }
    }
  }
}
