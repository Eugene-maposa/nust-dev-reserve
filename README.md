# NUST Dev Reserve

A modern resource booking system for NUST (National University of Science and Technology) built with React, TypeScript, and Tailwind CSS.

## Features

- 🔐 Secure authentication system
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Secure password hashing
  - Session management
  - Protected routes

- 📅 Resource booking management
  - Calendar-based booking interface
  - Real-time availability checking
  - Booking confirmation system
  - Automated email notifications
  - Booking history tracking

- 👥 User role management
  - Admin: Full system control, user management, resource management
  - Lecturer: Book resources, manage their bookings
  - Student: Book available resources, view booking history
  - Custom permissions per role

- 📊 Dashboard with booking statistics
  - Real-time booking analytics
  - Resource utilization metrics
  - User activity tracking
  - Booking trends visualization
  - Quick action buttons

- 🔍 Search and filter capabilities
  - Advanced resource search
  - Booking history filtering
  - Status-based filtering
  - Date range selection
  - Resource type filtering

- 📱 Responsive design
  - Mobile-first approach
  - Adaptive layouts
  - Touch-friendly interfaces
  - Cross-device compatibility
  - Optimized performance

- 🎨 Modern UI with Tailwind CSS
  - Consistent design system
  - Custom component library
  - Dark/light mode support
  - Accessible components
  - Smooth animations

## Tech Stack

- React 18
  - Component-based architecture
  - Hooks for state management
  - Context API for global state
  - Custom hooks for reusable logic
  - Strict mode for better development

- TypeScript
  - Type safety
  - Interface definitions
  - Type checking
  - Better IDE support
  - Enhanced code quality

- Tailwind CSS
  - Utility-first styling
  - Custom theme configuration
  - Responsive design utilities
  - Dark mode support
  - Component styling

- Shadcn UI
  - Pre-built components
  - Consistent design system
  - Accessible components
  - Customizable themes
  - Form components

- React Router
  - Client-side routing
  - Protected routes
  - Route parameters
  - Navigation guards
  - History management

- React Query
  - Server state management
  - Data caching
  - Real-time updates
  - Optimistic updates
  - Error handling

- Axios
  - HTTP client
  - API integration
  - Request/response interceptors
  - Error handling
  - Authentication headers

- Lucide Icons
  - Consistent icon set
  - Customizable icons
  - SVG-based icons
  - Lightweight
  - Easy integration

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Eugene-maposa/nust-dev-reserve.git
cd nust-dev-reserve
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── auth/      # Authentication components
│   ├── booking/   # Booking-related components
│   ├── layout/    # Layout components
│   └── ui/        # UI components
├── pages/         # Page components
│   ├── admin/     # Admin dashboard
│   ├── auth/      # Authentication pages
│   └── user/      # User pages
├── hooks/         # Custom React hooks
│   ├── auth/      # Authentication hooks
│   └── booking/   # Booking hooks
├── lib/           # Utility functions and configurations
│   ├── api/       # API configurations
│   └── utils/     # Helper functions
├── types/         # TypeScript type definitions
└── styles/        # Global styles and Tailwind configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Eugene Maposa - [@Eugene-maposa](https://github.com/Eugene-maposa)

Project Link: [https://github.com/Eugene-maposa/nust-dev-reserve](https://github.com/Eugene-maposa/nust-dev-reserve)
