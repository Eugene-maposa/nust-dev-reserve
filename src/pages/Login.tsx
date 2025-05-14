
import React from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent } from '@/components/ui/card';

const Login = () => {
  return (
    <Layout>
      <PageHeader 
        title="Account Access" 
        subtitle="Login to your existing account or register for a new one"
      />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
