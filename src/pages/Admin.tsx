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
                        {filteredBookings.
