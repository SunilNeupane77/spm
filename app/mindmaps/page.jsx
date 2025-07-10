'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourses } from '@/lib/courseHooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Folder, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MindmapsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newMindmap, setNewMindmap] = useState({
    title: '',
    description: '',
    course: ''
  });
  
  // Get courses for dropdown
  const { data: courses, isLoading: coursesLoading } = useCourses();
  
  // Fetch mindmaps
  const { data: mindmaps, isLoading, error } = useQuery({
    queryKey: ['mindmaps'],
    queryFn: async () => {
      const response = await fetch('/api/mindmaps');
      if (!response.ok) {
        throw new Error('Failed to fetch mindmaps');
      }
      return response.json();
    },
  });
  
  // Create mindmap mutation
  const createMindmap = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/mindmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create mindmap');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      setIsNewDialogOpen(false);
      router.push(`/mindmaps/${data._id}`);
    },
  });
  
  // Handle form submission
  const handleCreateMindmap = () => {
    if (!newMindmap.title) return;
    
    createMindmap.mutate(newMindmap);
  };
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isNewDialogOpen) {
      setNewMindmap({
        title: '',
        description: '',
        course: ''
      });
    }
  }, [isNewDialogOpen]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mind Maps</h1>
          <p className="text-muted-foreground">Create and manage your visual mind maps</p>
        </div>
        
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Mind Map
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Mind Map</DialogTitle>
              <DialogDescription>
                Create a mind map to visualize concepts, ideas, and relationships.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter mind map title"
                  value={newMindmap.title}
                  onChange={(e) => setNewMindmap({ ...newMindmap, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Enter a brief description"
                  value={newMindmap.description}
                  onChange={(e) => setNewMindmap({ ...newMindmap, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="course">Course (Optional)</Label>
                <Select
                  value={newMindmap.course}
                  onValueChange={(value) => setNewMindmap({ ...newMindmap, course: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {!coursesLoading && courses?.map(course => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMindmap} disabled={!newMindmap.title || createMindmap.isPending}>
                {createMindmap.isPending ? "Creating..." : "Create Mind Map"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading mind maps</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['mindmaps'] })} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : mindmaps?.length === 0 ? (
        <div className="text-center py-16">
          <Folder className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-medium">No mind maps yet</h3>
          <p className="mt-2 text-muted-foreground">Create a new mind map to get started</p>
          <Button onClick={() => setIsNewDialogOpen(true)} className="mt-4">
            Create Mind Map
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mindmaps?.map((mindmap) => (
            <Card key={mindmap._id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/mindmaps/${mindmap._id}`)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {mindmap.title}
                  {mindmap.course && (
                    <span className="text-xs rounded-full px-3 py-1 font-semibold"
                          style={{ backgroundColor: mindmap.course.color || '#3498db', color: 'white' }}>
                      {mindmap.course.code}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {mindmap.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created by: {mindmap.owner?.name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(mindmap.updatedAt || mindmap.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/mindmaps/${mindmap._id}`);
                }}>
                  Open Mind Map
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
