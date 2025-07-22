'use client';

import TimelineView from '@/components/timeline/TimelineView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourses } from '@/lib/courseHooks';
import { useTimelineTasks } from '@/lib/taskHooks';
import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TimelinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [viewMode, setViewMode] = useState('week');
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  
  // Calculate end date based on view mode
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
  
  // Fetch tasks for the current date range
  const { data: tasks, isLoading: isTasksLoading } = useTimelineTasks(startDate, endDate, selectedCourseId);
  
  // Fetch courses for filtering
  const { data: courses, isLoading: isCoursesLoading } = useCourses();
  
  // Handle navigation between weeks
  const navigatePrevious = () => {
    setStartDate(subWeeks(startDate, 1));
  };
  
  const navigateNext = () => {
    setStartDate(addWeeks(startDate, 1));
  };
  
  // Handle filter change
  const handleCourseFilterChange = (courseId) => {
    setSelectedCourseId(courseId === 'all' ? null : courseId);
  };
  
  if (status === 'loading' || isTasksLoading || isCoursesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Timeline</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/tasks')}>
            View All Tasks
          </Button>
          <Button onClick={() => router.push('/tasks/new')}>
            Add New Task
          </Button>
        </div>
      </div>
      // Task Timeline Card
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Task Timeline</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={navigatePrevious}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={navigateNext}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Tabs defaultValue="week" onValueChange={setViewMode} className="w-full">
              <div className="flex justify-between">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
                
                <Select 
                  value={selectedCourseId || 'all'} 
                  onValueChange={handleCourseFilterChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Course" />
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
              </div>

              <TabsContent value="week" className="mt-4">
                <TimelineView tasks={tasks || []} viewMode="week" startDate={startDate} />
              </TabsContent>
              <TabsContent value="month" className="mt-4">
                <TimelineView tasks={tasks || []} viewMode="month" startDate={startDate} />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
