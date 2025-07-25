'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAddResource } from '@/lib/resourceHooks';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ResourceUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const addResource = useAddResource();
  
  // Form state
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [course, setCourse] = useState('none');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // Fetch courses for the dropdown
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    }
  });
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Auto-fill title if empty
    if (!title) {
      // Remove extension from filename for the title
      const fileTitle = file.name.replace(/\.[^/.]+$/, "");
      setTitle(fileTitle);
    }
    
    // Set file preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Show uploading toast
      toast({
        title: 'Uploading file',
        description: 'Please wait while your file uploads...',
      });
      
      // Upload file first
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.details || errorData.error || 'Failed to upload file');
      }
      
      const uploadData = await uploadResponse.json();
      
      // Determine resource type based on file MIME type and extension
      // If no MIME type, use extension
      let type = 'document';
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // First check MIME type for better accuracy
      if (selectedFile.type.startsWith('image/')) {
        type = 'image';
      } else if (selectedFile.type.startsWith('video/')) {
        type = 'video';
      } else if (selectedFile.type === 'application/pdf') {
        type = 'document';
      } else if (fileExt) {
        // Fallback to extension-based detection
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
          type = 'image';
        } else if (['mp4', 'webm', 'mov', 'avi'].includes(fileExt)) {
          type = 'video';
        } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileExt)) {
          type = 'document';
        } else if (['xls', 'xlsx', 'csv'].includes(fileExt)) {
          type = 'document';
        } else if (['ppt', 'pptx'].includes(fileExt)) {
          type = 'document';
        } else {
          type = 'other';
        }
      }
      
      // Now create the resource with the uploaded file URL
      const resourceData = {
        title,
        description,
        subject,
        type,
        fileUrl: uploadData.url,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        cloudinary: {
          publicId: uploadData.publicId,
          resourceType: uploadData.resourceType,
          format: uploadData.format
        },
        isPublic
      };
      
      // Add course if selected and not 'none'
      if (course && course !== 'none') {
        resourceData.course = course;
      }
      
      // Create resource
      addResource.mutate(resourceData, {
        onSuccess: () => {
          toast({
            title: 'File uploaded successfully',
            description: 'Your file has been uploaded and resource created.',
          });
          router.push('/resources');
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to create resource',
            variant: 'destructive',
          });
          setUploading(false);
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Provide more helpful error messages based on common issues
      let errorMessage = error.message || 'There was an error uploading your file';
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('size')) {
        errorMessage = 'File size exceeds the limit. Please upload a smaller file (max 20MB).';
      } else if (error.message.includes('authentication') || error.message.includes('credentials')) {
        errorMessage = 'Server configuration error. Please contact the administrator.';
      }
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setUploading(false);
    }
  };
  
  return (
    <div>
      {/* Navigation */}
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href="/resources">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Resource File</CardTitle>
          <CardDescription>
            Upload a file to create a new resource. Supported file types: PDF, DOC, DOCX, TXT, images, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              
              {!selectedFile ? (
                <div>
                  <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="file-upload" className="block cursor-pointer">
                    <div className="text-primary hover:underline">
                      Click to select a file
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      or drag and drop
                    </p>
                  </Label>
                </div>
              ) : (
                <div>
                  {filePreview ? (
                    <div className="mx-auto w-48 h-48 mb-4 border rounded-md overflow-hidden">
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <FileText className="h-10 w-10 mx-auto text-primary mb-4" />
                  )}
                  
                  <div className="text-lg font-medium mb-1">
                    {selectedFile.name}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    disabled={uploading}
                  >
                    Change File
                  </Button>
                </div>
              )}
            </div>
            
            {/* Resource Details */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this resource"
                  disabled={uploading}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description"
                  disabled={uploading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Mathematics"
                    disabled={uploading}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="course">Course (Optional)</Label>
                  <Select
                    value={course}
                    onValueChange={setCourse}
                    disabled={uploading}
                  >
                    <SelectTrigger id="course">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No course</SelectItem>
                      {courses?.map(course => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.code ? `${course.code} - ${course.name}` : course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Settings */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic" className="cursor-pointer">
                  <div>Public Resource</div>
                  <p className="text-sm text-muted-foreground">
                    Make this resource available to everyone
                  </p>
                </Label>
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={uploading}
                />
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/resources')}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || !selectedFile}
              >
                {uploading ? 'Uploading...' : 'Upload and Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
