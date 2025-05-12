
import React from 'react';
import { Calendar, Clock, Users, Monitor, Bookmark, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: <Calendar className="h-10 w-10 text-university-blue" />,
    title: 'Easy Scheduling',
    description: 'Book labs and resources with our intuitive calendar interface.'
  },
  {
    icon: <Clock className="h-10 w-10 text-university-blue" />,
    title: 'Real-time Availability',
    description: 'Check resource availability in real time before making your booking.'
  },
  {
    icon: <Users className="h-10 w-10 text-university-blue" />,
    title: 'User Management',
    description: 'Different access levels for students, lecturers, and administrators.'
  },
  {
    icon: <Monitor className="h-10 w-10 text-university-blue" />,
    title: 'Resource Tracking',
    description: 'Track computers, equipment, and room utilization efficiently.'
  },
  {
    icon: <Bookmark className="h-10 w-10 text-university-blue" />,
    title: 'Recurring Bookings',
    description: 'Set up recurring sessions for regular classes and labs.'
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-university-blue" />,
    title: 'Secure Access',
    description: 'Secure authentication with email or university ID card scanning.'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-university-blue mb-4">
            Streamlined Resource Management
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our booking system offers powerful features to efficiently manage the Software Development Centre resources.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-t-4 border-university-gold"
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-university-blue">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
