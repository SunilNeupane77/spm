'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileUp, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

export default function NewResourcePage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [resourceType, setResourceType] = useState('document');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'document'
  });
  
  // Fetch course data
  const { data: course } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      return response.json();
    },
  });
  
  // Create resource mutation
  const createResource = useMutation({
    mutationFn: async (data) => {
      // If we have a file, upload it first
      if (fileToUpload) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        
        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
          }
          
          const { url } = await uploadResponse.json();
          data.url = url;
        } catch (error) {
          throw new Error('File upload failed');
        } finally {
          setIsUploading(false);
        }
      }
      
      // Then create the resource
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, course: courseId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create resource');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', { course: courseId }] });
      toast({
        title: "Success",
        description: "Resource added successfully",
      });
      router.push(`/courses/${courseId}/resources`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add resource",
        variant: "destructive",
      });
    }
  });
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      // Automatically set the title if it's empty
      if (!formData.title) {
        setFormData({
          ...formData,
          title: file.name.split('.')[0]
        });
      }
      
      // Set the type based on file extension
      const extension = file.name.split('.').pop().toLowerCase();
      let type = 'document';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        type = 'image';
      } else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
        type = 'video';
      } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
        type = 'document';
      }
      
      setFormData({
        ...formData,
        type
      });
      setResourceType(type);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    createResource.mutate(formData);
  };
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push(`/courses/${courseId}/resources`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Resource</h1>
          <p className="text-muted-foreground">{course?.name}</p>
        </div>
      </div>
      
      {/* Resource Type Selection */}
      <div className="mb-6">
        <Label className="mb-2 block">Resource Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer ${resourceType === 'document' ? 'border-primary ring-2 ring-primary/20' : ''}`}
            onClick={() => {
              setResourceType('document');
              setFormData({ ...formData, type: 'document' });
            }}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <FileUp className="h-12 w-12 mb-2 text-primary" />
              <CardTitle className="mb-1">Upload File</CardTitle>
              <p className="text-muted-foreground">Upload documents, presentations, images, or other files</p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer ${resourceType === 'link' ? 'border-primary ring-2 ring-primary/20' : ''}`}
            onClick={() => {
              setResourceType('link');
              setFormData({ ...formData, type: 'link' });
            }}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <LinkIcon className="h-12 w-12 mb-2 text-primary" />
              <CardTitle className="mb-1">External Link</CardTitle>
              <p className="text-muted-foreground">Link to websites, videos, articles or other online resources</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Resource Form */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Lecture Notes - Week 1"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this resource"
              />
            </div>
            
            {resourceType === 'link' ? (
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://example.com/resource"
                  type="url"
                  required
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  required={!formData.url}
                />
                {fileToUpload && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {fileToUpload.name} ({Math.round(fileToUpload.size / 1024)} KB)
                  </p>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/courses/${courseId}/resources`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createResource.isPending || isUploading}
            >
              {createResource.isPending || isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                  {isUploading ? 'Uploading...' : 'Adding...'}
                </>
              ) : 'Add Resource'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
