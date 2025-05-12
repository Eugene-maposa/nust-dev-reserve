import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-university-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-university-gold font-semibold text-lg mb-4">NUST Software Development Centre</h3>
            <address className="not-italic">
              <div className="flex items-start mb-2">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-university-gold" />
                <span>National University of Science and Technology<br />
                P.O. Box AC 939, Ascot<br />
                Bulawayo, Zimbabwe</span>
              </div>
              <div className="flex items-center mb-2">
                <Phone className="h-5 w-5 mr-2 text-university-gold" />
                <span>+263 29 2828422</span>
              </div>
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2 text-university-gold" />
                <span>sdc@nust.ac.zw</span>
              </div>
            </address>
          </div>
          
          <div>
            <h3 className="text-university-gold font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-university-gold transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-university-gold transition-colors">Book a Session</Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-university-gold transition-colors">Centre Map</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-university-gold transition-colors">Blog & Updates</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-university-gold font-semibold text-lg mb-4">Connect With Us</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.nust.ac.zw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-university-gold transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  NUST Website
                </a>
              </li>
              <li>
                <a 
                  href="https://www.facebook.com/nustzw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-university-gold transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Facebook
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/nustzw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-university-gold transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>&copy; {currentYear} National University of Science and Technology. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
