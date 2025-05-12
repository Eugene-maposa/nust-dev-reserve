
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Calendar, Map, FileText, Home } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-university-blue text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-university-gold font-bold text-xl">NUST-SDC</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 items-center">
            <Link to="/" className="flex items-center px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors">
              <Home className="mr-2 h-4 w-4" /> Home
            </Link>
            <Link to="/bookings" className="flex items-center px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors">
              <Calendar className="mr-2 h-4 w-4" /> Bookings
            </Link>
            <Link to="/map" className="flex items-center px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors">
              <Map className="mr-2 h-4 w-4" /> Map
            </Link>
            <Link to="/blog" className="flex items-center px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors">
              <FileText className="mr-2 h-4 w-4" /> Blog
            </Link>
            <div className="ml-4">
              <Link to="/login">
                <Button className="bg-university-gold text-university-blue hover:bg-university-gold/90">
                  <User className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-university-gold transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-university-blue border-t border-university-blue/30 animate-fade-in">
          <div className="container mx-auto px-4 py-3 space-y-2">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Home className="inline mr-2 h-4 w-4" /> Home
            </Link>
            <Link 
              to="/bookings" 
              className="block px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="inline mr-2 h-4 w-4" /> Bookings
            </Link>
            <Link 
              to="/map" 
              className="block px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Map className="inline mr-2 h-4 w-4" /> Map
            </Link>
            <Link 
              to="/blog" 
              className="block px-3 py-2 rounded-md hover:bg-university-blue/80 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FileText className="inline mr-2 h-4 w-4" /> Blog
            </Link>
            <Link 
              to="/login" 
              className="block px-3 py-2 bg-university-gold text-university-blue rounded-md font-medium"
              onClick={() => setIsOpen(false)}
            >
              <User className="inline mr-2 h-4 w-4" /> Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
