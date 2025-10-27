
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  userRole: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST (to prevent missing auth events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Don't fetch profile in the callback to prevent deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          // Clear role when signing out
          setUserRole(null);
          setIsAdmin(false);
        }
        
        // Show toast notifications for auth events
        if (event === 'SIGNED_IN') {
          toast({
            title: 'Signed in successfully',
            description: 'Welcome back!',
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: 'Signed out successfully',
            description: 'You have been logged out.',
          });
        }
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Initial session check:', currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch user profile if logged in
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // Fetch user roles to determine permissions
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching roles for user:', userId);
      
      // Fetch user roles from the new user_roles table
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        // Set default role if we can't fetch the roles
        setUserRole('student');
        setIsAdmin(false);
        return;
      }

      if (roles && roles.length > 0) {
        console.log('Roles fetched successfully:', roles);
        // Check if user has admin role
        const hasAdminRole = roles.some(r => r.role === 'admin');
        setIsAdmin(hasAdminRole);
        // Set primary role (admin takes precedence)
        setUserRole(hasAdminRole ? 'admin' : roles[0].role);
      } else {
        console.log('No roles found, setting default role');
        // No roles exist yet, set default role
        setUserRole('student');
        setIsAdmin(false);
      }
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Fallback to default role
      setUserRole('student');
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log('Sign in result:', result);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error, data: null };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      console.log('Sign up result:', result);
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error, data: null };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    
    navigate('/login');
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
