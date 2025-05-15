
import { Database } from '@/integrations/supabase/types';

// User profile from database
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

// Auth user role type
export type UserRole = 'admin' | 'lecturer' | 'student' | 'staff' | 'security';

// Permissions that can be granted to users
export interface UserPermissions {
  canBook?: boolean;
  canManageBookings?: boolean;
  canManageUsers?: boolean;
  canManageResources?: boolean;
  canEditContent?: boolean;
}

// Full user data combining auth and profile data
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  studentNumber?: string | null;
  permissions: UserPermissions;
}
