
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailLoginFormProps {
  users?: Array<{
    email: string;
    password: string;
    role: string;
    permissions: {
      canBook: boolean;
      canManageBookings: boolean;
      canManageUsers: boolean;
      canManageResources: boolean;
    };
  }>;
}

const EmailLoginForm: React.FC<EmailLoginFormProps> = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Get user profile info from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, permissions')
        .eq('id', data.user?.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        email: data.user.email,
        role: profileData.role,
        permissions: profileData.permissions
      }));

      toast({
        title: "Login successful",
        description: profileData.role === 'admin' 
          ? "Welcome to NUST SDC Admin Dashboard"
          : "Welcome to NUST SDC Booking System",
      });

      // Navigate based on role
      if (profileData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset link sent",
        description: "Please check your email for the password reset link",
      });
      
      setResetPasswordMode(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (resetPasswordMode) {
    return (
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium">Reset Password</h3>
          <p className="text-sm text-gray-500">Enter your email to receive a reset link</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="reset-email"
              type="email"
              placeholder="your@email.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-university-blue hover:bg-university-blue/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending link...
            </>
          ) : 'Send Reset Link'}
        </Button>

        <div className="text-center mt-4">
          <Button
            type="button"
            variant="link"
            className="text-sm"
            onClick={() => setResetPasswordMode(false)}
          >
            Back to login
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="university@email.com"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="password">Password</Label>
          <Button 
            type="button"
            variant="link" 
            className="text-sm text-university-blue hover:text-university-blue/80 p-0 h-auto"
            onClick={() => setResetPasswordMode(true)}
          >
            Forgot password?
          </Button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full bg-university-blue hover:bg-university-blue/90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : 'Login'}
      </Button>
    </form>
  );
};

export default EmailLoginForm;
