'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourses } from '@/lib/courseHooks';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function NewTaskPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [manualCourseEntry, setManualCourseEntry] = useState(false);
  const [manualCourseName, setManualCourseName] = useState('');
  const [manualCourseCode, setManualCourseCode] = useState('');
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, setError } = useForm({
    defaultValues: {
      title: '',
      description: '',
      type: 'assignment',
      priority: 'medium',
      course: '',
      status: 'pending',
      progress: 0
    }
  });
  
  // Watch course value for validation
  const selectedCourse = watch('course');
  
  // Fetch courses for the dropdown
  const { data: courses, isLoading: coursesLoading } = useCourses();
  
  // Mutation for creating a task
  const createTask = useMutation({
    mutationFn: async (taskData) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
      
      // Navigate to timeline view
      router.push('/timeline');
    },
  });
  // course 
  // tab
  
  const onSubmit = async (data) => {
    // Handle both course selection and manual entry
    let courseId = data.course;
    
    // If using manual entry, create a new course first
    if (manualCourseEntry) {
      if (!manualCourseName || !manualCourseCode) {
        setError('manualCourse', {
          type: 'manual',
          message: 'Please provide both course name and code'
        });
        return;
      }
      
      try {
        // Create a new course
        const courseResponse = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: manualCourseName,
            code: manualCourseCode,
            color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
          }),
        });
        
        if (!courseResponse.ok) {
          throw new Error('Failed to create course');
        }
        
        const newCourse = await courseResponse.json();
        courseId = newCourse._id;
        
        // Invalidate the courses query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } catch (error) {
        console.error('Error creating course:', error);
        setError('manualCourse', {
          type: 'manual',
          message: 'Failed to create course: ' + error.message
        });
        return;
      }
    } else if (!data.course) {
      // If not manual entry and no course selected
      setError('course', {
        type: 'manual',
        message: 'Please select a course'
      });
      return;
    }
    
    createTask.mutate({
      ...data,
      course: courseId, // Use either selected course ID or newly created course ID
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Task</h1>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>
            Add a new task, assignment, exam, or project to your timeline.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="Enter task title" 
                {...register("title", { required: "Title is required" })} 
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="Enter task description" 
                {...register("description")} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="type">Type *</Label>
                <Select 
                  defaultValue="assignment" 
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
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="course">Course *</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setManualCourseEntry(!manualCourseEntry)}
                    className="text-xs"
                  >
                    {manualCourseEntry ? "Use existing course" : "Add new course"}
                  </Button>
                </div>
                
                {manualCourseEntry ? (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="manualCourseName">Course Name</Label>
                      <Input 
                        id="manualCourseName" 
                        placeholder="Enter course name" 
                        value={manualCourseName}
                        onChange={(e) => setManualCourseName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="manualCourseCode">Course Code</Label>
                      <Input 
                        id="manualCourseCode" 
                        placeholder="Enter course code" 
                        value={manualCourseCode}
                        onChange={(e) => setManualCourseCode(e.target.value)}
                      />
                    </div>
                    {errors.manualCourse && (
                      <p className="text-sm text-red-500">{errors.manualCourse.message}</p>
                    )}
                  </div>
                ) : (
                  <>
                    {coursesLoading ? (
                      <div className="h-10 animate-pulse bg-muted rounded-md" />
                    ) : (
                      <Select 
                        onValueChange={(value) => setValue('course', value, { shouldValidate: true })}
                        value={watch('course')}
                      >
                        <SelectTrigger id="course">
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses && courses.length > 0 ? (
                            courses.map(course => (
                              <SelectItem key={course._id} value={course._id}>
                                {course.code} - {course.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-courses" disabled>No courses available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.course && (
                      <p className="text-sm text-red-500">{errors.course.message}</p>
                    )}
                    {!errors.course && !selectedCourse && !manualCourseEntry && (
                      <p className="text-sm text-amber-500">Please select a course or create a new one</p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Date *</Label>
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
                <Label>Due Date *</Label>
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
                  defaultValue="medium" 
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
                  defaultValue="pending" 
                  onValueChange={(value) => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createTask.isPending}
            >
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
