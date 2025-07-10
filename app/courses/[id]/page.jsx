'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Edit, FileSymlink, ListChecks, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

export default function CourseDetailPage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch course data
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      return response.json();
    },
  });
  
  // Fetch tasks for this course
  const { data: tasks } = useQuery({
    queryKey: ['tasks', { course: courseId }],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?course=${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
  });
  
  // Delete course mutation
  const deleteCourse = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      router.push('/courses');
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    }
  });
  
  const handleDeleteCourse = () => {
    deleteCourse.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Error loading course details.</p>
        <Button variant="outline" onClick={() => router.push('/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>
    );
  }
  
  // Calculate task statistics
  const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
  const inProgressTasks = tasks?.filter(task => task.status === 'in-progress').length || 0;
  const overdueTasks = tasks?.filter(task => task.status === 'overdue').length || 0;
  
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push('/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.name}</h1>
            <p className="text-muted-foreground">{course.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/courses/${courseId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Instructor</h3>
                    <p>{course.instructor || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Term</h3>
                    <p>{course.semester} {course.year}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Description</h3>
                    <p>{course.description || 'No description provided.'}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Shared With</h3>
                  {course.sharedWith && course.sharedWith.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {course.sharedWith.map((share) => (
                        <div key={share._id} className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
                          <span>{share.user.email}</span>
                          <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                            {share.permission === 'edit' ? 'Editor' : 'Viewer'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">This course has not been shared with anyone.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                      <circle
                        className="text-muted stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      ></circle>
                      <circle
                        className="text-primary stroke-current"
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={`${completionRate * 2.51} 251.2`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{completionRate}%</span>
                    </div>
                  </div>
                  
                  <div className="grid gap-3 w-full">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completed</span>
                        <span>{completedTasks} of {totalTasks}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
                        <span className="block font-medium">{pendingTasks}</span>
                        <span className="text-xs">Pending</span>
                      </div>
                      <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                        <span className="block font-medium">{inProgressTasks}</span>
                        <span className="text-xs">In Progress</span>
                      </div>
                      <div className="text-center p-2 bg-red-100 dark:bg-red-900/20 rounded-md">
                        <span className="block font-medium">{overdueTasks}</span>
                        <span className="text-xs">Overdue</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Course Tasks</h2>
            <Button onClick={() => router.push(`/tasks/new?course=${courseId}`)}>
              Add New Task
            </Button>
          </div>
          
          {!tasks || tasks.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">No tasks yet</h3>
              <p className="text-muted-foreground mb-4">Create tasks to track your course work</p>
              <Button onClick={() => router.push(`/tasks/new?course=${courseId}`)}>
                Add New Task
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map(task => (
                <Card key={task._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <div className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                        ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                        ${task.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                      `}>
                        {task.status.replace('-', ' ')}
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                          ${task.priority === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                          ${task.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                        `}>
                          {task.priority}
                        </span>
                        <span className={`
                          px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground
                        `}>
                          {task.type}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/tasks/${task._id}`)}>
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Course Resources</h2>
            <Button onClick={() => router.push(`/courses/${courseId}/resources/new`)}>
              Add Resource
            </Button>
          </div>
          
          <div className="text-center p-8 border rounded-lg">
            <FileSymlink className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">Manage course resources</h3>
            <p className="text-muted-foreground mb-4">
              Click the button below to manage all resources for this course
            </p>
            <Button onClick={() => router.push(`/courses/${courseId}/resources`)}>
              View All Resources
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse} disabled={deleteCourse.isPending}>
              {deleteCourse.isPending ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
