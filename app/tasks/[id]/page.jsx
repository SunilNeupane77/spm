'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourses } from '@/lib/courseHooks';
import { useTask } from '@/lib/taskHooks';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function TaskDetailPage({ params }) {
  const unwrappedParams = use(params);
  const taskId = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch task data
  const { data: task, isLoading: isTaskLoading, error: taskError } = useTask(taskId);
  
  // Fetch courses for dropdown
  const { data: courses, isLoading: coursesLoading } = useCourses();
  
  // Set up form with task data when available
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  
  // Set form values when task data is loaded
  if (task && !isEditing) {
    Object.entries(task).forEach(([key, value]) => {
      if (key !== '_id' && key !== '__v' && key !== 'owner' && key !== 'collaborators' && key !== 'attachments' && key !== 'reminders') {
        setValue(key, value);
      }
    });
    
    if (!startDate) {
      setStartDate(new Date(task.startDate));
    }
    
    if (!dueDate) {
      setDueDate(new Date(task.dueDate));
    }
    
    setIsEditing(true);
  }
  
  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async (taskData) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
    },
  });
  
  // Delete task mutation
  // delete
  const deleteTask = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Navigate back to tasks page after deletion
      router.push('/tasks');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
    },
  });
  
  const onSubmit = (data) => {
    updateTask.mutate({
      ...data,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
    });
  };
  
  // Helper function to get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  if (isTaskLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (taskError || !task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load task. It may not exist or you don't have permission to view it.</p>
            <Button onClick={() => router.push('/tasks')} className="mt-4">
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Task Details</h1>
          {task.course && (
            <Badge className="mt-1" style={{ backgroundColor: task.course.color || '#3498db', color: 'white' }}>
              {task.course.code}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/timeline')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            View in Timeline
          </Button>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete this task.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteTask.mutate()}
                  disabled={deleteTask.isPending}
                >
                  {deleteTask.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>
              <Input 
                className="text-2xl font-bold border-none p-0 h-auto"
                {...register("title", { required: "Title is required" })}
                placeholder="Task Title"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant="outline">
                {task.type}
              </Badge>
              <Badge variant="outline" className={
                task.status === 'completed' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : task.status === 'overdue'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }>
                {task.status}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </div>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                {...register("description")} 
                placeholder="Task description"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="type">Type</Label>
                <Select 
                  defaultValue={task.type}
                  onValueChange={(value) => setValue('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="course">Course</Label>
                {coursesLoading ? (
                  <div className="h-10 animate-pulse bg-muted rounded-md" />
                ) : (
                  <Select 
                    defaultValue={task.course?._id}
                    onValueChange={(value) => setValue('course', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map(course => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  defaultValue={task.priority}
                  onValueChange={(value) => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select 
                  defaultValue={task.status}
                  onValueChange={(value) => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="progress">Progress: {watch('progress') || task.progress}%</Label>
              </div>
              <Input 
                id="progress"
                type="range"
                min="0"
                max="100"
                defaultValue={task.progress}
                {...register("progress", { valueAsNumber: true })} 
                className="w-full"
              />
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${watch('progress') || task.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Button 
              type="submit"
              disabled={updateTask.isPending}
            >
              {updateTask.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
