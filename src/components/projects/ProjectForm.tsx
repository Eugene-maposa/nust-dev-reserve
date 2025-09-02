import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  current_trl_level: z.number().min(1).max(9),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']),
  start_date: z.date(),
  expected_completion_date: z.date().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSuccess, onCancel }) => {
  const { user } = useAuth();
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      category: project?.category || 'technology',
      current_trl_level: project?.current_trl_level || 1,
      status: project?.status || 'active',
      start_date: project?.start_date ? new Date(project.start_date) : new Date(),
      expected_completion_date: project?.expected_completion_date ? new Date(project.expected_completion_date) : undefined,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const projectData = {
        title: data.title,
        description: data.description,
        category: data.category,
        current_trl_level: data.current_trl_level,
        status: data.status,
        impact_level: project?.impact_level || 'low', // Keep existing or default to low
        user_id: user?.id!,
        start_date: data.start_date.toISOString().split('T')[0],
        expected_completion_date: data.expected_completion_date 
          ? data.expected_completion_date.toISOString().split('T')[0] 
          : null,
      };

      if (project) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);

        if (error) throw error;
        toast.success('Project updated successfully');
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();

        if (error) throw error;

        // Create initial TRL stages for the project
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

        const stagesData = trlStages.map(stage => ({
          project_id: newProject.id,
          trl_level: stage.level,
          stage_name: stage.name,
          description: stage.description,
          is_completed: stage.level <= data.current_trl_level,
          completed_at: stage.level <= data.current_trl_level ? new Date().toISOString() : null,
        }));

        const { error: stagesError } = await supabase
          .from('project_stages')
          .insert(stagesData);

        if (stagesError) throw stagesError;

        // Send project creation notification
        try {
          await supabase.functions.invoke('send-project-notifications', {
            body: {
              projectId: newProject.id,
              userId: user?.id,
             notificationType: 'project_created',
              message: `Your project "${data.title}" has been successfully created. Impact level will be determined by administrators.`
            }
          });
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }

        toast.success('Project created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your project..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="innovation">Innovation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="current_trl_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current TRL Level (1-9)</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select TRL level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        TRL {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />


          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_completion_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Completion (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {project ? 'Update' : 'Create'} Project
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default ProjectForm;