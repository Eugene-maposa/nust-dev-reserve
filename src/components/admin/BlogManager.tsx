import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { seedBlogData } from '@/utils/seedBlogData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Plus, Edit, Trash2, Eye, RefreshCw, Upload } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  author?: {
    id: string;
    name: string;
    avatar_initials: string;
  };
}

interface BlogAuthor {
  id: string;
  name: string;
  avatar_initials: string;
  bio?: string;
  user_id?: string;
}

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  published: boolean;
  author_id: string;
  publisher: string;
}

const BlogManager: React.FC = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    published: false,
    author_id: '',
    publisher: ''
  });

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedBlogData();
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully seeded ${result.count} blog posts`,
        });
        await fetchData(); // Refresh the list
      } else {
        throw new Error('Seeding failed');
      }
    } catch (error) {
      console.error('Error seeding blog data:', error);
      toast({
        title: "Error",
        description: "Failed to seed blog data. Posts may already exist.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchPosts(), fetchAuthors()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load blog data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      // First fetch all posts (both published and unpublished for admin)
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          id, title, excerpt, content, image_url, published, created_at, updated_at, author_id
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      // Fetch all authors
      const { data: authorsData, error: authorsError } = await supabase
        .from('blog_authors')
        .select('*');

      if (authorsError) {
        console.error('Error fetching authors:', authorsError);
        throw authorsError;
      }

      // Map posts with their authors
      const postsWithAuthors = (postsData || []).map(post => ({
        ...post,
        author: authorsData?.find(author => author.id === post.author_id)
      }));

      console.log('Fetched posts:', postsWithAuthors);
      setPosts(postsWithAuthors as BlogPost[]);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      throw error;
    }
  };

  const fetchAuthors = async () => {
    const { data, error } = await supabase
      .from('blog_authors')
      .select('*')
      .order('name');

    if (error) throw error;
    setAuthors(data || []);
  };

  const filterPosts = () => {
    let filtered = posts;
    if (searchQuery) {
      filtered = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPosts(filtered);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      image_url: '',
      published: false,
      author_id: '',
      publisher: ''
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `blog-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Check if we need to create an author first
      let authorId = formData.author_id;
      
      if (!authorId && formData.publisher) {
        console.log('Creating new author for publisher:', formData.publisher);
        // Create a new author for this publisher
        const { data: newAuthor, error: authorError } = await supabase
          .from('blog_authors')
          .insert([{
            name: formData.publisher,
            avatar_initials: formData.publisher.substring(0, 2).toUpperCase(),
            bio: `Admin author: ${formData.publisher}`,
            user_id: null // This allows admin to create publisher authors
          }])
          .select()
          .single();
          
        if (authorError) {
          console.error('Error creating author:', authorError);
          throw authorError;
        }
        
        authorId = newAuthor.id;
        console.log('Created new author with ID:', authorId);
        
        // Refresh authors list
        await fetchAuthors();
      }
      
      if (!authorId) {
        throw new Error('Author is required. Please select an author or enter a publisher name.');
      }

      console.log('Creating blog post with author ID:', authorId);
      const { error } = await supabase
        .from('blog_posts')
        .insert([{
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          image_url: formData.image_url,
          published: formData.published,
          author_id: authorId
        }]);

      if (error) {
        console.error('Error creating blog post:', error);
        throw error;
      }

      toast({
        title: "Post Created",
        description: "Blog post created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create blog post",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image_url: post.image_url,
      published: post.published,
      author_id: post.author_id,
      publisher: post.author?.name || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPost) return;

    try {
      // Update blog post
      const { error: postError } = await supabase
        .from('blog_posts')
        .update({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          image_url: formData.image_url,
          published: formData.published,
          author_id: formData.author_id
        })
        .eq('id', editingPost.id);

      if (postError) throw postError;

      // Update author info if author_id is set
      if (formData.author_id && formData.publisher) {
        await supabase
          .from('blog_authors')
          .update({
            name: formData.publisher,
            avatar_initials: formData.publisher.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          })
          .eq('id', formData.author_id);
      }

      toast({
        title: "Post Updated",
        description: "Blog post updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingPost(null);
      resetForm();
      await fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update blog post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: "Blog post deleted successfully",
      });

      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ published: !post.published })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: post.published ? "Post Unpublished" : "Post Published",
        description: `Blog post ${post.published ? 'unpublished' : 'published'} successfully`,
      });

      fetchPosts();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Blog Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Blog Management ({filteredPosts.length} posts)</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              disabled={isSeeding}
            >
              <Upload className={`h-4 w-4 mr-2 ${isSeeding ? 'animate-pulse' : ''}`} />
              {isSeeding ? 'Seeding...' : 'Seed Blog Data'}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Blog Post</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter post title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Enter post excerpt"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter post content"
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL or Upload</Label>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Option 1: Paste an image URL</p>
                        <Input
                          id="image_url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Option 2: Upload an image file</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                        />
                        {uploadingImage && <p className="text-sm text-muted-foreground">Uploading image...</p>}
                      </div>
                      {formData.image_url && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                          <img 
                            src={formData.image_url} 
                            alt="Blog preview" 
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Select value={formData.author_id} onValueChange={(value) => setFormData({ ...formData, author_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors.map(author => (
                          <SelectItem key={author.id} value={author.id}>
                            {author.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="publisher">Or Enter Publisher Name</Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="Enter publisher name (if no author selected)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                    />
                    <Label htmlFor="published">Published</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    Create Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070';
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {post.excerpt}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.author?.name || 'Unknown Author'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "outline"}>
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(post.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(post.updated_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublished(post)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{post.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(post.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No posts match your search criteria' : 'No blog posts found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-excerpt">Excerpt</Label>
                <Textarea
                  id="edit-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="edit-image">Blog Image</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Option 1: Paste an image URL</p>
                    <Input
                      id="edit-image"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Option 2: Upload an image file</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                    />
                    {uploadingImage && <p className="text-sm text-muted-foreground">Uploading image...</p>}
                  </div>
                  {formData.image_url && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                      <img 
                        src={formData.image_url} 
                        alt="Blog preview" 
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-author">Author</Label>
                <Select value={formData.author_id} onValueChange={(value) => setFormData({ ...formData, author_id: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map(author => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-publisher">Publisher Name</Label>
                <Input
                  id="edit-publisher"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="Publisher name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="edit-published">Published</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Update Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BlogManager;