
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  excerpt: z.string().min(20, 'Excerpt must be at least 20 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  image_url: z.string().url('Please enter a valid URL'),
});

type FormValues = z.infer<typeof formSchema>;

// Fetch existing post for editing
const fetchBlogPost = async (id: string) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Get current user's author profile
const fetchAuthorProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Check if author profile exists
  const { data, error } = await supabase
    .from('blog_authors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
    
  if (error) throw error;
  
  // If no profile exists, create one
  if (!data) {
    const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'AU';
    
    const { data: newAuthor, error: createError } = await supabase
      .from('blog_authors')
      .insert({
        user_id: user.id,
        name: user.email?.split('@')[0] || 'Anonymous User',
        avatar_initials: initials,
      })
      .select()
      .single();
      
    if (createError) throw createError;
    return newAuthor;
  }
  
  return data;
};

const BlogForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  // Get current user's author profile
  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ['authorProfile'],
    queryFn: fetchAuthorProfile,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching author profile:', error);
      toast.error('You need to be logged in to create or edit blog posts');
      navigate('/login');
    }
  });

  // Fetch post data if editing
  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ['blogPost', id],
    queryFn: () => fetchBlogPost(id!),
    enabled: isEditing,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching post:', error);
      toast.error('Failed to fetch blog post');
      navigate('/blog');
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      image_url: '',
    },
    values: postData,
  });

  // Create or update blog post
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!author) throw new Error('No author profile found');
      
      const postData = {
        ...values,
        author_id: author.id,
        published: true,
      };
      
      if (isEditing) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id!);
          
        if (error) throw error;
        return id;
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select('id')
          .single();
          
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['blogPost', id] });
      }
      
      toast.success(`Blog post ${isEditing ? 'updated' : 'created'} successfully`);
      navigate(`/blog/${postId}`);
    },
    onError: (error) => {
      console.error('Error saving blog post:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} blog post`);
    }
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const isLoading = authorLoading || postLoading || mutation.isPending;

  return (
    <Layout>
      <PageHeader 
        title={isEditing ? 'Edit Blog Post' : 'Create Blog Post'} 
        subtitle={isEditing ? 'Update your existing blog post' : 'Share your thoughts with the community'}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/blog')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a short excerpt/summary of your post" 
                        {...field} 
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your blog post content here" 
                        {...field} 
                        className="min-h-[250px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter image URL (e.g., https://example.com/image.jpg)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? (
                    <div className="flex items-center">
                      <span className="animate-spin mr-2">●</span>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Update Post' : 'Create Post'}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default BlogForm;
