'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourses } from '@/lib/courseHooks';
import { useTasks } from '@/lib/taskHooks';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TasksPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: null,
    type: null,
    priority: null,
    course: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch tasks with current filters
  const { data: tasks, isLoading } = useTasks(filters);
  
  // Fetch courses for filtering
  const { data: courses, isLoading: coursesLoading } = useCourses();
  
  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value === 'all' ? null : value
    }));
  };
  
  // Filter tasks by search query
  const filteredTasks = tasks?.filter(task => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query)) ||
      (task.course?.name && task.course.name.toLowerCase().includes(query)) ||
      (task.course?.code && task.course.code.toLowerCase().includes(query))
    );
  });
  
  // Helper function to get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Helper function to get type badge color
  const getTypeColor = (type) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'project':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/timeline')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Timeline View
          </Button>
          <Button onClick={() => router.push('/tasks/new')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add New Task
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Task Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-1/3"
            />
            
            <div className="flex flex-1 flex-wrap gap-2">
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.type || 'all'} 
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.priority || 'all'} 
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              {!coursesLoading && (
                <Select 
                  value={filters.course || 'all'} 
                  onValueChange={(value) => handleFilterChange('course', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
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
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredTasks?.length > 0 ? (
              filteredTasks.map((task) => (
                <Card key={task._id} className="hover:bg-accent/5 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Link href={`/tasks/${task._id}`} className="font-medium hover:underline">
                          {task.title}
                        </Link>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {task.course && (
                            <span className="flex items-center">
                              <span
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: task.course.color || '#3498db' }}
                              ></span>
                              {task.course.code}
                            </span>
                          )}
                          
                          <Badge variant="outline" className={getTypeColor(task.type)}>
                            {task.type}
                          </Badge>
                          
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground text-right space-y-1">
                        <div className="flex items-center justify-end">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                        </div>
                        
                        {task.progress > 0 && (
                          <div className="flex items-center text-xs">
                            <span className="mr-2">{task.progress}%</span>
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                {searchQuery || Object.values(filters).some(v => v !== null) ? (
                  <div>
                    <p className="mb-2">No tasks match your filters</p>
                    <Button variant="outline" onClick={() => {
                      setFilters({
                        status: null,
                        type: null,
                        priority: null,
                        course: null,
                      });
                      setSearchQuery('');
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">You don't have any tasks yet</p>
                    <Button onClick={() => router.push('/tasks/new')}>
                      Create Your First Task
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
