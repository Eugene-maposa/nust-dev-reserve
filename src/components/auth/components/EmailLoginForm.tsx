import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Loader2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await signIn(email, password);

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      console.log('Login successful for:', data.user.email);

      toast({
        title: "Login successful",
        description: "Welcome to NUST SDC!",
      });

      // Navigate to the intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({
        title: "Registration failed",
        description: "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting registration for:', email);
      
      const { data, error } = await signUp(email, password);

      if (error) {
        throw error;
      }

      toast({
        title: "Registration successful",
        description: "Your account has been created. Please check your email to verify your account.",
      });
      
      // Switch back to login mode
      setRegisterMode(false);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
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

  if (registerMode) {
    return (
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium">Create an Account</h3>
          <p className="text-sm text-gray-500">Enter your details to register</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="register-email"
              type="email"
              placeholder="your@email.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="register-password"
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
          <p className="text-xs text-gray-500">
            Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              className="pl-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              Registering...
            </>
          ) : 'Register'}
        </Button>

        <div className="text-center mt-4">
          <Button
            type="button"
            variant="link"
            className="text-sm"
            onClick={() => setRegisterMode(false)}
          >
            Already have an account? Log in
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

      <div className="text-center mt-4">
        <Button
          type="button"
          variant="link"
          className="text-sm flex items-center justify-center mx-auto"
          onClick={() => setRegisterMode(true)}
        >
          <UserPlus className="mr-1 h-4 w-4" />
          Don't have an account? Register
        </Button>
      </div>
    </form>
  );
};

export default EmailLoginForm;
