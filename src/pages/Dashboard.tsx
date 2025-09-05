
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, LogOut, Search, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import UserDocumentManager from '@/components/projects/UserDocumentManager';

interface Booking {
  id: string;
  resource: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  purpose: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in-use' | 'maintenance';
  capacity?: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBookings, setShowBookings] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  // Fetch user bookings using React Query with the fixed foreign key relationship
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching bookings for user:', user.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          time_slot,
          status,
          purpose,
          rooms!fk_bookings_room(
            id,
            name,
            type,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching bookings:', error);
        throw new Error(error.message);
      }
      
      console.log('Fetched bookings:', data);
      
      // Transform data to match the Booking interface
      return data.map((booking: any) => ({
        id: booking.id,
        resource: booking.rooms?.name || 'Unknown Room',
        date: new Date(booking.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: booking.time_slot,
        status: booking.status,
        purpose: booking.purpose || 'N/A',
      }));
    },
    enabled: !!user,
  });

  // Fetch available resources
  const { data: resources = [], isLoading: isLoadingResources } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      console.log('Fetching resources...');
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*');
        
      if (error) {
        console.error('Error fetching resources:', error);
        throw new Error(error.message);
      }
      
      console.log('Fetched resources:', data);
      
      return data.map((room: any) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        status: room.status,
        capacity: room.capacity,
      }));
    },
  });

  // Filter bookings based on search query and status
  const filteredBookings = bookings.filter(booking =>
    booking.resource.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterStatus === 'all' || booking.status === filterStatus)
  );

  // Filter resources based on search query and status
  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterStatus === 'all' || resource.status === filterStatus)
  );

  if (isLoadingBookings) {
    return (
      <Layout>
        <PageHeader 
          title="Dashboard" 
          subtitle="Loading your dashboard..."
        />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader 
        title="Dashboard" 
        subtitle="Manage your bookings and resources"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Welcome, {user?.email}</h2>
            <p className="text-muted-foreground">Manage your bookings and resources</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter(b => b.status === 'approved').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {bookings.filter(b => b.status === 'pending').length} pending
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.length}
              </div>
              <p className="text-xs text-muted-foreground">
                All time bookings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resources.filter(r => r.status === 'available').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {resources.filter(r => r.type === 'Workstation').length} workstations, {resources.filter(r => r.type === 'Room').length} rooms
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/bookings">
                <Button className="w-full">
                  <Calendar className="h-4 w-4 mr-2" /> New Booking
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowBookings(!showBookings)}
              >
                {showBookings ? 'Hide My Bookings' : 'View My Bookings'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowResources(!showResources)}
              >
                {showResources ? 'Hide Available Resources' : 'View Available Resources'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.length > 0 ? (
                  bookings.slice(0, 2).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.resource}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.date} - {booking.time}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                        booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No recent bookings</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {showBookings && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>My Bookings ({bookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search bookings..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredBookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Purpose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.resource}</TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>{booking.time}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                            booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </TableCell>
                        <TableCell>{booking.purpose}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery || filterStatus !== 'all' ? 'No bookings match your search criteria' : 'No bookings found'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {showResources && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Available Resources ({resources.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search resources..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredResources.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Capacity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>{resource.name}</TableCell>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            resource.status === 'available' ? 'bg-green-100 text-green-800' :
                            resource.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {resource.status}
                          </span>
                        </TableCell>
                        <TableCell>{resource.capacity || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery || filterStatus !== 'all' ? 'No resources match your search criteria' : 'No resources found'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document Management Section - Below Quick Actions and Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Required Document Management
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload and manage your project documents including MOU/MOA, Patent Applications, IDF, and Project Documentation
            </p>
          </CardHeader>
          <CardContent>
            <UserDocumentManager />
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default Dashboard;
