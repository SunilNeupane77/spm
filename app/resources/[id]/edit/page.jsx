'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useResource, useUpdateResource } from '@/lib/resourceHooks';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditResourcePage({ params }) {
  const resourceId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  
  // Get existing resource data
  const { data: existingResource, isLoading, error } = useResource(resourceId);
  const updateResource = useUpdateResource();
  
  // Form state
  const [resource, setResource] = useState({
    title: '',
    description: '',
    type: '',
    url: '',
    subject: '',
    topic: '',
    tags: [],
    course: '',
    isPublic: false
  });
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
  // Populate form when resource data is available
  useEffect(() => {
    if (existingResource) {
      setResource({
        title: existingResource.title || '',
        description: existingResource.description || '',
        type: existingResource.type || '',
        url: existingResource.url || '',
        subject: existingResource.subject || '',
        topic: existingResource.topic || '',
        tags: existingResource.tags || [],
        course: existingResource.course?._id || '',
        isPublic: existingResource.isPublic || false
      });
    }
  }, [existingResource]);
  
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
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a copy of the resource without empty fields
    const resourceData = { ...resource };
    
    // Remove empty fields
    Object.keys(resourceData).forEach(key => {
      if (resourceData[key] === '' || (Array.isArray(resourceData[key]) && resourceData[key].length === 0)) {
        delete resourceData[key];
      }
    });
    
    updateResource.mutate({ 
      id: resourceId, 
      updatedData: resourceData 
    }, {
      onSuccess: () => {
        toast({
          title: 'Resource updated',
          description: 'The resource has been successfully updated.',
        });
        router.push(`/resources/${resourceId}`);
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update resource',
          variant: 'destructive',
        });
      }
    });
  };
  
  // Update resource state
  const updateField = (field, value) => {
    setResource(prev => ({ ...prev, [field]: value }));
  };
  
  // Add a tag
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Don't add duplicate tags
    if (resource.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    
    setResource(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));
    setTagInput('');
  };
  
  // Remove a tag
  const removeTag = (tagToRemove) => {
    setResource(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-red-500 mb-4">Error loading resource.</p>
        <Button variant="outline" onClick={() => router.refresh()}>Try Again</Button>
      </div>
    );
  }
  
  if (!existingResource) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="mb-4">Resource not found.</p>
        <Button asChild variant="outline">
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>
    );
  }
  
  // Check if user is authorized to edit
  const isOwner = existingResource.owner && existingResource.owner._id === existingResource.userId;
  const canEdit = isOwner || (existingResource.sharedWith && existingResource.sharedWith.some(
    share => share.user._id === existingResource.userId && share.permission === 'edit'
  ));
  
  if (!canEdit) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="mb-4">You don't have permission to edit this resource.</p>
        <Button asChild variant="outline">
          <Link href={`/resources/${resourceId}`}>Back to Resource</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      {/* Navigation */}
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href={`/resources/${resourceId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resource
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Resource</CardTitle>
          <CardDescription>Update the details of your learning resource.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  placeholder="Enter resource title"
                  value={resource.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter resource description"
                  value={resource.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Resource Type</Label>
                  <Select
                    value={resource.type}
                    onValueChange={(value) => updateField('type', value)}
                    required
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      placeholder="https://example.com"
                      value={resource.url}
                      onChange={(e) => updateField('url', e.target.value)}
                      type="url"
                    />
                    {resource.url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Categorization */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Categorization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics"
                    value={resource.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Calculus"
                    value={resource.topic}
                    onChange={(e) => updateField('topic', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {resource.tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-secondary-foreground/70 hover:text-secondary-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={resource.course}
                  onValueChange={(value) => updateField('course', value)}
                >
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select a course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No course</SelectItem>
                    {courses?.map(course => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code ? `${course.code} - ${course.name}` : course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Settings */}
            {isOwner && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    <div>Public Resource</div>
                    <p className="text-sm text-muted-foreground">
                      Make this resource available to everyone
                    </p>
                  </Label>
                  <Switch
                    id="isPublic"
                    checked={resource.isPublic}
                    onCheckedChange={(checked) => updateField('isPublic', checked)}
                  />
                </div>
              </div>
            )}
            
            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/resources/${resourceId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateResource.isPending}
              >
                {updateResource.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
