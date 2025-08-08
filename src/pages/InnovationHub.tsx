import React from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import InnovationApplicationForm from '@/components/innovation/InnovationApplicationForm';

const InnovationHub = () => {
  return (
    <Layout>
      <PageHeader
        title="Apply for Innovation Hub"
        subtitle="Join NUST's Innovation Hub and turn your ideas into reality"
      />
      
      <div className="container mx-auto px-4 py-8">
        <InnovationApplicationForm />
      </div>
    </Layout>
  );
};

export default InnovationHub;