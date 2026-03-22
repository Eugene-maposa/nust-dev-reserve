import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Loader2, Eye, EyeOff, User, CreditCard, Upload, X, ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationFormProps {
  onBackToLogin: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBackToLogin }) => {
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null, side: 'front' | 'back') => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a JPG, PNG, or WebP image.', variant: 'destructive' });
      return;
    }
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 5MB.', variant: 'destructive' });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (side === 'front') {
      if (idFrontPreview) URL.revokeObjectURL(idFrontPreview);
      setIdFrontFile(file);
      setIdFrontPreview(previewUrl);
    } else {
      if (idBackPreview) URL.revokeObjectURL(idBackPreview);
      setIdBackFile(file);
      setIdBackPreview(previewUrl);
    }
  };

  const removeFile = (side: 'front' | 'back') => {
    if (side === 'front') {
      if (idFrontPreview) URL.revokeObjectURL(idFrontPreview);
      setIdFrontFile(null);
      setIdFrontPreview(null);
    } else {
      if (idBackPreview) URL.revokeObjectURL(idBackPreview);
      setIdBackFile(null);
      setIdBackPreview(null);
    }
  };

  const uploadIdImage = async (userId: string, file: File, side: 'front' | 'back'): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const filePath = `${userId}/id-${side}.${ext}`;

    const { error } = await supabase.storage
      .from('id-documents')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error(`Error uploading ID ${side}:`, error);
      return null;
    }

    return filePath;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ title: 'Registration failed', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({ title: 'Registration failed', description: 'Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.', variant: 'destructive' });
      return;
    }

    if (!fullName.trim()) {
      toast({ title: 'Registration failed', description: 'Please enter your full name.', variant: 'destructive' });
      return;
    }

    if (!idNumber.trim()) {
      toast({ title: 'Registration failed', description: 'Please enter your National ID number.', variant: 'destructive' });
      return;
    }

    if (!idFrontFile || !idBackFile) {
      toast({ title: 'Registration failed', description: 'Please upload both front and back images of your National ID.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signUp(email, password);

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw error;
      }

      const userId = data?.user?.id;

      if (userId) {
        // Upload ID images
        const [frontPath, backPath] = await Promise.all([
          uploadIdImage(userId, idFrontFile, 'front'),
          uploadIdImage(userId, idBackFile, 'back'),
        ]);

        // Update user profile with name, ID number, and image paths
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: fullName.trim(),
            code: idNumber.trim(),
            id_front_url: frontPath,
            id_back_url: backPath,
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Non-fatal — account is still created
        }
      }

      if (data?.user && !data.session) {
        toast({
          title: 'Verify your email',
          description: 'A verification link has been sent to your email. Please click the link to verify your account before logging in.',
          duration: 15000,
        });
      } else {
        toast({
          title: 'Registration successful',
          description: 'Your account has been created.',
          duration: 8000,
        });
      }

      onBackToLogin();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({ title: 'Registration failed', description: error.message || 'An error occurred during registration.', variant: 'destructive', duration: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  const IdImageUpload = ({ side, file, preview, inputRef }: {
    side: 'front' | 'back';
    file: File | null;
    preview: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="space-y-2">
      <Label>{side === 'front' ? 'ID Front' : 'ID Back (Barcode side)'}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null, side)}
      />
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={preview} alt={`ID ${side}`} className="w-full h-32 object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => removeFile(side)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Click to upload {side === 'front' ? 'front' : 'back'} of ID
          </span>
        </button>
      )}
    </div>
  );

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Create an Account</h3>
        <p className="text-sm text-muted-foreground">Enter your details and upload your National ID</p>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="reg-fullname">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="reg-fullname" placeholder="John Doe" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="reg-email" type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      {/* National ID Number */}
      <div className="space-y-2">
        <Label htmlFor="reg-idnumber">National ID Number</Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="reg-idnumber" placeholder="e.g. 63-123456A78" className="pl-10" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
        </div>
        <p className="text-xs text-muted-foreground">This will be used for ID card barcode login</p>
      </div>

      {/* ID Image Uploads */}
      <div className="grid grid-cols-2 gap-3">
        <IdImageUpload side="front" file={idFrontFile} preview={idFrontPreview} inputRef={frontInputRef} />
        <IdImageUpload side="back" file={idBackFile} preview={idBackPreview} inputRef={backInputRef} />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="reg-password" type={showPassword ? 'text' : 'password'} className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Min 8 chars with uppercase, lowercase, numbers, and special characters.</p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="reg-confirm" type={showPassword ? 'text' : 'password'} className="pl-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</> : 'Register'}
      </Button>

      <div className="text-center">
        <Button type="button" variant="link" className="text-sm" onClick={onBackToLogin}>
          Already have an account? Log in
        </Button>
      </div>
    </form>
  );
};

export default RegistrationForm;
