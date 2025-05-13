
import React from 'react';
import { Loader2 } from 'lucide-react';

interface AutoLoginLoaderProps {
  userRole: string;
}

const AutoLoginLoader: React.FC<AutoLoginLoaderProps> = ({ userRole }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-university-blue" />
      <p>Development mode: Auto-logging in as {userRole}...</p>
    </div>
  );
};

export default AutoLoginLoader;
