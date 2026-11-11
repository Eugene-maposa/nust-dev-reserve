import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailLoginForm from '@/components/auth/components/EmailLoginForm';
import CardScannerForm from '@/components/auth/components/CardScannerForm';
import RegistrationForm from '@/components/auth/components/RegistrationForm';

const LoginForm = () => {
  const [tab, setTab] = useState('email');
  const [signupCode, setSignupCode] = useState<string | undefined>();
  const [signupKey, setSignupKey] = useState(0);

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="email">Email Login</TabsTrigger>
          <TabsTrigger value="card">Scan ID</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="email"><EmailLoginForm /></TabsContent>
        <TabsContent value="card">
          <CardScannerForm onRegisterWithCode={(c) => { setSignupCode(c); setSignupKey(k => k + 1); setTab('signup'); }} />
        </TabsContent>
        <TabsContent value="signup">
          <RegistrationForm key={signupKey} initialCode={signupCode} onBackToLogin={() => setTab('email')} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoginForm;
