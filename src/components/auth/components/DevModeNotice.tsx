
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface DevModeNoticeProps {
  users: Array<{
    email: string;
    password: string;
    role: string;
    permissions: {
      canBook: boolean;
      canManageBookings: boolean;
      canManageUsers: boolean;
      canManageResources: boolean;
    };
  }>;
}

const DevModeNotice: React.FC<DevModeNoticeProps> = ({ users }) => {
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
          onClick={() => {
            const adminUser = users[0];
            localStorage.setItem('user', JSON.stringify({
              email: adminUser.email,
              role: adminUser.role,
              permissions: adminUser.permissions
            }));
            navigate('/admin');
          }}
        >
          Bypass as Admin
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline" 
          className="text-xs flex-1"
          onClick={() => {
            const lecturerUser = users[1];
            localStorage.setItem('user', JSON.stringify({
              email: lecturerUser.email,
              role: lecturerUser.role,
              permissions: lecturerUser.permissions
            }));
            navigate('/dashboard');
          }}
        >
          Bypass as Lecturer
        </Button>
      </div>
    </div>
  );
};

export default DevModeNotice;
