
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Import components
import EmailLoginForm from '@/components/auth/components/EmailLoginForm';
import CardScannerForm from '@/components/auth/components/CardScannerForm';
import DevModeNotice from '@/components/auth/components/DevModeNotice';
import AutoLoginLoader from '@/components/auth/components/AutoLoginLoader';

// Import configuration
import { DEV_MODE, DEV_AUTO_LOGIN, DEV_USER_ROLE, users } from '@/components/auth/config/constants';

const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auto-login for development mode
  useEffect(() => {
    if (DEV_MODE && DEV_AUTO_LOGIN) {
      const autoLogin = async () => {
        const userToLogin = DEV_USER_ROLE === 'admin' ? users[0] : users[1];
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify({
          email: userToLogin.email,
          role: userToLogin.role,
          permissions: userToLogin.permissions
        }));

        toast({
          title: "Development Mode",
          description: `Auto-logged in as ${userToLogin.role}`,
        });

        // Navigate based on role
        if (userToLogin.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      };
      
      autoLogin();
    }
  }, [navigate, toast]);

  // Skip rendering the login form if auto-login is enabled
  if (DEV_MODE && DEV_AUTO_LOGIN) {
    return <AutoLoginLoader userRole={DEV_USER_ROLE} />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {DEV_MODE && <DevModeNotice users={users} />}
      
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="email">Email Login</TabsTrigger>
          <TabsTrigger value="card">Card Scanner</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <EmailLoginForm users={users} />
        </TabsContent>
        
        <TabsContent value="card">
          <CardScannerForm />
        </TabsContent>
      </Tabs>
      
      <Separator className="my-6" />
      
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don't have an account? Please contact the SDC administrator.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
