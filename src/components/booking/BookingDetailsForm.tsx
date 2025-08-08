import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import BookingConfirmation from './BookingConfirmation';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  studentNumber: z.string().min(1, 'Student number is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  purpose: z.string().min(10, 'Please provide a brief description of your purpose'),
});

interface BookingDetailsFormProps {
  bookingData: {
    date: Date;
    room: string;
    roomId: string;
    timeSlot: string;
  };
  onBack: () => void;
  onBookingComplete?: () => void;
}

const BookingDetailsForm: React.FC<BookingDetailsFormProps> = ({ bookingData, onBack, onBookingComplete }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      studentNumber: '',
      email: '',
      phone: '',
      purpose: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in to make a booking');
      }

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          room_id: bookingData.roomId,
          date: format(bookingData.date, 'yyyy-MM-dd'),
          time_slot: bookingData.timeSlot,
          purpose: values.purpose,
          status: 'confirmed'
        });

      if (error) throw error;

      setIsConfirmed(true);
      toast({
        title: "Booking Confirmed",
        description: "Your booking has been successfully created!",
      });
      
      // Refresh the bookings data
      onBookingComplete?.();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return (
      <BookingConfirmation
        bookingData={{
          ...bookingData,
          fullName: form.getValues('fullName'),
          studentNumber: form.getValues('studentNumber'),
          email: form.getValues('email'),
          phone: form.getValues('phone'),
          purpose: form.getValues('purpose'),
        }}
        onBack={() => {
          setIsConfirmed(false);
          onBack();
        }}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <h2 className="text-2xl font-bold mb-2">Complete Your Booking</h2>
          <p className="text-gray-600 mb-6">
            Please provide your details to complete the booking process.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Booking Summary</h3>
            <p className="text-sm text-gray-600">
              Date: {bookingData.date.toLocaleDateString()}<br />
              Room: {bookingData.room}<br />
              Time: {bookingData.timeSlot}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your student number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Booking</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe the purpose of your booking"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-university-blue hover:bg-university-blue/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : 'Confirm Booking'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BookingDetailsForm;
