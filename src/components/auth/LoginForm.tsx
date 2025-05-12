
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, QrCode, Loader2, Eye, EyeOff, UserCircle2 } from 'lucide-react';
import { Icons } from '../../components/ui/icons';

// Sample users data - In a real app, this would come from an API/database
const users = [
  {
    email: 'admin@nust.ac.zw',
    password: 'admin123',
    role: 'admin',
    permissions: {
      canBook: true,
      canManageBookings: true,
      canManageUsers: true,
      canManageResources: true
    }
  },
  {
    email: 'lecturer@nust.ac.zw',
    password: 'lecturer123',
    role: 'lecturer',
    permissions: {
      canBook: true,
      canManageBookings: false,
      canManageUsers: false,
      canManageResources: false
    }
  }
];

const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user in our sample data
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify({
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }));

        toast({
          title: "Login successful",
          description: user.role === 'admin' 
            ? "Welcome to NUST SDC Admin Dashboard"
            : "Welcome to NUST SDC Booking System",
        });

        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardScan = () => {
    toast({
      title: "Card Scanner",
      description: "This feature will be available soon!",
    });
  };

  const fillAdminCredentials = () => {
    setEmail('admin@nust.ac.zw');
    setPassword('admin123');
  };

  const fillLecturerCredentials = () => {
    setEmail('lecturer@nust.ac.zw');
    setPassword('lecturer123');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="email">Email Login</TabsTrigger>
          <TabsTrigger value="card">Card Scanner</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="university@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <a 
                  href="#" 
                  className="text-sm text-university-blue hover:text-university-blue/80"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: "Password Reset",
                      description: "Password reset functionality will be implemented soon.",
                    });
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            
            <Button
              type="submit"
              className="w-full bg-university-blue hover:bg-university-blue/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : 'Login'}
            </Button>

            <div className="flex gap-2 pt-2">
              <Button 
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={fillAdminCredentials}
              >
                <UserCircle2 className="mr-1 h-4 w-4" />
                Admin Login
              </Button>
              <Button 
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={fillLecturerCredentials}
              >
                <UserCircle2 className="mr-1 h-4 w-4" />
                Lecturer Login
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="card">
          <div className="text-center space-y-4 py-6">
            <QrCode className="h-24 w-24 mx-auto text-university-blue" />
            <h3 className="text-xl font-medium">Scan Your University Card</h3>
            <p className="text-gray-500">
              Place your university ID card near the scanner to login.
            </p>
            <Button 
              onClick={handleCardScan}
              className="bg-university-blue hover:bg-university-blue/90"
            >
              Simulate Card Scan
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-6" />
      
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don't have an account? Please contact the SDC administrator.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
