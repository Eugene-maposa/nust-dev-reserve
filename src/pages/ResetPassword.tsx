
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/ui/PageHeader';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Password validation state
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false
  });

  // Validate password on change
  useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0
    });
  }, [password, confirmPassword]);

  const allValidationsPassed = Object.values(validations).every(Boolean);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allValidationsPassed) {
      toast({
        title: "Validation failed",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      setResetSuccess(true);
      toast({
        title: "Password updated successfully",
        description: "Your password has been reset. You can now log in with your new password.",
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Password reset failed",
        description: error.message || "An error occurred during password reset",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader 
        title="Reset Your Password" 
        subtitle="Create a new secure password for your account"
      />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            {resetSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Password Reset Complete!</h2>
                <p className="text-gray-600 mb-6">Your password has been updated successfully.</p>
                <p className="text-sm text-gray-500">Redirecting to login page...</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium mb-2">Password requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={`flex items-center ${validations.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {validations.minLength ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={`flex items-center ${validations.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {validations.hasUpperCase ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={`flex items-center ${validations.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {validations.hasLowerCase ? '✓' : '○'} One lowercase letter
                    </li>
                    <li className={`flex items-center ${validations.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {validations.hasNumber ? '✓' : '○'} One number
                    </li>
                    <li className={`flex items-center ${validations.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                      {validations.hasSpecial ? '✓' : '○'} One special character
                    </li>
                    <li className={`flex items-center ${validations.passwordsMatch ? 'text-green-600' : 'text-gray-500'}`}>
                      {validations.passwordsMatch ? '✓' : '○'} Passwords match
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 bg-university-blue hover:bg-university-blue/90"
                  disabled={isLoading || !allValidationsPassed}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : 'Reset Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPassword;
