
import React from 'react';

const stats = [
  { value: '15+', label: 'Computer Labs' },
  { value: '200+', label: 'Workstations' },
  { value: '5,000+', label: 'Students Served' },
  { value: '24/7', label: 'Access Available' }
];

const StatsSection = () => {
  return (
    <section className="py-16 bg-university-blue text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-university-gold mb-2">
                {stat.value}
              </div>
              <div className="text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
