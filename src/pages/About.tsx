
import React from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Workflow, 
  SquareCode, 
  Users, 
  BookOpen, 
  Server, 
  Laptop,
  Lightbulb,
  Globe
} from 'lucide-react';

const About = () => {
  return (
    <Layout>
      <PageHeader 
        title="About the SDC" 
        subtitle="Learn more about the National University of Science and Technology Software Development Centre"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-university-blue">Our Mission</h2>
                <p className="text-gray-700 mb-6">
                  The Software Development Centre (SDC) at the National University of Science and Technology 
                  is dedicated to providing students, faculty, and researchers with state-of-the-art 
                  computing resources and an optimal environment for software development, learning, 
                  and innovation.
                </p>
                
                <h2 className="text-2xl font-bold mb-4 text-university-blue">About the Centre</h2>
                <p className="text-gray-700 mb-4">
                  Established in 2015, the SDC has evolved into a hub for technological innovation and 
                  learning at NUST. The centre spans three floors in the Technology Building, housing 
                  multiple computer labs, study rooms, and specialized equipment for various computing needs.
                </p>
                <p className="text-gray-700 mb-6">
                  Our facilities are equipped with the latest hardware and software resources, supporting 
                  activities ranging from basic programming to advanced research in artificial intelligence, 
                  virtual reality, cybersecurity, and more.
                </p>
                
                <h2 className="text-2xl font-bold mb-4 text-university-blue">Our Objectives</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li>Provide accessible computing resources to all NUST students and faculty</li>
                  <li>Support academic coursework and research activities across departments</li>
                  <li>Facilitate industry collaboration and real-world project opportunities</li>
                  <li>Promote innovation and entrepreneurship in software development</li>
                  <li>Offer workshops and training sessions on emerging technologies</li>
                  <li>Create a collaborative environment for interdisciplinary tech projects</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-university-blue">Centre Stats</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Computer Labs</span>
                    <span className="font-semibold">15</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Workstations</span>
                    <span className="font-semibold">200+</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Study Rooms</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Conference Rooms</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Annual Bookings</span>
                    <span className="font-semibold">20,000+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Staff Members</span>
                    <span className="font-semibold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-university-blue">Available Resources</h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Laptop className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">High-performance workstations with dual monitors</span>
                  </li>
                  <li className="flex items-start">
                    <Server className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Development servers and cloud computing resources</span>
                  </li>
                  <li className="flex items-start">
                    <SquareCode className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Professional software development tools and licenses</span>
                  </li>
                  <li className="flex items-start">
                    <BookOpen className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Technical library and digital learning resources</span>
                  </li>
                  <li className="flex items-start">
                    <Workflow className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Testing and quality assurance environment</span>
                  </li>
                  <li className="flex items-start">
                    <Globe className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">High-speed internet and network infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <Lightbulb className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Innovation lab with emerging technology demos</span>
                  </li>
                  <li className="flex items-start">
                    <Users className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Collaborative workspaces for group projects</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
