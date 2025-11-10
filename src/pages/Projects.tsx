import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, Calendar, Target } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ProjectForm from '@/components/projects/ProjectForm';
import ProjectDetails from '@/components/projects/ProjectDetails';

const Projects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      console.log('Fetching projects for user:', user?.id);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_stages!project_stages_project_id_fkey (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        throw error;
      }
      
      console.log('Projects fetched successfully:', data);
      return data || [];
    },
    enabled: !!user,
  });

  // Real-time subscription for projects
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted successfully');
      refetch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impactLevel: string) => {
    switch (impactLevel) {
      case 'very_high': return 'border-red-500 bg-red-50 text-red-700';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-700';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-gray-500 bg-gray-50 text-gray-700';
      default: return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  const getTRLProgress = (currentLevel: number) => {
    return (currentLevel / 9) * 100;
  };

  // Filter projects based on status
  const filteredProjects = projects.filter((project) => {
    if (statusFilter === 'all') return true;
    return project.status === statusFilter;
  });

  if (isLoading) {
    return (
      <Layout>
        <PageHeader title="Projects" subtitle="Manage your innovation projects and track TRL progress" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading projects...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Projects" subtitle="Manage your innovation projects and track TRL progress" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">My Projects</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProject(null)} className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ProjectForm 
                project={editingProject}
                onSuccess={() => {
                  setIsFormOpen(false);
                  setEditingProject(null);
                  refetch();
                }}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingProject(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-secondary">
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Active
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger 
                value="paused"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Paused
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Cancelled
              </TabsTrigger>
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === 'all' ? 'No projects yet' : `No ${statusFilter} projects`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'all' 
                  ? 'Start your innovation journey by creating your first project.'
                  : `You don't have any ${statusFilter} projects at the moment.`
                }
              </p>
              {statusFilter === 'all' && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(project.status)} text-white`}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                     <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">TRL Level</span>
                        <span className="text-sm text-muted-foreground">
                          Level {project.trl_level || 1}/9
                        </span>
                      </div>
                      <Progress value={getTRLProgress(project.trl_level || 1)} className="h-2" />
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      Started: {new Date(project.start_date).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingProject(project);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedProject && (
          <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <ProjectDetails 
                project={selectedProject} 
                onClose={() => setSelectedProject(null)}
                onUpdate={refetch}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default Projects;