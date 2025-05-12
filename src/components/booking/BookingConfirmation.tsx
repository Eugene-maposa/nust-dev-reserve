
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react';

interface BookingConfirmationProps {
  bookingData: {
    date: Date;
    room: string;
    timeSlot: string;
    fullName: string;
    studentNumber: string;
    email: string;
    phone?: string;
    purpose?: string;
  };
  onBack: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ bookingData, onBack }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600">
            Your booking has been successfully confirmed. A confirmation email has been sent to {bookingData.email}.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="font-semibold mb-4">Booking Details</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 mr-3 mt-0.5 text-university-blue" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-gray-600">{bookingData.date.toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="h-5 w-5 mr-3 mt-0.5 text-university-blue" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-gray-600">{bookingData.timeSlot}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPin className="h-5 w-5 mr-3 mt-0.5 text-university-blue" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-gray-600">{bookingData.room}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bookings
          </Button>
          
          <Link to="/" className="block">
            <Button className="w-full bg-university-blue hover:bg-university-blue/90">
              Return to Home
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingConfirmation;
