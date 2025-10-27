import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface DocumentUploadProps {
  projectId: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: documents = [], refetch } = useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select(`
          *,
          commented_by_profile:user_profiles!project_documents_commented_by_fkey(full_name)
        `)
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (documents.length + files.length > 15) {
      toast.error('Maximum 15 documents allowed per project');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create folder structure: project-id/user-id/filename
        const fileName = `${projectId}/${user?.id}/${Date.now()}-${file.name}`;
        
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
            project_id: projectId,
            user_id: user?.id!,
            file_name: file.name,
            file_path: uploadData.path,
            file_type: file.type,
            file_size: file.size,
          });

        if (dbError) throw dbError;

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`${files.length} document(s) uploaded successfully`);
      refetch();
      
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
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
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (documentId: string, filePath: string) => {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Project Documents ({documents.length}/15)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-primary hover:text-primary/80">
                  Click to upload documents
                </span>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading || documents.length >= 15}
                  className="hidden"
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB each
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Documents</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_size ? formatFileSize(doc.file_size) + ' • ' : ''}{new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
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
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;