import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, CheckCircle, Circle, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DocumentUpload from '@/components/projects/DocumentUpload';

interface ProjectDetailsProps {
  project: any;
  onClose: () => void;
  onUpdate: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onClose, onUpdate }) => {
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [stageNotes, setStageNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTRLProgress = (currentLevel: number) => {
    return (currentLevel / 9) * 100;
  };

  const trlStages = [
    { level: 1, name: 'Basic Principles Observed', description: 'Scientific research begins to be translated into applied research and development' },
    { level: 2, name: 'Technology Concept Formulated', description: 'Invention begins, practical application is identified but is speculative' },
    { level: 3, name: 'Experimental Proof of Concept', description: 'Active research and development is initiated, includes analytical studies' },
    { level: 4, name: 'Technology Validated in Lab', description: 'Basic technological components are integrated to establish that they will work together' },
    { level: 5, name: 'Technology Validated in Relevant Environment', description: 'Large scale components integrated and tested in realistic environment' },
    { level: 6, name: 'Technology Demonstrated in Relevant Environment', description: 'Representative model or prototype system tested in relevant environment' },
    { level: 7, name: 'System Prototype Demonstration', description: 'Prototype near or at planned operational system' },
    { level: 8, name: 'System Complete and Qualified', description: 'Technology has been proven to work in its final form' },
    { level: 9, name: 'Actual System Proven in Operational Environment', description: 'Actual application of technology in its final form' },
  ];

  const updateStageCompletion = async (trlLevel: number, isCompleted: boolean) => {
    try {
      // First, check if stage exists
      const { data: existingStage } = await supabase
        .from('project_stages')
        .select('*')
        .eq('project_id', project.id)
        .eq('trl_level', trlLevel)
        .single();

      if (existingStage) {
        // Update existing stage
        const { error } = await supabase
          .from('project_stages')
          .update({
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            notes: stageNotes || existingStage.notes,
            evidence_url: evidenceUrl || existingStage.evidence_url,
          })
          .eq('id', existingStage.id);

        if (error) throw error;
      } else {
        // Create new stage
        const stageData = trlStages.find(s => s.level === trlLevel);
        const { error } = await supabase
          .from('project_stages')
          .insert({
            project_id: project.id,
            trl_level: trlLevel,
            stage_name: stageData?.name || `TRL ${trlLevel}`,
            description: stageData?.description || '',
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            notes: stageNotes,
            evidence_url: evidenceUrl,
          });

        if (error) throw error;
      }

      // Update project's current TRL level if this is the highest completed stage
      if (isCompleted) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            current_trl_level: Math.max(project.current_trl_level, trlLevel),
          })
          .eq('id', project.id);

        if (projectError) throw projectError;
      }

      toast.success('Stage updated successfully');
      setEditingStage(null);
      setStageNotes('');
      setEvidenceUrl('');
      onUpdate();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Failed to update stage');
    }
  };

  const getStageData = (trlLevel: number) => {
    return project.project_stages?.find((stage: any) => stage.trl_level === trlLevel);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>{project.title}</span>
          <Badge className={`${getStatusColor(project.status)} text-white`}>
            {project.status}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{project.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Category:</span> {project.category}
              </div>
              <div>
                <span className="font-medium">Current TRL:</span> Level {project.current_trl_level}/9
              </div>
              <div>
                <span className="font-medium">Impact Level:</span> 
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${
                    project.impact_level === 'very_high' ? 'border-red-500 text-red-700' :
                    project.impact_level === 'high' ? 'border-orange-500 text-orange-700' :
                    project.impact_level === 'medium' ? 'border-yellow-500 text-yellow-700' :
                    'border-gray-500 text-gray-700'
                  }`}
                >
                  {project.impact_level?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span className="font-medium">Started:</span> {new Date(project.start_date).toLocaleDateString()}
              </div>
              {project.expected_completion_date && (
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span className="font-medium">Expected Completion:</span> {new Date(project.expected_completion_date).toLocaleDateString()}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {getTRLProgress(project.current_trl_level).toFixed(0)}%
                </span>
              </div>
              <Progress value={getTRLProgress(project.current_trl_level)} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* TRL Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Technology Readiness Level (TRL) Stages</CardTitle>
            <CardDescription>
              Track your project's progress through the 9 TRL stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trlStages.map((stage) => {
                const stageData = getStageData(stage.level);
                const isCompleted = stageData?.is_completed || stage.level <= project.current_trl_level;
                const isEditing = editingStage === `${stage.level}`;

                return (
                  <div key={stage.level} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => updateStageCompletion(stage.level, !isCompleted)}
                          className="mt-1"
                          disabled={isEditing}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">
                            TRL {stage.level}: {stage.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                          
                          {stageData?.completed_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Completed: {new Date(stageData.completed_at).toLocaleDateString()}
                            </p>
                          )}
                          
                          {stageData?.notes && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">
                              <strong>Notes:</strong> {stageData.notes}
                            </p>
                          )}
                          
                          {stageData?.evidence_url && (
                            <a 
                              href={stageData.evidence_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-1 block"
                            >
                              View Evidence
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isEditing) {
                            setEditingStage(null);
                            setStageNotes('');
                            setEvidenceUrl('');
                          } else {
                            setEditingStage(`${stage.level}`);
                            setStageNotes(stageData?.notes || '');
                            setEvidenceUrl(stageData?.evidence_url || '');
                          }
                        }}
                      >
                        {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {isEditing && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        <div>
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            value={stageNotes}
                            onChange={(e) => setStageNotes(e.target.value)}
                            placeholder="Add notes about this stage..."
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Evidence URL</label>
                          <Input
                            value={evidenceUrl}
                            onChange={(e) => setEvidenceUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateStageCompletion(stage.level, true)}
                          >
                            <Save className="mr-1 h-4 w-4" />
                            Save & Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStageCompletion(stage.level, false)}
                          >
                            Save as Incomplete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <DocumentUpload projectId={project.id} />
      </div>
    </>
  );
};

export default ProjectDetails;