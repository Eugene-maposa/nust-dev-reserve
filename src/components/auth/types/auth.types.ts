
import { Database } from '@/integrations/supabase/types';

// User profile from database (simplified without roles)
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

// Full user data combining auth and profile data (simplified)
export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  studentNumber?: string | null;
}
