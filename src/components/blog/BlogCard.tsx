
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export interface BlogPost {
  id: number | string;  // Support both number (static) and string (Supabase UUID)
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatarInitials: string;
  };
  date: string;
  readTime: string;
  imageUrl: string;
}

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col group">
      <Link to={`/blog/${post.id}`} className="block">
        <AspectRatio ratio={16/9} className="overflow-hidden bg-gray-100">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070';
            }}
          />
        </AspectRatio>
      </Link>
      <CardContent className="p-5 flex-grow">
        <div className="flex items-center mb-3 text-sm text-gray-500">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback className="bg-university-blue text-white text-xs">
              {post.author.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{post.author.name}</span>
          <span className="mx-2">•</span>
          <span>{post.date}</span>
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-university-blue line-clamp-2 group-hover:text-university-accent transition-colors">
          <Link to={`/blog/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
      </CardContent>
      <CardFooter className="px-5 py-3 border-t text-sm text-gray-500 flex justify-between items-center bg-gray-50">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{post.readTime}</span>
        </div>
        <Link to={`/blog/${post.id}`} className="text-university-blue hover:text-university-accent font-medium hover:underline">
          Read more
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BlogCard;
