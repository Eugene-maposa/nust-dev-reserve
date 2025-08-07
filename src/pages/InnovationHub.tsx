import React from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';

const InnovationHub = () => {
  return (
    <Layout>
      <PageHeader
        title="Apply for Innovation Hub"
        subtitle="Join NUST's Innovation Hub and turn your ideas into reality"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Innovation Hub Application</h2>
            <p className="text-muted-foreground">
              Fill out the form below to apply for access to NUST's Innovation Hub. 
              Our team will review your application and get back to you within 5-7 business days.
            </p>
          </div>
          
          <div className="bg-background border rounded-lg overflow-hidden shadow-sm">
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSevU-7nhDxmmIRvmW_MCAc9V-xPMjWfadFlqGJQdiQWQNEFBA/viewform?embedded=true" 
              width="100%" 
              height="2796" 
              frameBorder="0" 
              marginHeight={0} 
              marginWidth={0}
              className="w-full"
              title="Innovation Hub Application Form"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InnovationHub;