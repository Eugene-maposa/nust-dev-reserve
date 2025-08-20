import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  title: string;
  fullName: string;
  email: string;
  phone: string;
  studentNumber: string;
  organisation: string;
  position: string;
  faculty: string;
  department: string;
  supervisor: string;
  projectTitle: string;
  abstract: string;
  problemStatement: string;
  aim: string;
  projectStrategy: string;
  projectDescription: string;
  expectedResults: string;
  rationale: string;
  fullDescription: string;
  noveltyOfInvention: string;
  stageOfInvention: string;
  trlLevel: string;
  teamMembers: string;
  teamMembersRequired: string;
  incubationRequirements: string;
  otherRequirements: string;
  estimatedBudget: string;
  proposedFunding: string;
  expectedDuration: string;
  resourcesNeeded: string;
  receivedBy: string;
  receivedDate: string;
  designerSignature: string;
  signatureDate: string;
}

const InnovationApplicationForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    fullName: '',
    email: user?.email || '',
    phone: '',
    studentNumber: '',
    organisation: '',
    position: '',
    faculty: '',
    department: '',
    supervisor: '',
    projectTitle: '',
    abstract: '',
    problemStatement: '',
    aim: '',
    projectStrategy: '',
    projectDescription: '',
    expectedResults: '',
    rationale: '',
    fullDescription: '',
    noveltyOfInvention: '',
    stageOfInvention: '',
    trlLevel: '',
    teamMembers: '',
    teamMembersRequired: '',
    incubationRequirements: '',
    otherRequirements: '',
    estimatedBudget: '',
    proposedFunding: '',
    expectedDuration: '',
    resourcesNeeded: '',
    receivedBy: '',
    receivedDate: '',
    designerSignature: '',
    signatureDate: ''
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
          title: formData.title,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          student_number: formData.studentNumber,
          organisation: formData.organisation,
          position: formData.position,
          faculty: formData.faculty,
          department: formData.department,
          supervisor: formData.supervisor,
          project_title: formData.projectTitle,
          abstract: formData.abstract,
          problem_statement: formData.problemStatement,
          aim: formData.aim,
          project_strategy: formData.projectStrategy,
          project_description: formData.projectDescription,
          expected_results: formData.expectedResults,
          rationale: formData.rationale,
          full_description: formData.fullDescription,
          novelty_of_invention: formData.noveltyOfInvention,
          stage_of_invention: formData.stageOfInvention,
          trl_level: formData.trlLevel,
          team_members: formData.teamMembers,
          team_members_required: formData.teamMembersRequired,
          incubation_requirements: formData.incubationRequirements,
          other_requirements: formData.otherRequirements,
          estimated_budget: formData.estimatedBudget,
          proposed_funding: formData.proposedFunding,
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
        title: '',
        fullName: '',
        email: user?.email || '',
        phone: '',
        studentNumber: '',
        organisation: '',
        position: '',
        faculty: '',
        department: '',
        supervisor: '',
        projectTitle: '',
        abstract: '',
        problemStatement: '',
        aim: '',
        projectStrategy: '',
        projectDescription: '',
        expectedResults: '',
        rationale: '',
        fullDescription: '',
        noveltyOfInvention: '',
        stageOfInvention: '',
        trlLevel: '',
        teamMembers: '',
        teamMembersRequired: '',
        incubationRequirements: '',
        otherRequirements: '',
        estimatedBudget: '',
        proposedFunding: '',
        expectedDuration: '',
        resourcesNeeded: '',
        receivedBy: '',
        receivedDate: '',
        designerSignature: '',
        signatureDate: ''
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img src="/NUST.jpg" alt="NUST Logo" className="h-16 w-16 object-contain" />
          <div>
            <h2 className="text-xl font-bold">NATIONAL UNIVERSITY OF SCIENCE AND TECHNOLOGY</h2>
            <p className="text-sm text-muted-foreground">Innovation and Business Development</p>
          </div>
        </div>
        <CardTitle className="text-2xl">Application to Join the Innovation Hub</CardTitle>
        <CardDescription>
          Fill out this comprehensive form to apply for access to NUST's Innovation Hub. 
          Our team will review your application and get back to you within 5-7 business days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Select value={formData.title} onValueChange={(value) => handleInputChange('title', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Prof">Prof</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organisation">Organisation</Label>
                <Input
                  id="organisation"
                  value={formData.organisation}
                  onChange={(e) => handleInputChange('organisation', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Contact (Phone) *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact (Email) *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Select value={formData.faculty} onValueChange={(value) => handleInputChange('faculty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Applied Sciences">Applied Sciences</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Communication and Information Science">Communication and Information Science</SelectItem>
                    <SelectItem value="Industrial Technology">Industrial Technology</SelectItem>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                    <SelectItem value="Built Environment">Built Environment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supervisor">Supervisor(s)</Label>
                <Input
                  id="supervisor"
                  value={formData.supervisor}
                  onChange={(e) => handleInputChange('supervisor', e.target.value)}
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
          </div>

          {/* Project Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Project Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="projectTitle">1. Title of the Proposed Project/Innovation *</Label>
              <Input
                id="projectTitle"
                value={formData.projectTitle}
                onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abstract">2. Abstract (1 page) *</Label>
              <Textarea
                id="abstract"
                value={formData.abstract}
                onChange={(e) => handleInputChange('abstract', e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problemStatement">3. Problem Statement *</Label>
              <Textarea
                id="problemStatement"
                value={formData.problemStatement}
                onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aim">4. Aim *</Label>
              <Textarea
                id="aim"
                value={formData.aim}
                onChange={(e) => handleInputChange('aim', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectStrategy">5. Project Strategy/Methodology *</Label>
              <Textarea
                id="projectStrategy"
                value={formData.projectStrategy}
                onChange={(e) => handleInputChange('projectStrategy', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedResults">6. Expected Results/Output *</Label>
              <Textarea
                id="expectedResults"
                value={formData.expectedResults}
                onChange={(e) => handleInputChange('expectedResults', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rationale">7. Rationale/Justification *</Label>
              <Textarea
                id="rationale"
                value={formData.rationale}
                onChange={(e) => handleInputChange('rationale', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullDescription">8. Full Description of the Invention (include sketches or diagrams) *</Label>
              <Textarea
                id="fullDescription"
                value={formData.fullDescription}
                onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                rows={4}
                placeholder="Click or tap here to enter text."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noveltyOfInvention">9. The Novelty of the Invention *</Label>
              <Textarea
                id="noveltyOfInvention"
                value={formData.noveltyOfInvention}
                onChange={(e) => handleInputChange('noveltyOfInvention', e.target.value)}
                rows={3}
                placeholder="Indicating how different the invention is from other existing inventions/technologies performing similar functions"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stageOfInvention">10. Stage of the Invention *</Label>
              <Select value={formData.stageOfInvention} onValueChange={(value) => handleInputChange('stageOfInvention', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Concept stage">Concept stage</SelectItem>
                  <SelectItem value="Development stage">Development stage</SelectItem>
                  <SelectItem value="Prototyping">Prototyping</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Market ready">Market ready</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trlLevel">Technology Readiness Level (TRL) *</Label>
              <Select value={formData.trlLevel} onValueChange={(value) => handleInputChange('trlLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRL 1">TRL 1: Basic principles observed</SelectItem>
                  <SelectItem value="TRL 2">TRL 2: Technology concept formulated</SelectItem>
                  <SelectItem value="TRL 3">TRL 3: Experimental proof of concept</SelectItem>
                  <SelectItem value="TRL 4">TRL 4: Technology validated in lab</SelectItem>
                  <SelectItem value="TRL 5">TRL 5: Technology validated in relevant environment</SelectItem>
                  <SelectItem value="TRL 6">TRL 6: Technology prototype demonstrated</SelectItem>
                  <SelectItem value="TRL 7">TRL 7: System prototype demonstration</SelectItem>
                  <SelectItem value="TRL 8">TRL 8: System complete and qualified</SelectItem>
                  <SelectItem value="TRL 9">TRL 9: Actual system proven in operational environment</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
                <h4 className="font-medium mb-2">Key: Technology Readiness Level (TRL)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><strong>TRL 1:</strong> Basic principles observed: The initial stage, where basic scientific research identifies the fundamental principles of a technology.</li>
                  <li><strong>TRL 2:</strong> Technology concept formulated: A technology concept is formulated based on the initial research findings.</li>
                  <li><strong>TRL 3:</strong> Experimental proof of concept: Experimental testing begins to validate the feasibility of the technology.</li>
                  <li><strong>TRL 4:</strong> Technology validated in lab: The technology is tested in a controlled laboratory environment to assess its performance.</li>
                  <li><strong>TRL 5:</strong> Technology validated in relevant environment: The technology is validated in a simulated relevant environment to assess its performance in a more realistic setting.</li>
                  <li><strong>TRL 6:</strong> Technology prototype demonstrated in relevant environment: A prototype of the technology is demonstrated in a relevant environment.</li>
                  <li><strong>TRL 7:</strong> System prototype demonstration in operational environment: A prototype of the technology is demonstrated in an operational environment to assess its performance under real-world conditions.</li>
                  <li><strong>TRL 8:</strong> System complete and qualified: The technology is fully integrated and tested in a complex system, ensuring its reliability and readiness for use.</li>
                  <li><strong>TRL 9:</strong> Actual system proven in operational environment: The technology is successfully deployed and proven in an operational environment.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Team and Requirements Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Team and Requirements</h3>

            <div className="space-y-2">
              <Label htmlFor="teamMembersRequired">11. Team Members Required (if any)</Label>
              <Textarea
                id="teamMembersRequired"
                value={formData.teamMembersRequired}
                onChange={(e) => handleInputChange('teamMembersRequired', e.target.value)}
                rows={3}
                placeholder="Click or tap here to enter text."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incubationRequirements">12. Incubation Requirements (if any)</Label>
              <Textarea
                id="incubationRequirements"
                value={formData.incubationRequirements}
                onChange={(e) => handleInputChange('incubationRequirements', e.target.value)}
                rows={3}
                placeholder="Click or tap here to enter text."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherRequirements">13. Any Other Requirements</Label>
              <Textarea
                id="otherRequirements"
                value={formData.otherRequirements}
                onChange={(e) => handleInputChange('otherRequirements', e.target.value)}
                rows={3}
                placeholder="Click or tap here to enter text."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">14. Estimated Budget</Label>
              <Input
                id="estimatedBudget"
                value={formData.estimatedBudget}
                onChange={(e) => handleInputChange('estimatedBudget', e.target.value)}
                placeholder="Click or tap here to enter text."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposedFunding">15. Proposed sources of funding</Label>
              <Textarea
                id="proposedFunding"
                value={formData.proposedFunding}
                onChange={(e) => handleInputChange('proposedFunding', e.target.value)}
                rows={3}
                placeholder="Click or tap here to enter text."
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
              <Label htmlFor="resourcesNeeded">Additional Resources Needed</Label>
              <Textarea
                id="resourcesNeeded"
                value={formData.resourcesNeeded}
                onChange={(e) => handleInputChange('resourcesNeeded', e.target.value)}
                rows={3}
                placeholder="Describe what resources, equipment, or support you'll need..."
              />
            </div>
          </div>

          {/* Administrative Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Administrative Use</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receivedBy">Received by:</Label>
                <Input
                  id="receivedBy"
                  value={formData.receivedBy}
                  onChange={(e) => handleInputChange('receivedBy', e.target.value)}
                  placeholder="Click or tap here to enter text."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedDate">Date:</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designerSignature">Designer/Innovator Signature:</Label>
                <Input
                  id="designerSignature"
                  value={formData.designerSignature}
                  onChange={(e) => handleInputChange('designerSignature', e.target.value)}
                  placeholder="Click or tap here to enter text."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signatureDate">Date:</Label>
                <Input
                  id="signatureDate"
                  type="date"
                  value={formData.signatureDate}
                  onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                />
              </div>
            </div>
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