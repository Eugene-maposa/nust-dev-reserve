import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, MessageCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DocumentManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['all-project-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select(`
          *,
          project:projects(title, user_id),
          user_profile:user_profiles!project_documents_user_id_fkey(full_name, email),
          commented_by_profile:user_profiles!project_documents_commented_by_fkey(full_name)
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleAddComment = (document: any) => {
    setSelectedDocument(document);
    setComment(document.admin_comments || '');
    setIsCommentDialogOpen(true);
  };

  const handleSaveComment = async () => {
    if (!selectedDocument || !user) return;

    try {
      const { error } = await supabase
        .from('project_documents')
        .update({
          admin_comments: comment.trim() || null,
          commented_by: comment.trim() ? user.id : null,
        })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      toast.success('Comment saved successfully');
      setIsCommentDialogOpen(false);
      setSelectedDocument(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['all-project-documents'] });
    } catch (error) {
      console.error('Error saving comment:', error);
      toast.error('Failed to save comment');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Management ({documents.length} documents)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{doc.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.project?.title || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{doc.user_profile?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{doc.user_profile?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {doc.admin_comments ? (
                        <Badge variant="default" className="bg-orange-100 text-orange-800">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Commented
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending Review</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddComment(doc)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Comment Dialog */}
        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Document Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDocument && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium">{selectedDocument.file_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Project: {selectedDocument.project?.title || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded by: {selectedDocument.user_profile?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Size: {formatFileSize(selectedDocument.file_size)}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Admin Comment</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your review comment here... Leave empty to remove existing comment."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This comment will be visible to the user who uploaded the document.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCommentDialogOpen(false);
                    setSelectedDocument(null);
                    setComment('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveComment}>
                  Save Comment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DocumentManager;