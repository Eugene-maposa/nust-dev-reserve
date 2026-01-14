import React, { useState, useCallback } from 'react';
import { useZxing } from 'react-zxing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraOff, Loader2, User, Lock, ScanBarcode } from 'lucide-react';

type ScanState = 'idle' | 'scanning' | 'found' | 'login';

const CardScannerForm = () => {
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedCode, setScannedCode] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Look up user by scanned code (student_number or code field)
  const lookupUser = useCallback(async (code: string) => {
    try {
      // First try to find by student_number
      let { data: profile, error } = await supabase
        .from('user_profiles')
        .select('email, full_name, student_number, code')
        .or(`student_number.eq.${code},code.eq.${code}`)
        .maybeSingle();

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
        toast({
          title: 'User Not Found',
          description: 'No user found with this ID. Please contact the administrator.',
          variant: 'destructive',
        });
        setScanState('idle');
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
  }, [toast]);

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
      // Only log non-trivial errors (not "No barcode found")
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No barcode')) {
        console.error('Scanner error:', error);
      }
    },
    paused: !cameraEnabled || scanState !== 'scanning',
  });

  // Start scanning
  const startScanning = () => {
    setCameraEnabled(true);
    setScanState('scanning');
    setScannedCode('');
    setUserEmail('');
    setUserName('');
    setPassword('');
  };

  // Stop scanning
  const stopScanning = () => {
    setCameraEnabled(false);
    setScanState('idle');
  };

  // Handle login with password
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

      // Successful login - navigation will be handled by auth state change
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

  // Reset to initial state
  const handleReset = () => {
    setScanState('idle');
    setCameraEnabled(false);
    setScannedCode('');
    setUserEmail('');
    setUserName('');
    setPassword('');
    setIsLoggingIn(false);
  };

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

      {/* Found State - Show user info and password prompt */}
      {scanState === 'found' && (
        <form onSubmit={handleLogin} className="space-y-6">
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
              disabled={isLoggingIn || !password}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
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
  );
};

export default CardScannerForm;
