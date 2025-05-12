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

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'lecturer' | 'student';
  department: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  permissions: {
    canBook: boolean;
    canManageUsers: boolean;
    canManageResources: boolean;
    canManageBookings: boolean;
  };
  phoneNumber?: string;
  studentId?: string;
  staffId?: string;
  notes?: string;
  password?: string;
  lastLogin?: string;
}

interface UserFormData extends Omit<User, 'id' | 'lastLogin'> {
  confirmPassword?: string;
}

interface Booking {
  id: string;
  resource: string;
  user: string;
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
  lastMaintenance: string;
  capacity?: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<UserFormData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('bookings');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [isBookingRulesOpen, setIsBookingRulesOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  // Check user permissions on component mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      toast({
        title: "Access Denied",
        description: "Please login to access the admin dashboard",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin' || !user.permissions.canManageUsers) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [navigate, toast]);

  // Sample data - In a real app, this would come from an API
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      department: 'IT',
      status: 'active',
      permissions: {
        canBook: true,
        canManageUsers: true,
        canManageResources: true,
        canManageBookings: true,
      },
      lastLogin: '2024-03-20 10:00',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'lecturer',
      department: 'Computer Science',
      status: 'active',
      permissions: {
        canBook: true,
        canManageUsers: false,
        canManageResources: false,
        canManageBookings: true,
      },
      lastLogin: '2024-03-19 15:30',
    },
  ]);

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      resource: 'Lab A - Workstation 12',
      user: 'Eugene Maposa',
      date: 'March 25, 2024',
      time: '2:00 PM - 4:00 PM',
      status: 'pending',
      purpose: 'Project Development'
    },
    {
      id: '2',
      resource: 'Study Room B',
      user: 'Tatenda Ndoro',
      date: 'March 26, 2024',
      time: '10:00 AM - 12:00 PM',
      status: 'pending',
      purpose: 'Research Meeting'
    }
  ]);

  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      name: 'Lab A - Workstation 12',
      type: 'Workstation',
      status: 'available',
      lastMaintenance: 'March 20, 2024'
    },
    {
      id: '2',
      name: 'Study Room B',
      type: 'Room',
      status: 'in-use',
      lastMaintenance: 'March 15, 2024',
      capacity: 4
    }
  ]);

  const [newUser, setNewUser] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'student' as const,
    department: '',
    status: 'active' as const,
    permissions: {
      canBook: true,
      canManageUsers: false,
      canManageResources: false,
      canManageBookings: false,
    },
    password: '',
    confirmPassword: '',
  });

  const [newResource, setNewResource] = useState({
    name: '',
    type: '',
    capacity: ''
  });

  // Filter functions
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking =>
    (booking.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.user.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterStatus === 'all' || booking.status === filterStatus)
  );

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterStatus === 'all' || resource.status === filterStatus)
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
  const validateUserForm = (user: User): boolean => {
    const errors: Record<string, string> = {};
    
    if (!user.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!user.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!user.department.trim()) {
      errors.department = 'Department is required';
    }

    if (user.role === 'student' && !user.studentId?.trim()) {
      errors.studentId = 'Student ID is required for students';
    }

    if (user.role === 'lecturer' && !user.staffId?.trim()) {
      errors.staffId = 'Staff ID is required for lecturers';
    }

    if (user.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(user.phoneNumber)) {
      errors.phoneNumber = 'Invalid phone number format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetNewUserForm = () => {
    setNewUser({
      name: '',
      email: '',
      role: 'student' as const,
      department: '',
      status: 'active' as const,
      permissions: {
        canBook: true,
        canManageUsers: false,
        canManageResources: false,
        canManageBookings: false,
      },
      password: '',
      confirmPassword: '',
    });
  };

  const handleAddUser = () => {
    if (validateUserForm(newUser as User)) {
      if (newUser.password !== newUser.confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        return;
      }

      if (!validatePassword(newUser.password)) {
        toast({
          title: "Invalid password",
          description: "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character",
          variant: "destructive",
        });
        return;
      }

      const newUserWithId: User = {
        ...newUser,
        id: Math.random().toString(36).substr(2, 9),
        status: 'active' as const,
        lastLogin: new Date().toISOString(),
      };

      setUsers([...users, newUserWithId]);
      toast({
        title: "User added",
        description: `Successfully added ${newUser.name} as a ${newUser.role}.`,
      });
      setIsAddUserOpen(false);
      resetNewUserForm();
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUser({
      ...user,
      confirmPassword: '',
    });
    setFormErrors({});
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = () => {
    if (editedUser && validateUserForm(editedUser as User)) {
      setIsConfirmDialogOpen(true);
    }
  };

  const confirmUpdateUser = () => {
    if (editedUser && selectedUser) {
      const updatedUser: User = {
        ...editedUser,
        id: selectedUser.id,
        lastLogin: selectedUser.lastLogin,
      };
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      toast({
        title: "User updated",
        description: "The user's information has been updated successfully.",
      });
      setIsEditUserOpen(false);
      setIsConfirmDialogOpen(false);
      setSelectedUser(null);
      setEditedUser(null);
      setFormErrors({});
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "User Deleted",
      description: "The user has been removed from the system.",
    });
  };

  const handleAddResource = () => {
    const newResourceWithId: Resource = {
      ...newResource,
      id: Date.now().toString(),
      status: 'available' as const,
      lastMaintenance: new Date().toLocaleString(),
      capacity: newResource.capacity ? parseInt(newResource.capacity) : undefined
    };
    setResources([...resources, newResourceWithId]);
    toast({
      title: "Resource Added",
      description: `Successfully added ${newResource.name} to the system.`,
    });
    setIsAddResourceOpen(false);
    setNewResource({ name: '', type: '', capacity: '' });
  };

  // Update booking handlers
  const handleBookingAction = (booking: Booking, action: 'approve' | 'reject' | 'cancel') => {
    setSelectedBooking(booking);
    setBookingAction(action);
    setIsBookingActionDialogOpen(true);
  };

  const confirmBookingAction = () => {
    if (!selectedBooking || !bookingAction) return;

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
        updatedStatus = 'cancelled' as Booking['status'];
        toastMessage = 'Booking has been cancelled.';
        break;
      default:
        return;
    }

    setBookings(bookings.map(booking =>
      booking.id === selectedBooking.id
        ? { ...booking, status: updatedStatus }
        : booking
    ));

    toast({
      title: "Booking Updated",
      description: toastMessage,
    });

    // Reset state
    setIsBookingActionDialogOpen(false);
    setSelectedBooking(null);
    setBookingAction(null);
    setRejectionReason('');
  };

  const handleExportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    toast({
      title: "Data Exported",
      description: "The data has been exported successfully.",
    });
  };

  const handleRefreshData = () => {
    // In a real app, this would fetch fresh data from the API
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
                {users.filter(u => u.status === 'active').length} active users
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
                {Math.round((resources.filter(r => r.status === 'in-use').length / resources.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {resources.filter(r => r.status === 'available').length} resources available
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
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.resource}</TableCell>
                        <TableCell>{booking.user}</TableCell>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={newUser.name}
                              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(value) => setNewUser({ ...newUser, role: value as 'admin' | 'lecturer' | 'student' })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="lecturer">Lecturer</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="department">Department *</Label>
                            <Input
                              id="department"
                              value={newUser.department}
                              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                              placeholder="Enter department"
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
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={newUser.phoneNumber}
                              onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                              placeholder="Enter phone number"
                            />
                          </div>
                          {newUser.role === 'student' && (
                            <div className="grid gap-2">
                              <Label htmlFor="student-id">Student ID *</Label>
                              <Input
                                id="student-id"
                                value={newUser.studentId}
                                onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                                placeholder="Enter student ID"
                              />
                            </div>
                          )}
                          {newUser.role === 'lecturer' && (
                            <div className="grid gap-2">
                              <Label htmlFor="staff-id">Staff ID *</Label>
                              <Input
                                id="staff-id"
                                value={newUser.staffId}
                                onChange={(e) => setNewUser({ ...newUser, staffId: e.target.value })}
                                placeholder="Enter staff ID"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={newUser.notes}
                            onChange={(e) => setNewUser({ ...newUser, notes: e.target.value })}
                            placeholder="Add any additional notes about the user"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
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
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
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
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                            <Label htmlFor="edit-name">Full Name *</Label>
                            <Input
                              id="edit-name"
                              value={editedUser.name}
                              onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                              className={formErrors.name ? "border-red-500" : ""}
                            />
                            {formErrors.name && (
                              <p className="text-sm text-red-500">{formErrors.name}</p>
                            )}
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
                              onValueChange={(value) => {
                                const newUser = { 
                                  ...editedUser, 
                                  role: value as 'admin' | 'lecturer' | 'student'
                                };
                                // Reset role-specific fields when role changes
                                if (value === 'student') {
                                  newUser.staffId = undefined;
                                } else if (value === 'lecturer') {
                                  newUser.studentId = undefined;
                                }
                                setEditedUser(newUser);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="lecturer">Lecturer</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-department">Department *</Label>
                            <Input
                              id="edit-department"
                              value={editedUser.department}
                              onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                              className={formErrors.department ? "border-red-500" : ""}
                            />
                            {formErrors.department && (
                              <p className="text-sm text-red-500">{formErrors.department}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-phone">Phone Number</Label>
                            <Input
                              id="edit-phone"
                              value={editedUser.phoneNumber || ''}
                              onChange={(e) => setEditedUser({ ...editedUser, phoneNumber: e.target.value })}
                              className={formErrors.phoneNumber ? "border-red-500" : ""}
                            />
                            {formErrors.phoneNumber && (
                              <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>
                            )}
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-status">Status *</Label>
                            <Select
                              value={editedUser.status}
                              onValueChange={(value) => setEditedUser({ ...editedUser, status: value as 'active' | 'suspended' | 'pending' })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {editedUser.role === 'student' && (
                          <div className="grid gap-2">
                            <Label htmlFor="edit-student-id">Student ID *</Label>
                            <Input
                              id="edit-student-id"
                              value={editedUser.studentId || ''}
                              onChange={(e) => setEditedUser({ ...editedUser, studentId: e.target.value })}
                              className={formErrors.studentId ? "border-red-500" : ""}
                            />
                            {formErrors.studentId && (
                              <p className="text-sm text-red-500">{formErrors.studentId}</p>
                            )}
                          </div>
                        )}

                        {editedUser.role === 'lecturer' && (
                          <div className="grid gap-2">
                            <Label htmlFor="edit-staff-id">Staff ID *</Label>
                            <Input
                              id="edit-staff-id"
                              value={editedUser.staffId || ''}
                              onChange={(e) => setEditedUser({ ...editedUser, staffId: e.target.value })}
                              className={formErrors.staffId ? "border-red-500" : ""}
                            />
                            {formErrors.staffId && (
                              <p className="text-sm text-red-500">{formErrors.staffId}</p>
                            )}
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="edit-notes">Notes</Label>
                          <Textarea
                            id="edit-notes"
                            value={editedUser.notes || ''}
                            onChange={(e) => setEditedUser({ ...editedUser, notes: e.target.value })}
                            placeholder="Add any additional notes about the user..."
                          />
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
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-4">Permissions</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="can-book"
                                checked={editedUser.permissions.canBook}
                                onCheckedChange={(checked) => setEditedUser({
                                  ...editedUser,
                                  permissions: { ...editedUser.permissions, canBook: checked }
                                })}
                              />
                              <Label htmlFor="can-book">Can Book Resources</Label>
                            </div>
                            {editedUser.role === 'admin' && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="can-manage-bookings"
                                    checked={editedUser.permissions.canManageBookings}
                                    onCheckedChange={(checked) => setEditedUser({
                                      ...editedUser,
                                      permissions: { ...editedUser.permissions, canManageBookings: checked }
                                    })}
                                  />
                                  <Label htmlFor="can-manage-bookings">Manage Bookings</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="can-manage-users"
                                    checked={editedUser.permissions.canManageUsers}
                                    onCheckedChange={(checked) => setEditedUser({
                                      ...editedUser,
                                      permissions: { ...editedUser.permissions, canManageUsers: checked }
                                    })}
                                  />
                                  <Label htmlFor="can-manage-users">Manage Users</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="can-manage-resources"
                                    checked={editedUser.permissions.canManageResources}
                                    onCheckedChange={(checked) => setEditedUser({
                                      ...editedUser,
                                      permissions: { ...editedUser.permissions, canManageResources: checked }
                                    })}
                                  />
                                  <Label htmlFor="can-manage-resources">Manage Resources</Label>
                                </div>
                              </>
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
                          <label htmlFor="resourceName">Resource Name</label>
                          <Input
                            id="resourceName"
                            value={newResource.name}
                            onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="resourceType">Type</label>
                          <Select
                            value={newResource.type}
                            onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="workstation">Workstation</SelectItem>
                              <SelectItem value="room">Room</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="capacity">Capacity (if applicable)</label>
                          <Input
                            id="capacity"
                            type="number"
                            value={newResource.capacity}
                            onChange={(e) => setNewResource({ ...newResource, capacity: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddResourceOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddResource}>Add Resource</Button>
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
                      <TableHead>Last Maintenance</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Actions</TableHead>
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
                        <TableCell>{resource.lastMaintenance}</TableCell>
                        <TableCell>{resource.capacity || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" /> Maintenance
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-500">
                              <AlertCircle className="h-4 w-4 mr-2" /> Report Issue
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  <p><span className="font-medium">Resource:</span> {selectedBooking.resource}</p>
                  <p><span className="font-medium">User:</span> {selectedBooking.user}</p>
                  <p><span className="font-medium">Date:</span> {selectedBooking.date}</p>
                  <p><span className="font-medium">Time:</span> {selectedBooking.time}</p>
                  <p><span className="font-medium">Purpose:</span> {selectedBooking.purpose}</p>
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