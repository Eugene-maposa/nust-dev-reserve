
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <PageHeader
        title="Unauthorized Access"
        subtitle="You don't have permission to access this resource"
      />
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="mx-auto h-16 w-16 text-university-blue mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">
            Sorry, you don't have permission to access this page. Please contact the IBD office
            if you believe this is an error.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-university-blue hover:bg-university-blue/90"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Unauthorized;
