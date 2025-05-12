
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Calendar, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit,
  UserPlus,
  Settings,
  Bell,
  MoreVertical,
  ChevronDown,
  FileText,
  BarChart,
  Shield,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

// Types
interface User {
  id: string;
  email: string;
  full_name?: string;
  student_number?: string;
  phone?: string;
  role: 'admin' | 'user';
  created_at: string;
  last_sign_in_at?: string;
}

interface UserFormData {
  full_name?: string;
  student_number?: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  password?: string;
  confirmPassword?: string;
}

interface Booking {
  id: string;
  room_name: string;
  user_name: string;
  user_id: string;
  date: string;
  time_slot: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in-use' | 'maintenance';
  capacity?: number;
  description?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isEditResourceOpen, setIsEditResourceOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editedUser, setEditedUser] = useState<UserFormData | null>(null);
  const [editedRoom, setEditedRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('bookings');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'user' | 'room' | 'booking' } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [isBookingRulesOpen, setIsBookingRulesOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Email notification settings
  const [emailSettings, setEmailSettings] = useState({
    bookingConfirmation: true,
    bookingReminder: true,
    bookingCancellation: true,
    systemUpdates: false,
    maintenanceAlerts: true
  });

  // Booking rules settings
  const [bookingRules, setBookingRules] = useState({
    maxDuration: 4, // hours
    minNotice: 1, // hours
    maxAdvance: 14, // days
    allowRecurring: true,
    requireApproval: true
  });

  // Maintenance schedule
  const [maintenanceSchedule, setMaintenanceSchedule] = useState({
    nextMaintenance: new Date().toISOString().split('T')[0],
    maintenanceInterval: 30, // days
    notifyUsers: true,
    notifyAdmins: true
  });

  // Add new state for booking actions
  const [isBookingActionDialogOpen, setIsBookingActionDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingAction, setBookingAction] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Check user permissions on component mount
  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);
  
  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        toast({
          title: "Access Denied",
          description: "Please login to access the admin dashboard",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      toast({
        title: "Authentication Error",
        description: "Please try logging in again",
        variant: "destructive",
      });
      navigate('/login');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchBookings(), fetchRooms()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // First get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Map profiles data to our User interface
      const mappedUsers = profiles.map((profile) => {
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          student_number: profile.student_number,
          phone: profile.phone,
          role: profile.role as 'admin' | 'user',
          created_at: profile.created_at,
        };
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const fetchBookings = async () => {
    try {
      // Join bookings with rooms and user_profiles to get names
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          date,
          time_slot,
          purpose,
          status,
          created_at,
          rooms:room_id(id, name),
          user_profiles:user_id(full_name, email)
        `);

      if (error) throw error;

      // Map the joined data to our Booking interface
      const mappedBookings = data.map((booking: any) => {
        return {
          id: booking.id,
          room_name: booking.rooms ? booking.rooms.name : 'Unknown Room',
          user_name: booking.user_profiles ? booking.user_profiles.full_name || booking.user_profiles.email : 'Unknown User',
          user_id: booking.user_id,
          date: booking.date,
          time_slot: booking.time_slot,
          purpose: booking.purpose,
          status: booking.status,
          created_at: booking.created_at,
        };
      });

      setBookings(mappedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*');

      if (error) throw error;
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      throw error;
    }
  };

  // Filter functions
  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.student_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    false)
  );

  const filteredBookings = bookings.filter(booking =>
    (booking.room_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    false) &&
    (filterStatus === 'all' || booking.status === filterStatus)
  );

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterStatus === 'all' || room.status === filterStatus)
  );

  // Password validation function
  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one special character (!@#$%^&*)" };
    }
    return { isValid: true, message: "" };
  };

  // Validation function for user form
  const validateUserForm = (user: UserFormData): boolean => {
    const errors: Record<string, string> = {};
    
    if (!user.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (user.phone && !/^\+?[\d\s-]{10,}$/.test(user.phone)) {
      errors.phoneNumber = 'Invalid phone number format';
    }

    if (user.password && user.password !== user.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (user.password) {
      const passwordValidation = validatePassword(user.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation function for room form
  const validateRoomForm = (room: Room): boolean => {
    const errors: Record<string, string> = {};
    
    if (!room.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!room.type.trim()) {
      errors.type = 'Type is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetNewUserForm = () => {
    setNewUser({
      email: '',
      role: 'user' as const,
      full_name: '',
      student_number: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
  };

  const [newUser, setNewUser] = useState<UserFormData>({
    email: '',
    role: 'user' as const,
    full_name: '',
    student_number: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [newRoom, setNewRoom] = useState<Omit<Room, 'id'>>({
    name: '',
    type: '',
    status: 'available',
    capacity: undefined,
    description: '',
  });

  const handleAddUser = async () => {
    if (!validateUserForm(newUser)) return;
    
    try {
      // First create auth user if password is provided
      if (newUser.password) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: newUser.email,
          password: newUser.password,
          email_confirm: true
        });
        
        if (authError) throw authError;
        
        // Then create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: newUser.email,
            full_name: newUser.full_name,
            student_number: newUser.student_number,
            phone: newUser.phone,
            role: newUser.role
          });
          
        if (profileError) throw profileError;
      } else {
        // If no password, assume user already exists in auth and just add profile
        // This would need user ID, which we don't have here
        toast({
          title: "Error",
          description: "Password is required when adding a new user",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "User added",
        description: `Successfully added ${newUser.full_name || newUser.email} as a ${newUser.role}.`,
      });
      
      setIsAddUserOpen(false);
      resetNewUserForm();
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUser({
      email: user.email,
      full_name: user.full_name,
      student_number: user.student_number,
      phone: user.phone,
      role: user.role,
      password: '',
      confirmPassword: '',
    });
    setFormErrors({});
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = () => {
    if (editedUser && validateUserForm(editedUser)) {
      setIsConfirmDialogOpen(true);
    }
  };

  const confirmUpdateUser = async () => {
    if (editedUser && selectedUser) {
      try {
        // Update user profile in database
        const { error } = await supabase
          .from('user_profiles')
          .update({
            email: editedUser.email,
            full_name: editedUser.full_name,
            student_number: editedUser.student_number,
            phone: editedUser.phone,
            role: editedUser.role
          })
          .eq('id', selectedUser.id);
        
        if (error) throw error;
        
        // Update password if provided
        if (editedUser.password) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            selectedUser.id,
            { password: editedUser.password }
          );
          
          if (passwordError) throw passwordError;
        }
        
        toast({
          title: "User updated",
          description: "The user's information has been updated successfully.",
        });
        
        setIsEditUserOpen(false);
        setIsConfirmDialogOpen(false);
        setSelectedUser(null);
        setEditedUser(null);
        setFormErrors({});
        fetchUsers(); // Refresh users list
      } catch (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Error",
          description: "Failed to update user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteConfirm = (id: string, type: 'user' | 'room' | 'booking') => {
    setItemToDelete({ id, type });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      switch (itemToDelete.type) {
        case 'user':
          // Delete user from auth and profile will cascade
          await supabase.auth.admin.deleteUser(itemToDelete.id);
          fetchUsers();
          toast({
            title: "User Deleted",
            description: "The user has been removed from the system.",
          });
          break;
          
        case 'room':
          await supabase
            .from('rooms')
            .delete()
            .eq('id', itemToDelete.id);
          fetchRooms();
          toast({
            title: "Room Deleted",
            description: "The room has been removed from the system.",
          });
          break;
          
        case 'booking':
          await supabase
            .from('bookings')
            .delete()
            .eq('id', itemToDelete.id);
          fetchBookings();
          toast({
            title: "Booking Deleted",
            description: "The booking has been removed from the system.",
          });
          break;
      }
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${itemToDelete.type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAddRoom = async () => {
    if (!validateRoomForm(newRoom as Room)) return;
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert(newRoom)
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Room Added",
        description: `Successfully added ${newRoom.name} to the system.`,
      });
      
      setIsAddResourceOpen(false);
      setNewRoom({
        name: '',
        type: '',
        status: 'available',
        capacity: undefined,
        description: '',
      });
      fetchRooms(); // Refresh rooms list
    } catch (error) {
      console.error("Error adding room:", error);
      toast({
        title: "Error",
        description: "Failed to add room. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setEditedRoom({ ...room });
    setFormErrors({});
    setIsEditResourceOpen(true);
  };

  const handleUpdateRoom = async () => {
    if (!editedRoom || !validateRoomForm(editedRoom)) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          name: editedRoom.name,
          type: editedRoom.type,
          status: editedRoom.status,
          capacity: editedRoom.capacity,
          description: editedRoom.description
        })
        .eq('id', editedRoom.id);
      
      if (error) throw error;
      
      toast({
        title: "Room Updated",
        description: "The room information has been updated successfully.",
      });
      
      setIsEditResourceOpen(false);
      setSelectedRoom(null);
      setEditedRoom(null);
      setFormErrors({});
      fetchRooms(); // Refresh rooms list
    } catch (error) {
      console.error("Error updating room:", error);
      toast({
        title: "Error",
        description: "Failed to update room. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update booking handlers
  const handleBookingAction = (booking: Booking, action: 'approve' | 'reject' | 'cancel') => {
    setSelectedBooking(booking);
    setBookingAction(action);
    setRejectionReason('');
    setIsBookingActionDialogOpen(true);
  };

  const confirmBookingAction = async () => {
    if (!selectedBooking || !bookingAction) return;

    try {
      let updatedStatus: Booking['status'];
      let toastMessage = '';

      switch (bookingAction) {
        case 'approve':
          updatedStatus = 'approved';
          toastMessage = 'Booking has been approved successfully.';
          break;
        case 'reject':
          updatedStatus = 'rejected';
          toastMessage = `Booking has been rejected${rejectionReason ? `: ${rejectionReason}` : '.'}`;
          break;
        case 'cancel':
          updatedStatus = 'cancelled';
          toastMessage = 'Booking has been cancelled.';
          break;
        default:
          return;
      }

      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: updatedStatus,
          // In a real app, store rejection reason in a separate table or as JSON metadata
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Booking Updated",
        description: toastMessage,
      });

      fetchBookings(); // Refresh bookings list
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset state
      setIsBookingActionDialogOpen(false);
      setSelectedBooking(null);
      setBookingAction(null);
      setRejectionReason('');
    }
  };

  const handleExportData = () => {
    let dataToExport = [];
    let filename = '';
    
    switch (activeTab) {
      case 'users':
        dataToExport = users.map(u => ({
          'Email': u.email,
          'Name': u.full_name,
          'Student ID': u.student_number,
          'Phone': u.phone,
          'Role': u.role,
          'Created': u.created_at
        }));
        filename = 'users-export.json';
        break;
      case 'bookings':
        dataToExport = bookings.map(b => ({
          'Room': b.room_name,
          'User': b.user_name,
          'Date': b.date,
          'Time Slot': b.time_slot,
          'Purpose': b.purpose,
          'Status': b.status,
          'Created': b.created_at
        }));
        filename = 'bookings-export.json';
        break;
      case 'resources':
        dataToExport = rooms.map(r => ({
          'Name': r.name,
          'Type': r.type,
          'Status': r.status,
          'Capacity': r.capacity,
          'Description': r.description
        }));
        filename = 'resources-export.json';
        break;
    }

    // Create and download file
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);

    toast({
      title: "Data Exported",
      description: "The data has been exported successfully.",
    });
  };

  const handleRefreshData = () => {
    fetchData();
    toast({
      title: "Data Refreshed",
      description: "The data has been refreshed successfully.",
    });
  };

  // Handle email settings update
  const handleEmailSettingsUpdate = () => {
    toast({
      title: "Email Settings Updated",
      description: "Email notification preferences have been saved.",
    });
    setIsEmailSettingsOpen(false);
  };

  // Handle booking rules update
  const handleBookingRulesUpdate = () => {
    toast({
      title: "Booking Rules Updated",
      description: "Booking rules and restrictions have been saved.",
    });
    setIsBookingRulesOpen(false);
  };

  // Handle maintenance schedule update
  const handleMaintenanceUpdate = () => {
    toast({
      title: "Maintenance Schedule Updated",
      description: "System maintenance schedule has been saved.",
    });
    setIsMaintenanceOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Layout>
      <PageHeader 
        title="Admin Dashboard" 
        subtitle="Monitor and manage the Software Development Centre"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.role === 'user').length} regular users, {users.filter(u => u.role === 'admin').length} admins
              </p>
            </CardContent>
          </Card>
          
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
                {bookings.filter(b => b.status === 'pending').length} pending approvals
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'in-use').length / rooms.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {rooms.filter(r => r.status === 'available').length} resources available
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('approved')}>
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('rejected')}>
                    Rejected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon" onClick={handleExportData}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 flex justify-center items-center h-40">
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                  <p>Loading data...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="bookings" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resource</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>{booking.room_name}</TableCell>
                              <TableCell>{booking.user_name}</TableCell>
                              <TableCell>{formatDate(booking.date)}</TableCell>
                              <TableCell>{booking.time_slot}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </TableCell>
                              <TableCell>{booking.purpose || "Not specified"}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {booking.status === 'pending' && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleBookingAction(booking, 'approve')}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleBookingAction(booking, 'reject')}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        <AlertCircle className="h-4 w-4 mr-2" /> Reject
                                      </Button>
                                    </>
                                  )}
                                  {booking.status === 'approved' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleBookingAction(booking, 'cancel')}
                                      className="text-yellow-600 hover:text-yellow-700"
                                    >
                                      <AlertCircle className="h-4 w-4 mr-2" /> Cancel
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeleteConfirm(booking.id, 'booking')}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No bookings found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">User Management</h3>
                      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <UserPlus className="h-4 w-4 mr-2" /> Add User
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                              Add a new user to the system. Fill in all required fields below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                  id="name"
                                  value={newUser.full_name || ''}
                                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                  placeholder="Enter full name"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={newUser.email}
                                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                  placeholder="Enter email address"
                                  className={formErrors.email ? "border-red-500" : ""}
                                />
                                {formErrors.email && (
                                  <p className="text-sm text-red-500">{formErrors.email}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                  value={newUser.role}
                                  onValueChange={(value) => setNewUser({ ...newUser, role: value as 'admin' | 'user' })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="student-number">Student Number</Label>
                                <Input
                                  id="student-number"
                                  value={newUser.student_number || ''}
                                  onChange={(e) => setNewUser({ ...newUser, student_number: e.target.value })}
                                  placeholder="Enter student number"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="password">Password *</Label>
                                <div className="relative">
                                  <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Enter password"
                                    className={formErrors.password ? "border-red-500" : ""}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                                {formErrors.password && (
                                  <p className="text-sm text-red-500">{formErrors.password}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm Password *</Label>
                                <div className="relative">
                                  <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={newUser.confirmPassword}
                                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                                    placeholder="Confirm password"
                                    className={formErrors.confirmPassword ? "border-red-500" : ""}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                                {formErrors.confirmPassword && (
                                  <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={newUser.phone || ''}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                placeholder="Enter phone number"
                                className={formErrors.phoneNumber ? "border-red-500" : ""}
                              />
                              {formErrors.phoneNumber && (
                                <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsAddUserOpen(false);
                              resetNewUserForm();
                              setFormErrors({});
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddUser}>Add User</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Student Number</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.full_name || 'Not provided'}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.student_number || 'N/A'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.role}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(user.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-500"
                                    onClick={() => handleDeleteConfirm(user.id, 'user')}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Edit User Dialog */}
                    <Dialog open={isEditUserOpen} onOpenChange={(open) => {
                      if (!open) {
                        setFormErrors({});
                      }
                      setIsEditUserOpen(open);
                    }}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                          <DialogDescription>
                            Update user information. Make changes to the fields below.
                          </DialogDescription>
                        </DialogHeader>
                        {editedUser && (
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input
                                  id="edit-name"
                                  value={editedUser.full_name || ''}
                                  onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email *</Label>
                                <Input
                                  id="edit-email"
                                  type="email"
                                  value={editedUser.email}
                                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                                  className={formErrors.email ? "border-red-500" : ""}
                                />
                                {formErrors.email && (
                                  <p className="text-sm text-red-500">{formErrors.email}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-role">Role *</Label>
                                <Select
                                  value={editedUser.role}
                                  onValueChange={(value) => setEditedUser({ ...editedUser, role: value as 'admin' | 'user' })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-student-number">Student Number</Label>
                                <Input
                                  id="edit-student-number"
                                  value={editedUser.student_number || ''}
                                  onChange={(e) => setEditedUser({ ...editedUser, student_number: e.target.value })}
                                  placeholder="Enter student number"
                                />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="edit-phone">Phone Number</Label>
                              <Input
                                id="edit-phone"
                                value={editedUser.phone || ''}
                                onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                                className={formErrors.phoneNumber ? "border-red-500" : ""}
                              />
                              {formErrors.phoneNumber && (
                                <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-password">New Password</Label>
                                <div className="relative">
                                  <Input
                                    id="edit-password"
                                    type={showPassword ? "text" : "password"}
                                    value={editedUser.password || ''}
                                    onChange={(e) => setEditedUser({ ...editedUser, password: e.target.value })}
                                    placeholder="Enter new password (optional)"
                                    className={formErrors.password ? "border-red-500" : ""}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                                {formErrors.password && (
                                  <p className="text-sm text-red-500">{formErrors.password}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Leave blank to keep current password
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                  <Input
                                    id="edit-confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={editedUser.confirmPassword || ''}
                                    onChange={(e) => setEditedUser({ ...editedUser, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    className={formErrors.confirmPassword ? "border-red-500" : ""}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                                {formErrors.confirmPassword && (
                                  <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            setIsEditUserOpen(false);
                            setSelectedUser(null);
                            setEditedUser(null);
                            setFormErrors({});
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateUser}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Resource Management</h3>
                      <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" /> Add Resource
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Resource</DialogTitle>
                            <DialogDescription>
                              Add a new resource to the system. Fill in the details below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <label htmlFor="resourceName">Resource Name *</label>
                              <Input
                                id="resourceName"
                                value={newRoom.name}
                                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                className={formErrors.name ? "border-red-500" : ""}
                              />
                              {formErrors.name && (
                                <p className="text-sm text-red-500">{formErrors.name}</p>
                              )}
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="resourceType">Type *</label>
                              <Select
                                value={newRoom.type}
                                onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}
                              >
                                <SelectTrigger className={formErrors.type ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Workstation">Workstation</SelectItem>
                                  <SelectItem value="Room">Room</SelectItem>
                                  <SelectItem value="Equipment">Equipment</SelectItem>
                                </SelectContent>
                              </Select>
                              {formErrors.type && (
                                <p className="text-sm text-red-500">{formErrors.type}</p>
                              )}
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="capacity">Capacity (if applicable)</label>
                              <Input
                                id="capacity"
                                type="number"
                                value={newRoom.capacity?.toString() || ''}
                                onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="description">Description</label>
                              <Textarea
                                id="description"
                                value={newRoom.description || ''}
                                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                placeholder="Enter resource description"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="status">Status</label>
                              <Select
                                value={newRoom.status}
                                onValueChange={(value) => setNewRoom({ ...newRoom, status: value as 'available' | 'in-use' | 'maintenance' })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Available</SelectItem>
                                  <SelectItem value="in-use">In Use</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsAddResourceOpen(false);
                              setFormErrors({});
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddRoom}>Add Resource</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRooms.length > 0 ? (
                          filteredRooms.map((room) => (
                            <TableRow key={room.id}>
                              <TableCell>{room.name}</TableCell>
                              <TableCell>{room.type}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  room.status === 'available' ? 'bg-green-100 text-green-800' :
                                  room.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {room.status}
                                </span>
                              </TableCell>
                              <TableCell>{room.capacity || 'N/A'}</TableCell>
                              <TableCell>{room.description || 'No description'}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditRoom(room)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-500"
                                    onClick={() => handleDeleteConfirm(room.id, 'room')}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No rooms found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Edit Room Dialog */}
                    <Dialog open={isEditResourceOpen} onOpenChange={(open) => {
                      if (!open) {
                        setFormErrors({});
                      }
                      setIsEditResourceOpen(open);
                    }}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Resource</DialogTitle>
                          <DialogDescription>
                            Update resource information. Make changes to the fields below.
                          </DialogDescription>
                        </DialogHeader>
                        {editedRoom && (
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-resource-name">Resource Name *</Label>
                              <Input
                                id="edit-resource-name"
                                value={editedRoom.name}
                                onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
                                className={formErrors.name ? "border-red-500" : ""}
                              />
                              {formErrors.name && (
                                <p className="text-sm text-red-500">{formErrors.name}</p>
                              )}
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-resource-type">Type *</Label>
                              <Select
                                value={editedRoom.type}
                                onValueChange={(value) => setEditedRoom({ ...editedRoom, type: value })}
                              >
                                <SelectTrigger className={formErrors.type ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Workstation">Workstation</SelectItem>
                                  <SelectItem value="Room">Room</SelectItem>
                                  <SelectItem value="Equipment">Equipment</SelectItem>
                                </SelectContent>
                              </Select>
                              {formErrors.type && (
                                <p className="text-sm text-red-500">{formErrors.type}</p>
                              )}
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select
                                value={editedRoom.status}
                                onValueChange={(value) => setEditedRoom({ ...editedRoom, status: value as 'available' | 'in-use' | 'maintenance' })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Available</SelectItem>
                                  <SelectItem value="in-use">In Use</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-capacity">Capacity</Label>
                              <Input
                                id="edit-capacity"
                                type="number"
                                value={editedRoom.capacity?.toString() || ''}
                                onChange={(e) => setEditedRoom({ ...editedRoom, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={editedRoom.description || ''}
                                onChange={(e) => setEditedRoom({ ...editedRoom, description: e.target.value })}
                                placeholder="Enter resource description"
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            setIsEditResourceOpen(false);
                            setSelectedRoom(null);
                            setEditedRoom(null);
                            setFormErrors({});
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateRoom}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">System Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Email Notifications</h4>
                              <p className="text-sm text-muted-foreground">Send email notifications for booking updates</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsEmailSettingsOpen(true)}>
                              <Bell className="h-4 w-4 mr-2" /> Configure
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Booking Rules</h4>
                              <p className="text-sm text-muted-foreground">Configure booking time limits and restrictions</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsBookingRulesOpen(true)}>
                              <Settings className="h-4 w-4 mr-2" /> Configure
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">System Maintenance</h4>
                              <p className="text-sm text-muted-foreground">Schedule system maintenance and updates</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsMaintenanceOpen(true)}>
                              <Settings className="h-4 w-4 mr-2" /> Configure
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">User Permissions</h4>
                              <p className="text-sm text-muted-foreground">Manage user roles and access levels</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsPermissionsOpen(true)}>
                              <Shield className="h-4 w-4 mr-2" /> Configure
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Reports & Analytics</h4>
                              <p className="text-sm text-muted-foreground">View system usage statistics and reports</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsReportsOpen(true)}>
                              <BarChart className="h-4 w-4 mr-2" /> View
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">System Logs</h4>
                              <p className="text-sm text-muted-foreground">View system activity and error logs</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsLogsOpen(true)}>
                              <FileText className="h-4 w-4 mr-2" /> View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdateUser}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Settings Dialog */}
      <Dialog open={isEmailSettingsOpen} onOpenChange={setIsEmailSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Notification Settings</DialogTitle>
            <DialogDescription>
              Configure which email notifications should be sent to users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-confirmation">Booking Confirmation</Label>
              <Switch
                id="booking-confirmation"
                checked={emailSettings.bookingConfirmation}
                onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, bookingConfirmation: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-reminder">Booking Reminder</Label>
              <Switch
                id="booking-reminder"
                checked={emailSettings.bookingReminder}
                onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, bookingReminder: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-cancellation">Booking Cancellation</Label>
              <Switch
                id="booking-cancellation"
                checked={emailSettings.bookingCancellation}
                onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, bookingCancellation: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="system-updates">System Updates</Label>
              <Switch
                id="system-updates"
                checked={emailSettings.systemUpdates}
                onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, systemUpdates: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-alerts">Maintenance Alerts</Label>
              <Switch
                id="maintenance-alerts"
                checked={emailSettings.maintenanceAlerts}
                onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, maintenanceAlerts: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleEmailSettingsUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Rules Dialog */}
      <Dialog open={isBookingRulesOpen} onOpenChange={setIsBookingRulesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Rules</DialogTitle>
            <DialogDescription>
              Configure rules and restrictions for resource bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="max-duration">Maximum Booking Duration (hours)</Label>
              <Input
                id="max-duration"
                type="number"
                value={bookingRules.maxDuration}
                onChange={(e) => setBookingRules({ ...bookingRules, maxDuration: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min-notice">Minimum Notice Period (hours)</Label>
              <Input
                id="min-notice"
                type="number"
                value={bookingRules.minNotice}
                onChange={(e) => setBookingRules({ ...bookingRules, minNotice: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max-advance">Maximum Advance Booking (days)</Label>
              <Input
                id="max-advance"
                type="number"
                value={bookingRules.maxAdvance}
                onChange={(e) => setBookingRules({ ...bookingRules, maxAdvance: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-recurring">Allow Recurring Bookings</Label>
              <Switch
                id="allow-recurring"
                checked={bookingRules.allowRecurring}
                onCheckedChange={(checked) => setBookingRules({ ...bookingRules, allowRecurring: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="require-approval">Require Admin Approval</Label>
              <Switch
                id="require-approval"
                checked={bookingRules.requireApproval}
                onCheckedChange={(checked) => setBookingRules({ ...bookingRules, requireApproval: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingRulesOpen(false)}>Cancel</Button>
            <Button onClick={handleBookingRulesUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Schedule Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>System Maintenance Schedule</DialogTitle>
            <DialogDescription>
              Schedule system maintenance and configure notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="next-maintenance">Next Maintenance Date</Label>
              <Input
                id="next-maintenance"
                type="date"
                value={maintenanceSchedule.nextMaintenance}
                onChange={(e) => setMaintenanceSchedule({ ...maintenanceSchedule, nextMaintenance: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maintenance-interval">Maintenance Interval (days)</Label>
              <Input
                id="maintenance-interval"
                type="number"
                value={maintenanceSchedule.maintenanceInterval}
                onChange={(e) => setMaintenanceSchedule({ ...maintenanceSchedule, maintenanceInterval: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-users">Notify Users</Label>
              <Switch
                id="notify-users"
                checked={maintenanceSchedule.notifyUsers}
                onCheckedChange={(checked) => setMaintenanceSchedule({ ...maintenanceSchedule, notifyUsers: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-admins">Notify Administrators</Label>
              <Switch
                id="notify-admins"
                checked={maintenanceSchedule.notifyAdmins}
                onCheckedChange={(checked) => setMaintenanceSchedule({ ...maintenanceSchedule, notifyAdmins: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceOpen(false)}>Cancel</Button>
            <Button onClick={handleMaintenanceUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Booking Action Dialog */}
      <Dialog open={isBookingActionDialogOpen} onOpenChange={setIsBookingActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bookingAction === 'approve' && 'Approve Booking'}
              {bookingAction === 'reject' && 'Reject Booking'}
              {bookingAction === 'cancel' && 'Cancel Booking'}
            </DialogTitle>
            <DialogDescription>
              {bookingAction === 'approve' && 'Are you sure you want to approve this booking?'}
              {bookingAction === 'reject' && 'Please provide a reason for rejecting this booking.'}
              {bookingAction === 'cancel' && 'Are you sure you want to cancel this booking?'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Booking Details</Label>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Resource:</span> {selectedBooking.room_name}</p>
                  <p><span className="font-medium">User:</span> {selectedBooking.user_name}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(selectedBooking.date)}</p>
                  <p><span className="font-medium">Time:</span> {selectedBooking.time_slot}</p>
                  <p><span className="font-medium">Purpose:</span> {selectedBooking.purpose || 'Not specified'}</p>
                </div>
              </div>

              {bookingAction === 'reject' && (
                <div className="grid gap-2">
                  <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBookingActionDialogOpen(false);
              setSelectedBooking(null);
              setBookingAction(null);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={confirmBookingAction}
              variant={bookingAction === 'reject' ? 'destructive' : 'default'}
            >
              {bookingAction === 'approve' && 'Approve Booking'}
              {bookingAction === 'reject' && 'Reject Booking'}
              {bookingAction === 'cancel' && 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Admin;
