
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, ArrowLeft, Trash, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { blogPosts } from '@/pages/Blog';

interface Author {
  id: string;
  name: string;
  avatar_initials: string;
}

interface BlogPostData {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  published: boolean;
  author: Author[] | null;
  // Additional fields for display
  date: string;
  readTime: string;
}

const fetchBlogPost = async (id: string): Promise<BlogPostData> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(
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

  // Add formatted date and read time
  const formattedData = {
    ...data,
    date: new Date(data.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    readTime: '5 min read'
  };

  return formattedData as unknown as BlogPostData;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blogPost', id],
    queryFn: () => fetchBlogPost(id!),
    enabled: !!id,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fallback to static data if there's an error or no id
  const fallbackPost = !id ? undefined : blogPosts.find(p => p.id === Number(id));

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Blog post deleted successfully');
      navigate('/blog');
    } catch (err) {
      console.error('Error deleting blog post:', err);
      toast.error('Failed to delete blog post');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <PageHeader title="Loading..." />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // If not found in Supabase, try fallback
  const displayPost = post || fallbackPost;

  if (!displayPost) {
    return (
      <Layout>
        <PageHeader 
          title="Blog Post Not Found" 
          subtitle="The requested blog post could not be found"
        />
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">404 - Post Not Found</h1>
              <p className="text-gray-600 mb-6">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/blog">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Format date for display
  const formattedDate = post?.date || displayPost?.date || '';
  const readTime = post?.readTime || displayPost?.readTime || '5 min read';

  return (
    <Layout>
      <PageHeader 
        title={displayPost.title}
        subtitle={`Posted on ${formattedDate} • ${readTime}`}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <Link to="/blog">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Button>
              </Link>
              
              {post && (
                <div className="flex gap-2">
                  <Link to={`/blog/edit/${post.id}`}>
                    <Button variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
            
            <div className="relative h-[400px] rounded-lg overflow-hidden mb-8">
              <img 
                src={post?.image_url || (displayPost as any).imageUrl}
                alt={displayPost.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-university-blue text-white">
                    {post?.author?.[0]?.avatar_initials || (displayPost as any).author?.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post?.author?.[0]?.name || (displayPost as any).author?.name}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formattedDate}</span>
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{readTime}</span>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {displayPost.excerpt}
                  </p>
                  <div className="text-lg text-gray-700 leading-relaxed mt-4">
                    {post?.content || (
                      <>
                        <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogDetail;
