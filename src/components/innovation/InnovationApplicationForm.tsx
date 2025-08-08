import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  studentNumber: string;
  projectTitle: string;
  projectDescription: string;
  teamMembers: string;
  expectedDuration: string;
  resourcesNeeded: string;
}

const InnovationApplicationForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    studentNumber: '',
    projectTitle: '',
    projectDescription: '',
    teamMembers: '',
    expectedDuration: '',
    resourcesNeeded: ''
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit an application.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('innovation_hub_applications')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          student_number: formData.studentNumber,
          project_title: formData.projectTitle,
          project_description: formData.projectDescription,
          team_members: formData.teamMembers,
          expected_duration: formData.expectedDuration,
          resources_needed: formData.resourcesNeeded
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your Innovation Hub application has been submitted successfully. We'll review it within 5-7 business days."
      });

      // Reset form
      setFormData({
        fullName: '',
        email: user?.email || '',
        phone: '',
        studentNumber: '',
        projectTitle: '',
        projectDescription: '',
        teamMembers: '',
        expectedDuration: '',
        resourcesNeeded: ''
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Innovation Hub Application</CardTitle>
        <CardDescription>
          Fill out this form to apply for access to NUST's Innovation Hub. 
          Our team will review your application and get back to you within 5-7 business days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentNumber">Student Number</Label>
              <Input
                id="studentNumber"
                value={formData.studentNumber}
                onChange={(e) => handleInputChange('studentNumber', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectTitle">Project Title *</Label>
            <Input
              id="projectTitle"
              value={formData.projectTitle}
              onChange={(e) => handleInputChange('projectTitle', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">Project Description *</Label>
            <Textarea
              id="projectDescription"
              value={formData.projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              rows={4}
              placeholder="Describe your innovation project, its goals, and expected outcomes..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamMembers">Team Members</Label>
            <Textarea
              id="teamMembers"
              value={formData.teamMembers}
              onChange={(e) => handleInputChange('teamMembers', e.target.value)}
              rows={3}
              placeholder="List your team members and their roles (if applicable)..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedDuration">Expected Project Duration</Label>
            <Input
              id="expectedDuration"
              value={formData.expectedDuration}
              onChange={(e) => handleInputChange('expectedDuration', e.target.value)}
              placeholder="e.g., 6 months, 1 year..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resourcesNeeded">Resources Needed</Label>
            <Textarea
              id="resourcesNeeded"
              value={formData.resourcesNeeded}
              onChange={(e) => handleInputChange('resourcesNeeded', e.target.value)}
              rows={3}
              placeholder="Describe what resources, equipment, or support you'll need..."
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InnovationApplicationForm;