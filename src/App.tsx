
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Bookings from "@/pages/Bookings";
import Map from "@/pages/Map";
import Blog from "@/pages/Blog";
import BlogDetail from "@/pages/BlogDetail";
import BlogForm from "@/pages/BlogForm";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import Dashboard from "@/pages/Dashboard";
import ResetPassword from './pages/ResetPassword';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/map" element={<Map />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/blog/create" element={<BlogForm />} />
              <Route path="/blog/edit/:id" element={<BlogForm />} />
              <Route path="/about" element={<About />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

export default App;
