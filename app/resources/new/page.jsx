'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAddResource } from '@/lib/resourceHooks';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const addResource = useAddResource();
  
  // Form state
  const [resource, setResource] = useState({
    title: '',
    description: '',
    type: '',
    url: '',
    subject: '',
    topic: '',
    tags: [],
    course: 'none',
    isPublic: false
  });
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
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
    
    // Handle 'none' value for course field
    if (resourceData.course === 'none') {
      delete resourceData.course;
    }
    
    // Remove empty fields
    Object.keys(resourceData).forEach(key => {
      if (resourceData[key] === '' || (Array.isArray(resourceData[key]) && resourceData[key].length === 0)) {
        delete resourceData[key];
      }
    });
    
    addResource.mutate(resourceData, {
      onSuccess: () => {
        toast({
          title: 'Resource created',
          description: 'The resource has been successfully created.',
        });
        router.push('/resources');
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create resource',
          variant: 'destructive',
        });
      }
    });
  };
  
  // Update resource state
  const updateResource = (field, value) => {
    setResource(prev => ({ ...prev, [field]: value }));
  };
  
  // Add a tag
  // tag addition logic
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
  
  return (
    <div>
      {/* Navigation */}
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href="/resources">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Link>
      </Button>
      // Card for the form
      <Card>
        <CardHeader>
          <CardTitle>Add New Resource</CardTitle>
          <CardDescription>Create a new learning resource to share with others.</CardDescription>
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
                  onChange={(e) => updateResource('title', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter resource description"
                  value={resource.description}
                  onChange={(e) => updateResource('description', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Resource Type</Label>
                  <Select
                    value={resource.type}
                    onValueChange={(value) => updateResource('type', value)}
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
                      onChange={(e) => updateResource('url', e.target.value)}
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
                    onChange={(e) => updateResource('subject', e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Calculus"
                    value={resource.topic}
                    onChange={(e) => updateResource('topic', e.target.value)}
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
                  onValueChange={(value) => updateResource('course', value)}
                >
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select a course (optional)" />
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
            
            {/* Settings */}
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
                  onCheckedChange={(checked) => updateResource('isPublic', checked)}
                />
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/resources')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addResource.isPending}
              >
                {addResource.isPending ? 'Creating...' : 'Create Resource'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
