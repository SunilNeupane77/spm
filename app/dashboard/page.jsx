'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourses } from '@/lib/courseHooks';
import { useTasks } from '@/lib/taskHooks';
import { formatDate } from '@/lib/utils';
import { BookOpenIcon, CalendarIcon, FilePenIcon, LineChart, PlusIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Filter tasks to show upcoming ones
  useEffect(() => {
    if (tasks) {
      const today = new Date();
      const upcoming = tasks
        .filter(task => 
          new Date(task.dueDate) >= today && 
          task.status !== 'completed'
        )
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5); // Get top 5
      
      setUpcomingTasks(upcoming);
    }
  }, [tasks]);

  // Loading state
  if (status === 'loading' || tasksLoading || coursesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Count tasks by status
  const countTasksByStatus = (status) => {
    return tasks ? tasks.filter(task => task.status === status).length : 0;
  };

  // Count tasks by type
  const countTasksByType = (type) => {
    return tasks ? tasks.filter(task => task.type === type).length : 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {session?.user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's an overview of your academic progress and upcoming tasks.
        </p>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{courses ? courses.length : 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{countTasksByStatus('pending') + countTasksByStatus('in-progress')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{countTasksByStatus('completed')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{countTasksByStatus('overdue')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming tasks and task breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upcoming tasks */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Your tasks due soon</CardDescription>
              </div>
              <Link href="/tasks/new">
                <Button size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No upcoming tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div 
                      key={task._id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-gray-500">
                          {task.course?.name || 'No Course'} • Due {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Link href="/timeline" className="flex-1">
                <Button variant="outline" className="w-full">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Timeline View
                </Button>
              </Link>
              <Link href="/tasks" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All Tasks
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Task breakdown */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Task Breakdown</CardTitle>
              <CardDescription>Tasks by type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FilePenIcon className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Assignments</span>
                  </div>
                  <span className="font-medium">{countTasksByType('assignment')}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${tasks && tasks.length ? (countTasksByType('assignment') / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpenIcon className="h-4 w-4 mr-2 text-purple-500" />
                    <span>Exams</span>
                  </div>
                  <span className="font-medium">{countTasksByType('exam')}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500" 
                    style={{ width: `${tasks && tasks.length ? (countTasksByType('exam') / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LineChart className="h-4 w-4 mr-2 text-green-500" />
                    <span>Projects</span>
                  </div>
                  <span className="font-medium">{countTasksByType('project')}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${tasks && tasks.length ? (countTasksByType('project') / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/analytics" className="w-full">
                <Button variant="outline" className="w-full">View Analytics</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/timeline">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
              <CalendarIcon className="h-5 w-5" />
              <span>View Timeline</span>
            </Button>
          </Link>
          <Link href="/courses/create">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
              <BookOpenIcon className="h-5 w-5" />
              <span>Add Course</span>
            </Button>
          </Link>
          <Link href="/tasks/create">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
              <FilePenIcon className="h-5 w-5" />
              <span>New Task</span>
            </Button>
          </Link>
          <Link href="/mindmaps/create">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Create Mind Map</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
