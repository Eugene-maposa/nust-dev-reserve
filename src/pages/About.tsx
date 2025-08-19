
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
        title="About the Technovation Centre" 
        subtitle="Learn more about the National University of Science and Technology Technovation Centre"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-university-blue">Our Mission</h2>
                <p className="text-gray-700 mb-6">
                  The Technovation Centre (TC) at the National University of Science and Technology
                  catalyzes innovation, entrepreneurship, and technology transfer across the university
                  and industry. We provide a nurturing environment, mentorship, and access to
                  prototyping and venture-building resources that help ideas grow into impactful
                  products, services, and startups.
                </p>
                
                <h2 className="text-2xl font-bold mb-4 text-university-blue">About the Centre</h2>
                <p className="text-gray-700 mb-4">
                  Established in 2015, the Technovation Centre has grown into a university-wide hub for
                  creativity, prototyping, and venture creation. Located in the Technology Building, the
                  Centre brings together students, researchers, and industry partners to co-create
                  solutions to real-world challenges.
                </p>
                <p className="text-gray-700 mb-6">
                  Our facilities include prototyping and fabrication spaces, collaborative studios, and
                  access to cloud and data resources. We support activities from early-stage ideation to
                  proof-of-concept, user testing, pilot deployments, and commercialization.
                </p>
                
                <h2 className="text-2xl font-bold mb-4 text-university-blue">Our Objectives</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li>Provide accessible prototyping and fabrication resources for all NUST innovators</li>
                  <li>Incubate and accelerate student and staff-led startups and projects</li>
                  <li>Facilitate industry partnerships and technology commercialization pathways</li>
                  <li>Run training, design sprints, hackathons, and innovation challenges</li>
                  <li>Support multidisciplinary collaboration and human-centered problem solving</li>
                  <li>Cultivate an entrepreneurial culture and innovation mindset on campus</li>
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
                    <span className="text-gray-700">Innovation Labs</span>
                    <span className="font-semibold">15</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Workstations</span>
                    <span className="font-semibold">200+</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Collaboration Rooms</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Event & Meeting Rooms</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Annual Participants</span>
                    <span className="font-semibold">20,000+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Mentors & Staff</span>
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
                    <span className="text-gray-700">Prototyping workstations and maker equipment</span>
                  </li>
                  <li className="flex items-start">
                    <Server className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Cloud computing, data, and deployment resources</span>
                  </li>
                  <li className="flex items-start">
                    <SquareCode className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Design, prototyping, and collaboration tool licenses</span>
                  </li>
                  <li className="flex items-start">
                    <BookOpen className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Training materials, workshops, and learning resources</span>
                  </li>
                  <li className="flex items-start">
                    <Workflow className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Incubation, acceleration, and venture-building programs</span>
                  </li>
                  <li className="flex items-start">
                    <Globe className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">High-speed internet and collaboration infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <Lightbulb className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Innovation lab with emerging technology demos</span>
                  </li>
                  <li className="flex items-start">
                    <Users className="h-5 w-5 mr-2 text-university-blue mt-0.5" />
                    <span className="text-gray-700">Mentorship network and collaborative project spaces</span>
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
