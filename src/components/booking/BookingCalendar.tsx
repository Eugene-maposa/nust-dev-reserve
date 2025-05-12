import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { addDays, format, isSameDay } from 'date-fns';
import BookingDetailsForm from './BookingDetailsForm';

// Mock data for available rooms
const rooms = [
  { id: 1, name: 'Computer Lab A', capacity: 30 },
  { id: 2, name: 'Computer Lab B', capacity: 25 },
  { id: 3, name: 'Computer Lab C', capacity: 20 },
  { id: 4, name: 'Study Room 1', capacity: 10 },
  { id: 5, name: 'Study Room 2', capacity: 8 },
  { id: 6, name: 'Conference Room', capacity: 15 }
];

// Mock data for time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    slots.push(`${hour}:00 - ${hour + 1}:00`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Mock data for bookings (to show some time slots as unavailable)
const mockBookings = [
  { date: new Date(), room: 1, slot: '10:00 - 11:00' },
  { date: new Date(), room: 2, slot: '14:00 - 15:00' },
  { date: addDays(new Date(), 1), room: 1, slot: '9:00 - 10:00' },
];

const BookingCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  const isTimeSlotAvailable = (date: Date, roomId: number, slot: string) => {
    return !mockBookings.some(booking => 
      isSameDay(booking.date, date) && 
      booking.room === roomId && 
      booking.slot === slot
    );
  };

  const handleNext = () => {
    setShowDetailsForm(true);
  };

  const handleBack = () => {
    setShowDetailsForm(false);
  };

  if (showDetailsForm && date && selectedRoom && selectedTimeSlot) {
    return (
      <BookingDetailsForm
        bookingData={{
          date,
          room: rooms.find(r => r.id.toString() === selectedRoom)?.name || '',
          timeSlot: selectedTimeSlot,
        }}
        onBack={handleBack}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Select Date</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(date) => {
                // Disable past dates and weekends for this example
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return (
                  date < today ||
                  date.getDay() === 0 || // Sunday
                  date.getDay() === 6    // Saturday
                );
              }}
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Select Room</h3>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name} (Capacity: {room.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRoom && (
              <div>
                <h3 className="text-lg font-medium mb-4">Select Time Slot</h3>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => {
                    const roomId = parseInt(selectedRoom);
                    const isAvailable = date ? isTimeSlotAvailable(date, roomId, slot) : false;
                    
                    return (
                      <Button
                        key={slot}
                        variant={selectedTimeSlot === slot ? "default" : "outline"}
                        className={`justify-start ${!isAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                        onClick={() => isAvailable && setSelectedTimeSlot(slot)}
                        disabled={!isAvailable}
                      >
                        {slot}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {date && selectedRoom && selectedTimeSlot && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium mb-2">Booking Summary</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Date:</strong> {format(date, 'PPP')}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Room:</strong> {rooms.find(r => r.id.toString() === selectedRoom)?.name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Time:</strong> {selectedTimeSlot}
                </p>
                <Button 
                  className="w-full bg-university-blue hover:bg-university-blue/90"
                  onClick={handleNext}
                >
                  Proceed to Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCalendar;
