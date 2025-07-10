'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, ExternalLink, File, FileText, Globe, Plus, Trash2, Video } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

export default function CourseResourcesPage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newResource, setNewResource] = useState({
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
  
  // Fetch resources
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', { course: courseId }],
    queryFn: async () => {
      const response = await fetch(`/api/resources?course=${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      return response.json();
    },
  });
  
  // Create resource mutation
  const createResource = useMutation({
    mutationFn: async (data) => {
      // If we have a file, upload it first
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        
        const { url } = await uploadResponse.json();
        data.url = url;
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
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Resource added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add resource",
        variant: "destructive",
      });
    }
  });
  
  // Delete resource mutation
  const deleteResource = useMutation({
    mutationFn: async (resourceId) => {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', { course: courseId }] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    }
  });
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      // Automatically set the title if it's empty
      if (!newResource.title) {
        setNewResource({
          ...newResource,
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
      
      setNewResource({
        ...newResource,
        type
      });
    }
  };
  
  const handleAddResource = (e) => {
    e.preventDefault();
    createResource.mutate(newResource);
  };
  
  const handleDeleteResource = (resourceId) => {
    deleteResource.mutate(resourceId);
  };
  
  const resetForm = () => {
    setNewResource({
      title: '',
      description: '',
      url: '',
      type: 'document'
    });
    setFileToUpload(null);
    setUploadProgress(0);
  };
  
  // Filter resources based on active filter
  const filteredResources = resources?.filter(resource => {
    if (activeFilter === 'all') return true;
    return resource.type === activeFilter;
  });
  
  // Resource type icon mapping
  const getResourceIcon = (type) => {
    switch (type) {
      case 'document':
        return <FileText className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'link':
        return <Globe className="h-6 w-6" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push(`/courses/${courseId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Course Resources</h1>
            <p className="text-muted-foreground">{course?.name} ({course?.code})</p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>
      
      {/* Resource Filters */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="document">Documents</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="link">Links</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Resources List */}
      {error ? (
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">Error loading resources.</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['resources', { course: courseId }] })}>
            Try again
          </Button>
        </div>
      ) : !resources || resources.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <File className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-1">No resources yet</h3>
          <p className="text-muted-foreground mb-4">Add study materials, lectures, and useful links for this course</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      ) : !filteredResources || filteredResources.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <h3 className="text-lg font-medium mb-1">No resources match the selected filter</h3>
          <Button variant="outline" onClick={() => setActiveFilter('all')} className="mt-4">
            Show all resources
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource._id} className="overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{resource.description}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={resource.url} target="_blank" rel="noopener noreferrer">
                    {resource.type === 'link' ? (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteResource(resource._id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { 
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>
              Upload a file or link to external resources for your course.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddResource}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newResource.title}
                  onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                  placeholder="Lecture Notes - Week 1"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Resource Type</Label>
                <Select 
                  value={newResource.type} 
                  onValueChange={(value) => setNewResource({...newResource, type: value})}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={newResource.description}
                  onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                  placeholder="Brief description of this resource"
                />
              </div>
              
              {newResource.type === 'link' ? (
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    placeholder="https://example.com/resource"
                    type="url"
                    required
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="file">Upload File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      required={!newResource.url}
                    />
                  </div>
                  {fileToUpload && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {fileToUpload.name} ({Math.round(fileToUpload.size / 1024)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createResource.isPending}>
                {createResource.isPending ? 'Adding...' : 'Add Resource'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
