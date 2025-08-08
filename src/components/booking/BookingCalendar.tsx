import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { addDays, format, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BookingDetailsForm from './BookingDetailsForm';

// Time slots available for booking
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    slots.push(`${hour}:00 - ${hour + 1}:00`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

interface Room {
  id: string;
  name: string;
  capacity: number;
  type: string;
  status: string;
  description?: string;
}

interface Booking {
  id: string;
  date: string;
  time_slot: string;
  room_id: string;
  status: string;
}

const BookingCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoomsAndBookings();
  }, []);

  const fetchRoomsAndBookings = async () => {
    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available');

      if (roomsError) throw roomsError;

      // Fetch existing bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, date, time_slot, room_id, status')
        .in('status', ['confirmed', 'pending']);

      if (bookingsError) throw bookingsError;

      setRooms(roomsData || []);
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms and bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isTimeSlotAvailable = (date: Date, roomId: string, slot: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return !bookings.some(booking => 
      booking.date === dateString && 
      booking.room_id === roomId && 
      booking.time_slot === slot &&
      ['confirmed', 'pending'].includes(booking.status)
    );
  };

  const getAvailableTimeSlots = (date: Date, roomId: string) => {
    return timeSlots.filter(slot => isTimeSlotAvailable(date, roomId, slot));
  };

  const getBookedTimeSlots = (date: Date, roomId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(booking => 
        booking.date === dateString && 
        booking.room_id === roomId &&
        ['confirmed', 'pending'].includes(booking.status)
      )
      .map(booking => booking.time_slot);
  };

  const handleNext = () => {
    setShowDetailsForm(true);
  };

  const handleBack = () => {
    setShowDetailsForm(false);
  };

  if (showDetailsForm && date && selectedRoom && selectedTimeSlot) {
    const selectedRoomData = rooms.find(r => r.id === selectedRoom);
    return (
      <BookingDetailsForm
        bookingData={{
          date,
          room: selectedRoomData?.name || '',
          roomId: selectedRoom,
          timeSlot: selectedTimeSlot,
        }}
        onBack={handleBack}
        onBookingComplete={fetchRoomsAndBookings}
      />
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <p>Loading available rooms...</p>
        </CardContent>
      </Card>
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
                  {rooms.map((room) => {
                    const availableSlots = date ? getAvailableTimeSlots(date, room.id).length : 0;
                    const totalSlots = timeSlots.length;
                    return (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <span className="font-medium">{room.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({room.type} • Capacity: {room.capacity})
                            </span>
                          </div>
                          <Badge variant={availableSlots > 0 ? "secondary" : "destructive"} className="ml-2">
                            {availableSlots}/{totalSlots} available
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {date && selectedRoom && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Available slots for {format(date, 'MMM d, yyyy')}: 
                    <span className="ml-1 font-bold">
                      {getAvailableTimeSlots(date, selectedRoom).length} of {timeSlots.length}
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            {selectedRoom && (
              <div>
                <h3 className="text-lg font-medium mb-4">Select Time Slot</h3>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => {
                    const isAvailable = date ? isTimeSlotAvailable(date, selectedRoom, slot) : false;
                    
                    return (
                      <Button
                        key={slot}
                        variant={selectedTimeSlot === slot ? "default" : "outline"}
                        className={`justify-start text-sm ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => isAvailable && setSelectedTimeSlot(slot)}
                        disabled={!isAvailable}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{slot}</span>
                          {!isAvailable && (
                            <Badge variant="destructive" className="ml-2 text-xs">Booked</Badge>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
                {date && selectedRoom && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>Available:</strong> {getAvailableTimeSlots(date, selectedRoom).length} slots</p>
                    <p><strong>Booked:</strong> {getBookedTimeSlots(date, selectedRoom).length} slots</p>
                  </div>
                )}
              </div>
            )}
            
            {date && selectedRoom && selectedTimeSlot && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium mb-2">Booking Summary</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Date:</strong> {format(date, 'PPP')}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Room:</strong> {rooms.find(r => r.id === selectedRoom)?.name}
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
