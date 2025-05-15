
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import BlogCard, { BlogPost } from '@/components/blog/BlogCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Fallback static blog posts data (used if Supabase fetch fails)
export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'New High-Performance Workstations Installed in Lab A',
    excerpt: 'The Software Development Centre has recently upgraded all workstations in Lab A with the latest high-performance computing systems to support advanced software development and research projects.',
    author: {
      name: 'Pro Eugene Maposa',
      avatarInitials: 'EM',
    },
    date: 'March 15, 2024',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  },
  {
    id: 2,
    title: 'Upcoming Workshop Series: Web Development Fundamentals',
    excerpt: 'Join us for a series of workshops covering HTML, CSS, JavaScript, and modern web frameworks. Perfect for beginners and those looking to refresh their skills.',
    author: {
      name: 'Dr Tatenda Ndoro',
      avatarInitials: 'TN',
    },
    date: 'March 20, 2024',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80',
  },
  {
    id: 3,
    title: 'Extended Hours During Exam Period',
    excerpt: 'The Software Development Centre will extend its operating hours during the upcoming exam period to provide students with additional access to resources and study spaces.',
    author: {
      name: 'Admin Team',
      avatarInitials: 'AT',
    },
    date: 'March 25, 2024',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  },
  {
    id: 4,
    title: 'Student Project Showcase: Innovations in AI',
    excerpt: 'Explore the remarkable AI projects developed by NUST students using the Software Development Centre resources. From machine learning applications to natural language processing solutions.',
    author: {
      name: 'Dr Noel Nklala',
      avatarInitials: 'NN',
    },
    date: 'April 1, 2024',
    readTime: '7 min read',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  },
  {
    id: 5,
    title: 'New Software Licenses Available for Student Projects',
    excerpt: 'The SDC has acquired new software licenses for industry-standard tools including Adobe Creative Suite, AutoCAD, and specialized development environments.',
    author: {
      name: 'Pro Eugene Maposa',
      avatarInitials: 'EM',
    },
    date: 'April 5, 2024',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  },
  {
    id: 6,
    title: 'Collaboration with Industry Partners for Student Internships',
    excerpt: 'NUST has established new partnerships with leading tech companies to provide internship opportunities for students who regularly use the Software Development Centre.',
    author: {
      name: 'Dr Tatenda Ndorho',
      avatarInitials: 'TN',
    },
    date: 'April 10, 2024',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  },
];

// Define the database blog post type with proper author type
export interface SupabaseBlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  author_id: string;
  author?: {
    id: string;
    name: string;
    avatar_initials: string;
  } | null;
}

// Function to fetch blog posts from Supabase
const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id, title, excerpt, content, image_url, created_at, updated_at, published, author_id,
      author:blog_authors(id, name, avatar_initials)
    `)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }

  // Transform data to match the BlogPost interface
  return (data as unknown as SupabaseBlogPost[]).map(post => {
    // Safely handle author data
    const authorData = post.author || { name: 'Unknown Author', avatar_initials: 'UA' };
    
    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      author: {
        name: typeof authorData === 'string' ? 'Unknown Author' : authorData.name || 'Unknown Author',
        avatarInitials: typeof authorData === 'string' ? 'UA' : authorData.avatar_initials || 'UA',
      },
      date: new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      readTime: '5 min read', // Default read time
      imageUrl: post.image_url,
    };
  });
};

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch blog posts using React Query
  const { data: supabasePosts, isLoading, error } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: fetchBlogPosts,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // If Supabase fetch fails, use the static blog posts data
  const posts = supabasePosts || blogPosts;
  
  // Show error toast if fetch fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Failed to fetch blog posts",
        description: "Using fallback data instead.",
        variant: "destructive",
      });
    }
  }, [error]);
  
  const filteredPosts = searchTerm
    ? posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : posts;

  return (
    <Layout>
      <PageHeader 
        title="Blog & Updates" 
        subtitle="Latest news and information from the Software Development Centre"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div className="w-full md:w-96 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search blog posts..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/blog/create">
            <Button className="w-full md:w-auto bg-university-blue hover:bg-university-blue/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded-lg mb-1"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-5/6 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded-full w-6"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or browse all posts.
            </p>
            <Button 
              className="mt-4 bg-university-blue hover:bg-university-blue/90"
              variant="outline"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
