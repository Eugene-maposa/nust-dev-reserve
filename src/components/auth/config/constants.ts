
// Development mode configurations
export const DEV_MODE = true;
export const DEV_AUTO_LOGIN = true;
export const DEV_USER_ROLE = 'admin'; // 'admin' or 'lecturer'

// Sample users data - In a real app, this would come from an API/database
export const users = [
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
