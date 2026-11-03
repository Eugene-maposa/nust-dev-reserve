import React, { useState, useCallback, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraOff, Loader2, User, Lock, ScanBarcode, DoorOpen, UserPlus, Mail } from 'lucide-react';

type ScanState = 'idle' | 'scanning' | 'found' | 'notfound' | 'registering' | 'registered';

interface Room {
  id: string;
  name: string;
  type: string;
}

const CardScannerForm = ({ initialCode, onRegistered }: { initialCode?: string; onRegistered?: (code: string) => void } = {}) => {
  const { toast } = useToast();
  const { signIn, user: currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedCode, setScannedCode] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [foundUserId, setFoundUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Room selection for check-in
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Admin registration form for new barcodes
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [isRegistering, setIsRegistering] = useState(false);

  // Load available rooms for the check-in dropdown
  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, type')
        .eq('status', 'available')
        .order('name');
      if (!error && data) setRooms(data);
    };
    fetchRooms();
  }, []);

  // Look up user by scanned code (student_number or code field)
  const lookupUser = useCallback(async (code: string) => {
    try {
      const { data: rows, error } = await supabase.rpc('lookup_user_by_code' as never, { p_code: code } as never);
      const profile = (Array.isArray(rows) ? rows[0] : null) as { id: string; email: string; full_name: string | null } | null;

      if (error) {
        console.error('Error looking up user:', error);
        toast({
          title: 'Lookup Error',
          description: 'Failed to look up user. Please try again.',
          variant: 'destructive',
        });
        setScanState('idle');
        return;
      }

      if (profile) {
        setFoundUserId(profile.id);
        setUserEmail(profile.email);
        setUserName(profile.full_name || profile.email);
        setScannedCode(code);
        setScanState('found');
        setCameraEnabled(false);
        toast({
          title: 'User Found',
          description: `Welcome, ${profile.full_name || profile.email}!`,
        });
      } else {
        // New barcode — admin can register this person
        setScannedCode(code);
        setCameraEnabled(false);
        setScanState('notfound');
        if (!isAdmin) {
          await supabase.rpc('report_unregistered_scan' as never, { p_code: code } as never);
          toast({
            title: 'User Not Found',
            description: 'This ID is not registered. Please see the administrator at the IBD office.',
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setScanState('idle');
    }
  }, [toast, isAdmin]);

  // Handle barcode decode result
  const handleDecode = useCallback((result: string) => {
    if (scanState !== 'scanning') return;

    const code = result.trim();
    if (code) {
      setScanState('found');
      lookupUser(code);
    }
  }, [scanState, lookupUser]);

  // react-zxing hook for barcode scanning
  const { ref } = useZxing({
    onDecodeResult(result) {
      handleDecode(result.getText());
    },
    onError(error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No barcode')) {
        console.error('Scanner error:', error);
      }
    },
    paused: !cameraEnabled || scanState !== 'scanning',
  });

  const startScanning = () => {
    setCameraEnabled(true);
    setScanState('scanning');
    setScannedCode('');
    setUserEmail('');
    setUserName('');
    setFoundUserId('');
    setPassword('');
    setSelectedRoomId('');
  };

  const stopScanning = () => {
    setCameraEnabled(false);
    setScanState('idle');
  };

  // Record which room the scanned user is using
  const recordCheckIn = async (userId: string) => {
    if (!selectedRoomId) return;
    const { error } = await supabase.from('check_ins').insert({
      user_id: userId,
      room_id: selectedRoomId,
      scanned_code: scannedCode,
    });
    if (error) {
      console.error('Check-in error:', error);
    }
  };

  // Handle login with password (existing user on the login page)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your password.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedRoomId) {
      toast({
        title: 'Select a Room',
        description: 'Please specify which room you will be using.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const { error } = await signIn(userEmail, password);

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
        setIsLoggingIn(false);
        return;
      }

      // Record the room check-in after successful login
      await recordCheckIn(foundUserId);

      toast({
        title: 'Checked In',
        description: `You are now checked in to ${rooms.find(r => r.id === selectedRoomId)?.name || 'the room'}.`,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsLoggingIn(false);
    }
  };

  // Admin check-in: admin is logged in and scanned a known user — just record the room
  const handleAdminCheckIn = async () => {
    if (!selectedRoomId) {
      toast({
        title: 'Select a Room',
        description: 'Please specify which room this person will be using.',
        variant: 'destructive',
      });
      return;
    }
    await recordCheckIn(foundUserId);
    toast({
      title: 'Checked In',
      description: `${userName} is now checked in to ${rooms.find(r => r.id === selectedRoomId)?.name || 'the room'}.`,
    });
    handleReset();
  };

  // Admin registers a new person from a scanned barcode
  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFullName.trim() || !regEmail.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the full name and email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-register-scanned-user', {
        body: {
          email: regEmail.trim(),
          fullName: regFullName.trim(),
          idCode: scannedCode,
          phone: regPhone.trim() || undefined,
          role: regRole,
        },
        headers: sessionData?.session?.access_token
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : undefined,
      });

      if (error) {
        let message = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) {
            const body = await ctx.json();
            if (body?.error) message = body.error;
          }
        } catch { /* keep default message */ }
        toast({
          title: 'Registration Failed',
          description: message,
          variant: 'destructive',
        });
        setIsRegistering(false);
        return;
      }

      setScanState('registered');
      onRegistered?.(scannedCode);
      toast({
        title: 'Person Registered',
        description: data?.warning || `An invitation email has been sent to ${regEmail}.`,
      });
    } catch (err) {
      console.error('Registration error:', err);
      toast({
        title: 'Registration Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleReset = () => {
    setScanState('idle');
    setCameraEnabled(false);
    setScannedCode('');
    setUserEmail('');
    setUserName('');
    setFoundUserId('');
    setPassword('');
    setIsLoggingIn(false);
    setSelectedRoomId('');
    setRegFullName('');
    setRegEmail('');
    setRegPhone('');
    setRegRole('student');
  };

  useEffect(() => {
    if (initialCode) {
      setScanState('found');
      lookupUser(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  // Manual code entry
  const [manualCode, setManualCode] = useState('');
  const handleManualEntry = () => {
    if (manualCode.trim()) {
      setScanState('found');
      lookupUser(manualCode.trim());
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Idle State - Show start button */}
      {scanState === 'idle' && (
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <ScanBarcode className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Scan Your ID Card</h3>
            <p className="text-muted-foreground text-sm">
              Use your Student ID or National ID barcode to login quickly
            </p>
          </div>

          <Button
            onClick={startScanning}
            className="w-full"
            size="lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Start Camera Scanner
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter ID number"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
            />
            <Button onClick={handleManualEntry} variant="secondary">
              Lookup
            </Button>
          </div>
        </div>
      )}

      {/* Scanning State - Show camera feed */}
      {scanState === 'scanning' && (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed border-primary/50">
            <video
              ref={ref}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-primary rounded-lg animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-center">
              <span className="bg-background/80 px-3 py-1 rounded-full text-sm">
                Position barcode within the frame
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning for barcode...
          </div>

          <Button
            onClick={stopScanning}
            variant="outline"
            className="w-full"
          >
            <CameraOff className="h-4 w-4 mr-2" />
            Cancel Scanning
          </Button>
        </div>
      )}

      {/* Found State - room selection + password (or admin check-in) */}
      {scanState === 'found' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">{userName}</h3>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            {scannedCode && (
              <p className="text-xs text-muted-foreground">
                ID: {scannedCode}
              </p>
            )}
          </div>

          {/* Room selection — always required for known users */}
          <div className="space-y-2">
            <Label htmlFor="room">Which room will you be using?</Label>
            <div className="relative">
              <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger id="room" className="pl-10">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAdmin && currentUser ? (
            /* Admin is checking this person in — no password needed */
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full"
                onClick={handleAdminCheckIn}
                disabled={!selectedRoomId}
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                Check In to Room
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleReset}
              >
                Scan Different ID
              </Button>
            </div>
          ) : (
            /* Normal login flow with password */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter Your Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn || !password || !selectedRoomId}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In & Check In'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleReset}
                >
                  Scan Different ID
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Not Found State — admin can register, others see a message */}
      {scanState === 'notfound' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold">New ID Detected</h3>
            <p className="text-sm text-muted-foreground">
              ID: <span className="font-mono">{scannedCode}</span>
            </p>
          </div>

          {isAdmin && currentUser ? (
            <form onSubmit={handleRegisterNewUser} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                This ID is not registered yet. Enter the person's details below — they will receive an email to create their login profile.
              </p>

              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name *</Label>
                <Input
                  id="reg-name"
                  placeholder="e.g. Tendai Moyo"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email Address *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. tmoyo@nust.ac.zw"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone Number</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="e.g. +263 71 234 5678"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-role">Role</Label>
                <Select value={regRole} onValueChange={setRegRole}>
                  <SelectTrigger id="reg-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRegistering || !regFullName.trim() || !regEmail.trim()}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Register & Send Invitation Email
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleReset}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                This ID card is not registered in the system. The administrator has been notified. Please visit the IBD office at the Technovation Centre to complete your registration.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleReset}
              >
                Scan Again
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Registered State — confirmation */}
      {scanState === 'registered' && (
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Registration Complete</h3>
            <p className="text-sm text-muted-foreground">
              An invitation email has been sent to <strong>{regEmail}</strong>. Once they set their password, they can log in by scanning their ID card.
            </p>
          </div>
          <Button onClick={handleReset} className="w-full">
            Scan Another ID
          </Button>
        </div>
      )}
    </div>
  );
};

export default CardScannerForm;
