import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StudentProfile } from '@shared/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

const PLACEHOLDER_URLS = ['https://your-project.supabase.co', 'http://your-project.supabase.co', ''];
const PLACEHOLDER_KEYS = ['your-anon-key', ''];

export function isSupabaseConfigured(): boolean {
  return (
    !PLACEHOLDER_URLS.includes(supabaseUrl) &&
    !PLACEHOLDER_KEYS.includes(supabaseAnonKey) &&
    supabaseUrl.startsWith('http')
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface UserProfileRecord {
  id: string;
  email: string | null;
  full_name: string | null;
  university: string;
  student_category: 'scottish' | 'rest_of_uk' | 'international' | null;
  age_band: 'under_22' | '22_or_over' | null;
  move_in_date: string | null;
  course_name: string | null;
  year_of_study: number | null;
  phone: string | null;
  student_profile: StudentProfile | null;
  created_at: string;
  updated_at: string;
}

export interface SavedPlanRecord {
  id: string;
  user_id: string;
  candidate_id: string;
  residence_name: string;
  room_type: string;
  transport_mode: string;
  monthly_total_gbp: number | null;
  upfront_total_gbp: number | null;
  commute_duration_min: number | null;
  overall_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLogRecord {
  id: string;
  user_id: string;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
