import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import StatsSection from '@/components/home/StatsSection';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      
      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Booking a resource at the Software Development Centre is quick and easy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-university-blue h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Select Resource</h3>
              <p className="text-gray-600">
                Choose from computer labs, study rooms, or specialized equipment.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-university-blue h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Date & Time</h3>
              <p className="text-gray-600">
                Select your preferred date and available time slot.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-university-blue h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Confirm & Use</h3>
              <p className="text-gray-600">
                Receive confirmation and access your booking at the scheduled time.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/bookings">
              <Button className="bg-university-blue hover:bg-university-blue/90">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <StatsSection />
      
      {/* Recent Updates Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recent Updates</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay informed about the latest news and updates at the Software Development Centre.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Link to="/blog/1" className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="New Equipment" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">New Equipment Installed</h3>
                <p className="text-gray-600 mb-4">
                  The SDC has received 50 new high-performance workstations for student use.
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    June 15, 2023
                  </span>
                </div>
              </div>
            </Link>
            
            <Link to="/blog/2" className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Workshop" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Upcoming Workshops</h3>
                <p className="text-gray-600 mb-4">
                  Join our series of workshops on web development and AI fundamentals.
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    July 3, 2023
                  </span>
                </div>
              </div>
            </Link>
            
            <Link to="/blog/3" className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1551818014-7c9e6a1e8424?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1473&q=80" 
                alt="Extended Hours" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Extended Opening Hours</h3>
                <p className="text-gray-600 mb-4">
                  The SDC will now be open until 10 PM during exam periods for student convenience.
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    August 20, 2023
                  </span>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="text-center mt-8">
            <Link to="/blog">
              <Button variant="outline" className="border-university-blue text-university-blue hover:bg-university-blue/10">
                Read All Updates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
