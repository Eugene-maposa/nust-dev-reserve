
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Import components
import EmailLoginForm from '@/components/auth/components/EmailLoginForm';
import CardScannerForm from '@/components/auth/components/CardScannerForm';

const LoginForm = () => {
  return (
    <div className="w-full max-w-md mx-auto">      
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="email">Email Login</TabsTrigger>
          <TabsTrigger value="card">Card Scanner</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <EmailLoginForm />
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
