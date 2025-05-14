
// Development mode configurations
export const DEV_MODE = false;
export const DEV_AUTO_LOGIN = false;
export const DEV_USER_ROLE = 'admin'; // 'admin' or 'lecturer'

// Sample users data structure (not including passwords)
export const users = [
  {
    email: 'admin@nust.ac.zw',
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
    role: 'lecturer',
    permissions: {
      canBook: true,
      canManageBookings: false,
      canManageUsers: false,
      canManageResources: false
    }
  }
];
