
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define the form validation schema using Zod
const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  excerpt: z.string().min(10, {
    message: 'Excerpt must be at least 10 characters.',
  }),
  content: z.string().min(20, {
    message: 'Content must be at least 20 characters.',
  }),
  image_url: z.string().url({
    message: 'Please enter a valid URL.',
  }),
  author_name: z.string().min(2, {
    message: 'Author name must be at least 2 characters.',
  }),
});

// Define the form values type based on the schema
type FormValues = z.infer<typeof formSchema>;

// Function to fetch a single blog post for editing
const fetchPost = async (id: string) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_authors (
        id,
        name,
        avatar_initials
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching blog post:', error);
    throw error;
  }

  return data;
};

const BlogForm = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  // Fetch blog post data if editing
  const { data: post } = useQuery({
    queryKey: ['blogPost', id],
    queryFn: () => fetchPost(id!),
    enabled: isEditing,
    retry: 1,
    meta: {
      onSettled: (data: any, error: Error | null) => {
        if (error) {
          console.error('Error fetching post:', error);
          toast.error('Failed to fetch blog post');
          navigate('/blog');
        }
      }
    }
  });

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      image_url: '',
      author_name: '',
    },
    mode: 'onChange',
  });

  React.useEffect(() => {
    setIsMounted(true);
    if (post) {
      form.reset({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        image_url: post.image_url,
        author_name: post.blog_authors?.name || '',
      });
    }
  }, [post, form]);

  // Create or update blog post
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        // Update existing post
        const { error } = await supabase
          .from('blog_posts')
          .update({
            title: values.title,
            excerpt: values.excerpt,
            content: values.content,
            image_url: values.image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', id!);
          
        if (error) throw error;
        
        // Update author info if needed
        if (post?.author_id) {
          await supabase
            .from('blog_authors')
            .update({
              name: values.author_name,
              avatar_initials: values.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            })
            .eq('id', post.author_id);
        }
        
        return id;
      } else {
        // Create new author first
        const { data: authorData, error: authorError } = await supabase
          .from('blog_authors')
          .insert({
            name: values.author_name,
            avatar_initials: values.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          })
          .select('id')
          .single();
          
        if (authorError) throw authorError;
        
        // Create new post
        const { data, error } = await supabase
          .from('blog_posts')
          .insert({
            title: values.title,
            excerpt: values.excerpt,
            content: values.content,
            image_url: values.image_url,
            author_id: authorData.id,
            published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPost', id] });
      toast.success(isEditing ? 'Blog post updated!' : 'Blog post created!');
      navigate(`/blog/${id}`);
    },
    onError: (error) => {
      console.error('Error saving blog post:', error);
      toast.error('Failed to save blog post');
    }
  });

  const handleSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Layout>
      <PageHeader title={isEditing ? 'Edit Blog Post' : 'Create Blog Post'} />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Blog Post" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                          placeholder="A brief summary of the blog post"
                          className="resize-none"
                          {...field}
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
                          placeholder="The main content of the blog post"
                          className="resize-none h-80"
                          {...field}
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
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="URL of the blog post image" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : 'Save Post'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BlogForm;
