
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
      
      // Type casting to ensure status values conform to the Room interface
      const typedRooms = data.map(room => ({
        ...room,
        // Validate and convert status to the correct union type
        status: (room.status === 'available' || room.status === 'in-use' || room.status === 'maintenance') 
          ? room.status as 'available' | 'in-use' | 'maintenance'
          : 'available' // Default to 'available' if value is unexpected
      })) as Room[];
      
      setRooms(typedRooms);
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
                        {filteredBookings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                              No bookings found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredBookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{booking.room_name}</TableCell>
                              <TableCell>{booking.user_name}</TableCell>
                              <TableCell>{formatDate(booking.date)}</TableCell>
                              <TableCell>{booking.time_slot}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {booking.status === 'pending' ? (
                                    <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                                  ) : booking.status === 'approved' ? (
                                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                                  ) : booking.status === 'rejected' ? (
                                    <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 mr-1 text-gray-500" />
                                  )}
                                  <span className="capitalize">{booking.status}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {booking.purpose || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {booking.status === 'pending' && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleBookingAction(booking, 'approve')}>
                                          <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBookingAction(booking, 'reject')}>
                                          <AlertCircle className="h-4 w-4 mr-2" /> Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {(booking.status === 'approved' || booking.status === 'pending') && (
                                      <DropdownMenuItem onClick={() => handleBookingAction(booking, 'cancel')}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Cancel
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDeleteConfirm(booking.id, 'booking')}>
                                      <Trash2 className="h-4 w-4 mr-2 text-red-500" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsAddUserOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Add User
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.email}</TableCell>
                              <TableCell>{user.full_name || 'N/A'}</TableCell>
                              <TableCell>{user.student_number || 'N/A'}</TableCell>
                              <TableCell>{user.phone || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {user.role === 'admin' ? (
                                    <Shield className="h-4 w-4 mr-1 text-blue-500" />
                                  ) : (
                                    <Users className="h-4 w-4 mr-1 text-green-500" />
                                  )}
                                  <span className="capitalize">{user.role}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(user.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="icon" onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => handleDeleteConfirm(user.id, 'user')}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsAddResourceOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Resource
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRooms.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                              No resources found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRooms.map((room) => (
                            <TableRow key={room.id}>
                              <TableCell className="font-medium">{room.name}</TableCell>
                              <TableCell>{room.type}</TableCell>
                              <TableCell>{room.capacity || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {room.status === 'available' ? (
                                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                                  ) : room.status === 'in-use' ? (
                                    <Clock className="h-4 w-4 mr-1 text-blue-500" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                                  )}
                                  <span className="capitalize">{room.status}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{room.description || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="icon" onClick={() => handleEditRoom(room)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => handleDeleteConfirm(room.id, 'room')}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Button 
                        variant="outline" 
                        className="flex justify-between w-full p-4 h-auto" 
                        onClick={() => setIsEmailSettingsOpen(true)}
                      >
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <h3 className="font-medium">Email Notifications</h3>
                            <p className="text-sm text-muted-foreground">Configure automatic email alerts</p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-between w-full p-4 h-auto" 
                        onClick={() => setIsBookingRulesOpen(true)}
                      >
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <h3 className="font-medium">Booking Rules</h3>
                            <p className="text-sm text-muted-foreground">Set booking restrictions and policies</p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-between w-full p-4 h-auto" 
                        onClick={() => setIsMaintenanceOpen(true)}
                      >
                        <div className="flex items-center">
                          <Settings className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <h3 className="font-medium">Maintenance Schedule</h3>
                            <p className="text-sm text-muted-foreground">Plan system maintenance windows</p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-between w-full p-4 h-auto" 
                        onClick={() => setIsPermissionsOpen(true)}
                      >
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <h3 className="font-medium">User Permissions</h3>
                            <p className="text-sm text-muted-foreground">Manage access control settings</p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-between w-full p-4 h-auto" 
                        onClick={() => setIsReportsOpen(true)}
                      >
                        <div className="flex items-center">
                          <BarChart className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <h3 className="font-medium">Reports & Analytics</h3>
                            <p className="text-sm text-muted-foreground">Configure system reporting</p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-between w-full p-4 h-auto" 
                        onClick={() => setIsLogsOpen(true)}
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <h3 className="font-medium">System Logs</h3>
                            <p className="text-sm text-muted-foreground">View activity and error logs</p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. All fields with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="user@example.com"
              />
              {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.full_name || ''}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="studentNumber">Student Number</Label>
              <Input
                id="studentNumber"
                value={newUser.student_number || ''}
                onChange={(e) => setNewUser({...newUser, student_number: e.target.value})}
                placeholder="2022XXXXX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newUser.phone || ''}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="+123456789"
              />
              {formErrors.phoneNumber && <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value) => setNewUser({...newUser, role: value as 'admin' | 'user'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password || ''}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={newUser.confirmPassword || ''}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formErrors.confirmPassword && <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>}
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
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current.
            </DialogDescription>
          </DialogHeader>
          {editedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editedUser.email}
                  onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                />
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={editedUser.full_name || ''}
                  onChange={(e) => setEditedUser({...editedUser, full_name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-studentNumber">Student Number</Label>
                <Input
                  id="edit-studentNumber"
                  value={editedUser.student_number || ''}
                  onChange={(e) => setEditedUser({...editedUser, student_number: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editedUser.phone || ''}
                  onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                />
                {formErrors.phoneNumber && <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editedUser.role} 
                  onValueChange={(value) => setEditedUser({...editedUser, role: value as 'admin' | 'user'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">New Password (optional)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    value={editedUser.password || ''}
                    onChange={(e) => setEditedUser({...editedUser, password: e.target.value})}
                    placeholder="Leave blank to keep current"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="edit-confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={editedUser.confirmPassword || ''}
                    onChange={(e) => setEditedUser({...editedUser, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formErrors.confirmPassword && <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>}
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

      {/* Add Resource Dialog */}
      <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>
              Add a new room or resource to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="resource-name">Name *</Label>
              <Input
                id="resource-name"
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                placeholder="Lab A - Workstation 1"
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-type">Type *</Label>
              <Input
                id="resource-type"
                value={newRoom.type}
                onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                placeholder="Workstation, Room, Equipment"
              />
              {formErrors.type && <p className="text-sm text-red-500">{formErrors.type}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-capacity">Capacity</Label>
              <Input
                id="resource-capacity"
                type="number"
                value={newRoom.capacity?.toString() || ''}
                onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value ? parseInt(e.target.value) : undefined})}
                placeholder="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-status">Status</Label>
              <Select 
                value={newRoom.status} 
                onValueChange={(value) => setNewRoom({...newRoom, status: value as 'available' | 'in-use' | 'maintenance'})}
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
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                value={newRoom.description || ''}
                onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                placeholder="Describe the resource..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddResourceOpen(false);
              setNewRoom({
                name: '',
                type: '',
                status: 'available',
                capacity: undefined,
                description: '',
              });
              setFormErrors({});
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddRoom}>Add Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditResourceOpen} onOpenChange={setIsEditResourceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update resource information.
            </DialogDescription>
          </DialogHeader>
          {editedRoom && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-resource-name">Name</Label>
                <Input
                  id="edit-resource-name"
                  value={editedRoom.name}
                  onChange={(e) => setEditedRoom({...editedRoom, name: e.target.value})}
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-resource-type">Type</Label>
                <Input
                  id="edit-resource-type"
                  value={editedRoom.type}
                  onChange={(e) => setEditedRoom({...editedRoom, type: e.target.value})}
                />
                {formErrors.type && <p className="text-sm text-red-500">{formErrors.type}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-resource-capacity">Capacity</Label>
                <Input
                  id="edit-resource-capacity"
                  type="number"
                  value={editedRoom.capacity?.toString() || ''}
                  onChange={(e) => setEditedRoom({...editedRoom, capacity: e.target.value ? parseInt(e.target.value) : undefined})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-resource-status">Status</Label>
                <Select 
                  value={editedRoom.status} 
                  onValueChange={(value) => setEditedRoom({...editedRoom, status: value as 'available' | 'in-use' | 'maintenance'})}
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
                <Label htmlFor="edit-resource-description">Description</Label>
                <Textarea
                  id="edit-resource-description"
                  value={editedRoom.description || ''}
                  onChange={(e) => setEditedRoom({...editedRoom, description: e.target.value})}
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

      {/* Booking Action Dialog */}
      <Dialog open={isBookingActionDialogOpen} onOpenChange={setIsBookingActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {bookingAction === 'approve' ? 'Approve Booking' : 
               bookingAction === 'reject' ? 'Reject Booking' : 
               'Cancel Booking'}
            </DialogTitle>
            <DialogDescription>
              {bookingAction === 'approve' ? 'Confirm you want to approve this booking.' : 
               bookingAction === 'reject' ? 'Provide a reason for rejecting this booking.' : 
               'Confirm you want to cancel this booking.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedBooking && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="font-medium">Room:</span>
                  <span>{selectedBooking.room_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">User:</span>
                  <span>{selectedBooking.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(selectedBooking.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Time:</span>
                  <span>{selectedBooking.time_slot}</span>
                </div>
              </div>
            )}
            
            {bookingAction === 'reject' && (
              <div className="grid gap-2">
                <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason..."
                />
              </div>
            )}
          </div>
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
              variant={bookingAction === 'reject' || bookingAction === 'cancel' ? 'destructive' : 'default'}
            >
              {bookingAction === 'approve' ? 'Approve' : 
               bookingAction === 'reject' ? 'Reject' : 
               'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Settings Dialog */}
      <Dialog open={isEmailSettingsOpen} onOpenChange={setIsEmailSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Email Notification Settings</DialogTitle>
            <DialogDescription>
              Configure when email notifications are sent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="booking-confirmation" className="text-base">Booking Confirmations</Label>
                <p className="text-sm text-muted-foreground">Send when bookings are confirmed</p>
              </div>
              <Switch 
                id="booking-confirmation" 
                checked={emailSettings.bookingConfirmation}
                onCheckedChange={(checked) => setEmailSettings({...emailSettings, bookingConfirmation: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="booking-reminder" className="text-base">Booking Reminders</Label>
                <p className="text-sm text-muted-foreground">Send 24 hours before bookings</p>
              </div>
              <Switch 
                id="booking-reminder" 
                checked={emailSettings.bookingReminder}
                onCheckedChange={(checked) => setEmailSettings({...emailSettings, bookingReminder: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="booking-cancellation" className="text-base">Cancellation Notices</Label>
                <p className="text-sm text-muted-foreground">Send when bookings are cancelled</p>
              </div>
              <Switch 
                id="booking-cancellation" 
                checked={emailSettings.bookingCancellation}
                onCheckedChange={(checked) => setEmailSettings({...emailSettings, bookingCancellation: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-updates" className="text-base">System Updates</Label>
                <p className="text-sm text-muted-foreground">Send notifications about system changes</p>
              </div>
              <Switch 
                id="system-updates" 
                checked={emailSettings.systemUpdates}
                onCheckedChange={(checked) => setEmailSettings({...emailSettings, systemUpdates: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance-alerts" className="text-base">Maintenance Alerts</Label>
                <p className="text-sm text-muted-foreground">Send notifications about scheduled maintenance</p>
              </div>
              <Switch 
                id="maintenance-alerts" 
                checked={emailSettings.maintenanceAlerts}
                onCheckedChange={(checked) => setEmailSettings({...emailSettings, maintenanceAlerts: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailSettingsUpdate}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Rules Dialog */}
      <Dialog open={isBookingRulesOpen} onOpenChange={setIsBookingRulesOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Booking Rules & Restrictions</DialogTitle>
            <DialogDescription>
              Configure booking limitations and approval process.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-duration">Maximum Duration (hours)</Label>
              <Input 
                id="max-duration" 
                type="number" 
                value={bookingRules.maxDuration} 
                onChange={(e) => setBookingRules({...bookingRules, maxDuration: parseInt(e.target.value) || 1})}
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-notice">Minimum Notice (hours)</Label>
              <Input 
                id="min-notice" 
                type="number" 
                value={bookingRules.minNotice} 
                onChange={(e) => setBookingRules({...bookingRules, minNotice: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-advance">Maximum Advance Booking (days)</Label>
              <Input 
                id="max-advance" 
                type="number" 
                value={bookingRules.maxAdvance} 
                onChange={(e) => setBookingRules({...bookingRules, maxAdvance: parseInt(e.target.value) || 1})}
                min="1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-recurring" className="text-base">Allow Recurring Bookings</Label>
                <p className="text-sm text-muted-foreground">Enable weekly/monthly recurring bookings</p>
              </div>
              <Switch 
                id="allow-recurring" 
                checked={bookingRules.allowRecurring}
                onCheckedChange={(checked) => setBookingRules({...bookingRules, allowRecurring: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-approval" className="text-base">Require Admin Approval</Label>
                <p className="text-sm text-muted-foreground">All bookings need administrator approval</p>
              </div>
              <Switch 
                id="require-approval" 
                checked={bookingRules.requireApproval}
                onCheckedChange={(checked) => setBookingRules({...bookingRules, requireApproval: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingRulesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookingRulesUpdate}>Save Rules</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Schedule Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Maintenance Schedule</DialogTitle>
            <DialogDescription>
              Configure system maintenance windows and notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="next-maintenance">Next Maintenance Date</Label>
              <Input 
                id="next-maintenance" 
                type="date" 
                value={maintenanceSchedule.nextMaintenance} 
                onChange={(e) => setMaintenanceSchedule({
                  ...maintenanceSchedule, 
                  nextMaintenance: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maintenance-interval">Maintenance Interval (days)</Label>
              <Input 
                id="maintenance-interval" 
                type="number" 
                value={maintenanceSchedule.maintenanceInterval} 
                onChange={(e) => setMaintenanceSchedule({
                  ...maintenanceSchedule, 
                  maintenanceInterval: parseInt(e.target.value) || 30
                })}
                min="1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-users" className="text-base">Notify Users</Label>
                <p className="text-sm text-muted-foreground">Send maintenance alerts to all users</p>
              </div>
              <Switch 
                id="notify-users" 
                checked={maintenanceSchedule.notifyUsers}
                onCheckedChange={(checked) => setMaintenanceSchedule({
                  ...maintenanceSchedule, 
                  notifyUsers: checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-admins" className="text-base">Notify Administrators</Label>
                <p className="text-sm text-muted-foreground">Send reminders to administrators</p>
              </div>
              <Switch 
                id="notify-admins" 
                checked={maintenanceSchedule.notifyAdmins}
                onCheckedChange={(checked) => setMaintenanceSchedule({
                  ...maintenanceSchedule, 
                  notifyAdmins: checked
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMaintenanceUpdate}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm User Update Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this user's information?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdateUser}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'user' ? 
                "Are you sure you want to delete this user? This action cannot be undone." :
              itemToDelete?.type === 'room' ? 
                "Are you sure you want to delete this resource? This action cannot be undone." :
                "Are you sure you want to delete this booking? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Admin;
