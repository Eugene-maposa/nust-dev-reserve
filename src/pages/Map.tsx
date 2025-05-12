
import React from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import CentreMap from '@/components/map/CentreMap';

const Map = () => {
  return (
    <Layout>
      <PageHeader 
        title="Centre Map" 
        subtitle="Explore the layout of the Software Development Centre"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <CentreMap />
          
          <div className="mt-12 bg-gray-50 border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-university-blue">Facility Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Opening Hours</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span className="font-medium">8:00 AM - 8:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday:</span>
                    <span className="font-medium">9:00 AM - 5:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday:</span>
                    <span className="font-medium">Closed</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Access Information</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Student ID required for entry</li>
                  <li>Access to labs requires booking confirmation</li>
                  <li>Restricted areas require staff authorization</li>
                  <li>24/7 access available for approved research projects</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Map;
