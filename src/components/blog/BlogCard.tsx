import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from 'lucide-react';

export interface BlogPost {
  id: number;
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <Link to={`/blog/${post.id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        </div>
      </Link>
      <CardContent className="p-4 flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-university-blue line-clamp-2">
          <Link to={`/blog/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500 flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback className="bg-university-blue text-white text-xs">
              {post.author.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <span>{post.author.name}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{post.date} • {post.readTime}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BlogCard;
