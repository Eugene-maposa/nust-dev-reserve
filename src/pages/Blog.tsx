import React from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/ui/PageHeader';
import BlogCard, { BlogPost } from '@/components/blog/BlogCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

// Sample blog posts data (this should be moved to a separate data file or fetched from an API)
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

const Blog = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredPosts = searchTerm
    ? blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : blogPosts;

  return (
    <Layout>
      <PageHeader 
        title="Blog & Updates" 
        subtitle="Latest news and information from the Software Development Centre"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search blog posts..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or browse all posts.
              </p>
              <Button 
                className="mt-4"
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
