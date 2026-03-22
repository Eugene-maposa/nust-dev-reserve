import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Loader2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import RegistrationForm from './RegistrationForm';

const EmailLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. If you just registered, please verify your email first.');
        } else if (error.message?.includes('Email not confirmed')) {
          throw new Error('Please verify your email before logging in.');
        }
        throw error;
      }

      if (!data.user) throw new Error('No user data returned');

      toast({ title: "Login successful", description: "Welcome to NUST SDC!" });
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({ title: "Login failed", description: error.message || "Invalid email or password", variant: "destructive", duration: 10000 });
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

      toast({ title: "Password reset link sent", description: "Please check your email for the password reset link" });
      setResetPasswordMode(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send password reset link", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (resetPasswordMode) {
    return (
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium">Reset Password</h3>
          <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="reset-email" type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending link...</> : 'Send Reset Link'}
        </Button>

        <div className="text-center mt-4">
          <Button type="button" variant="link" className="text-sm" onClick={() => setResetPasswordMode(false)}>Back to login</Button>
        </div>
      </form>
    );
  }

  if (registerMode) {
    return <RegistrationForm onBackToLogin={() => setRegisterMode(false)} />;
  }

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="email" type="email" placeholder="university@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="password">Password</Label>
          <Button type="button" variant="link" className="text-sm text-primary hover:text-primary/80 p-0 h-auto" onClick={() => setResetPasswordMode(true)}>Forgot password?</Button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="password" type={showPassword ? "text" : "password"} className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : 'Login'}
      </Button>

      <div className="text-center mt-4">
        <Button type="button" variant="link" className="text-sm flex items-center justify-center mx-auto" onClick={() => setRegisterMode(true)}>
          <UserPlus className="mr-1 h-4 w-4" />
          Don't have an account? Register
        </Button>
      </div>
    </form>
  );
};

export default EmailLoginForm;
