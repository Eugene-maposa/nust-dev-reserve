
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Info, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <div className="bg-university-blue text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              NUST Software Development Centre
            </h1>
            <h2 className="text-xl md:text-2xl text-university-gold mb-6">
              Book Labs, Classrooms & Resources
            </h2>
            <p className="text-lg mb-8 max-w-lg">
              Streamlined booking system for lecturers and students to reserve 
              computer labs, study rooms, and development resources at NUST.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/bookings">
                <Button className="bg-university-gold text-university-blue hover:bg-university-gold/90">
                  <Calendar className="mr-2 h-4 w-4" /> Book Now
                </Button>
              </Link>
              <Link to="/innovation-hub">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Users className="mr-2 h-4 w-4" /> Apply for Innovation Hub
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  <Info className="mr-2 h-4 w-4" /> Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <img 
                src="./public/NUST.jpg" 
                alt="NUST Software Development Centre" 
                className="w-full h-64 object-cover rounded-md" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
