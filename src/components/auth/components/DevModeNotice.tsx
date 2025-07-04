
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DevModeNotice: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
      <p className="text-sm text-yellow-700 font-medium">Development Mode Active</p>
      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-xs flex-1"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default DevModeNotice;
