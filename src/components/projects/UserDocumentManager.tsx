import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, Download, AlertCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface DocumentCategory {
  key: string;
  title: string;
  description: string;
  accepts: string;
  maxFiles: number;
}

const documentCategories: DocumentCategory[] = [
  {
    key: 'mou_moa',
    title: 'MOU/MOA Documents',
    description: 'Memorandum of Understanding or Agreement documents',
    accepts: '.pdf,.doc,.docx',
    maxFiles: 3
  },
  {
    key: 'patent_application',
    title: 'Patent Application Forms',
    description: 'Patent application and related forms',
    accepts: '.pdf,.doc,.docx',
    maxFiles: 5
  },
  {
    key: 'idf',
    title: 'Invention Disclosure Form (IDF)',
    description: 'Invention disclosure forms and documentation',
    accepts: '.pdf,.doc,.docx',
    maxFiles: 3
  },
  {
    key: 'project_docs',
    title: 'Project Documentation',
    description: 'General project documentation and reports',
    accepts: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
    maxFiles: 10
  }
];

interface UserDocumentManagerProps {
  projectId?: string;
}

const UserDocumentManager: React.FC<UserDocumentManagerProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: documents = [], refetch } = useQuery({
    queryKey: ['user-documents', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('project_documents')
        .select('*')
        .eq('user_id', user.id);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: DocumentCategory) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const categoryDocs = documents.filter(doc => doc.file_path.includes(`/${category.key}/`));
    if (categoryDocs.length + files.length > category.maxFiles) {
      toast.error(`Maximum ${category.maxFiles} documents allowed for ${category.title}`);
      return;
    }

    setUploading(category.key);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create organized folder structure: user-id/category/project-id/filename
        const folderPath = projectId 
          ? `${user?.id}/${category.key}/${projectId}`
          : `${user?.id}/${category.key}/general`;
        const fileName = `${folderPath}/${Date.now()}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Save document metadata to database
        const { error: dbError } = await supabase
          .from('project_documents')
          .insert({
            project_id: projectId || 'general',
            user_id: user?.id!,
            file_name: file.name,
            file_path: uploadData.path,
            file_type: file.type,
            file_size: file.size,
          });

        if (dbError) throw dbError;

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`${files.length} document(s) uploaded to ${category.title}`);
      refetch();
      
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

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

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast.success('Document deleted successfully');
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentsByCategory = (category: string) => {
    return documents.filter(doc => doc.file_path.includes(`/${category}/`));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Document Management</h2>
        <Badge variant="outline">
          Total Documents: {documents.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentCategories.map((category) => {
          const categoryDocs = getDocumentsByCategory(category.key);
          const isUploading = uploading === category.key;

          return (
            <Card key={category.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {category.title}
                  </span>
                  <Badge variant="secondary">
                    {categoryDocs.length}/{category.maxFiles}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2">
                      <Label htmlFor={`file-upload-${category.key}`} className="cursor-pointer">
                        <span className="text-sm font-medium text-primary hover:text-primary/80">
                          Upload documents
                        </span>
                        <Input
                          id={`file-upload-${category.key}`}
                          type="file"
                          multiple
                          accept={category.accepts}
                          onChange={(e) => handleFileUpload(e, category)}
                          disabled={isUploading || categoryDocs.length >= category.maxFiles}
                          className="hidden"
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.accepts.replace(/\./g, '').toUpperCase()} up to 10MB each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* Documents List */}
                {categoryDocs.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Uploaded Documents</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {categoryDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                              {doc.admin_comments && (
                                <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>Admin commented</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(doc.id, doc.file_path)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {categoryDocs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No documents uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin Comments Section */}
      {documents.some(doc => doc.admin_comments) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Admin Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents
                .filter(doc => doc.admin_comments)
                .map((doc) => (
                  <div key={doc.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{doc.file_name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Comment by Admin • 
                          {doc.comment_updated_at ? new Date(doc.comment_updated_at).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-sm">{doc.admin_comments}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserDocumentManager;