
import React from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MyBookings from '@/components/booking/MyBookings';

const Bookings = () => {
  const { user } = useAuth();
  return (
    <Layout>
      <PageHeader 
        title="Book a Resource" 
        subtitle="Reserve labs, study rooms, and equipment at the Software Development Centre"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-university-blue hover:text-university-blue/80 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <Tabs defaultValue="new-booking" className="w-full mb-8">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="new-booking">New Booking</TabsTrigger>
            <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new-booking">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Select Date, Room and Time</h2>
              <BookingCalendar />
            </div>
          </TabsContent>
          
          <TabsContent value="my-bookings">
            <div className="max-w-4xl mx-auto">
              {user ? (
                <MyBookings />
              ) : (
                <div className="text-center p-8 border rounded-lg bg-gray-50">
                  <h2 className="text-2xl font-bold mb-4">Please Login to View Your Bookings</h2>
                  <p className="text-gray-600 mb-6">
                    You need to be logged in to view and manage your bookings.
                  </p>
                  <Link to="/login">
                    <Button className="bg-university-blue hover:bg-university-blue/90">
                      Login to Continue
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Bookings;
