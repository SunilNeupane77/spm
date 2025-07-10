'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsSummary, useCourseAnalytics, useTaskAnalytics } from '@/lib/analyticsHooks';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();
  const { data: taskAnalytics, isLoading: taskAnalyticsLoading } = useTaskAnalytics(period);
  const { data: courseAnalytics, isLoading: courseAnalyticsLoading } = useCourseAnalytics();
  
  const handlePeriodChange = (value) => {
    setPeriod(value);
  };
  
  // Loading state
  if (summaryLoading || taskAnalyticsLoading || courseAnalyticsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        <div className="flex items-center">
          <Button variant="outline" className="mr-2">
            Export PDF
          </Button>
          <Button variant="outline">
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Courses</CardDescription>
            <CardTitle className="text-3xl">{summary?.counts.courses || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Most active: {summary?.mostActiveCourse?.name || 'None'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{summary?.counts.tasks || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="flex items-center text-green-500 mr-2">
                <ChevronUp className="h-4 w-4 mr-1" />
                {summary?.taskMetrics.completed || 0} Completed
              </div>
              <div className="flex items-center text-red-500">
                <ChevronDown className="h-4 w-4 mr-1" />
                {summary?.taskMetrics.overdue || 0} Overdue
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">
              {summary?.taskMetrics.completionRate ? summary.taskMetrics.completionRate.toFixed(1) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${summary?.taskMetrics.completionRate || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resources</CardDescription>
            <CardTitle className="text-3xl">{summary?.counts.resources || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Mind Maps: {summary?.counts.mindmaps || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="tasks" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
          <TabsTrigger value="courses">Course Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Analytics Controls */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Task Completion Over Time</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant={period === 'week' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handlePeriodChange('week')}
                    >
                      Week
                    </Button>
                    <Button 
                      variant={period === 'month' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handlePeriodChange('month')}
                    >
                      Month
                    </Button>
                    <Button 
                      variant={period === 'year' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handlePeriodChange('year')}
                    >
                      Year
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={taskAnalytics?.timeSeriesData || []}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="created" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Task Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Assignments', value: taskAnalytics?.distributions.type.assignment || 0 },
                        { name: 'Projects', value: taskAnalytics?.distributions.type.project || 0 },
                        { name: 'Exams', value: taskAnalytics?.distributions.type.exam || 0 },
                        { name: 'Other', value: taskAnalytics?.distributions.type.other || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Assignments', color: '#8884d8' },
                        { name: 'Projects', color: '#82ca9d' },
                        { name: 'Exams', color: '#ffc658' },
                        { name: 'Other', color: '#ff8042' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-between text-sm">
                  <div>
                    <div className="font-medium">Assignments</div>
                    <div className="text-muted-foreground">
                      {taskAnalytics?.distributions.type.assignment || 0} tasks
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Projects</div>
                    <div className="text-muted-foreground">
                      {taskAnalytics?.distributions.type.project || 0} tasks
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Exams</div>
                    <div className="text-muted-foreground">
                      {taskAnalytics?.distributions.type.exam || 0} tasks
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
            
            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'High', value: taskAnalytics?.distributions.priority.high || 0 },
                      { name: 'Medium', value: taskAnalytics?.distributions.priority.medium || 0 },
                      { name: 'Low', value: taskAnalytics?.distributions.priority.low || 0 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Tasks" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <CardFooter>
                <div className="grid grid-cols-3 gap-4 w-full text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mb-1"></div>
                    <div className="font-medium">High</div>
                    <div className="text-muted-foreground">
                      {taskAnalytics?.distributions.priority.high || 0}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mb-1"></div>
                    <div className="font-medium">Medium</div>
                    <div className="text-muted-foreground">
                      {taskAnalytics?.distributions.priority.medium || 0}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mb-1"></div>
                    <div className="font-medium">Low</div>
                    <div className="text-muted-foreground">
                      {taskAnalytics?.distributions.priority.low || 0}
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
            
            {/* Tasks by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span>Completed</span>
                      <span>{taskAnalytics?.summary.completedCount || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${taskAnalytics?.summary.completionRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span>In Progress</span>
                      <span>{taskAnalytics?.summary.inProgressCount || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${taskAnalytics?.summary.inProgressCount / taskAnalytics?.summary.totalTasks * 100 || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span>Pending</span>
                      <span>{taskAnalytics?.summary.pendingCount || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${taskAnalytics?.summary.pendingCount / taskAnalytics?.summary.totalTasks * 100 || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span>Overdue</span>
                      <span>{taskAnalytics?.summary.overdueCount || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${taskAnalytics?.summary.overdueCount / taskAnalytics?.summary.totalTasks * 100 || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Performance Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Course Performance Overview</CardTitle>
                <CardDescription>
                  Task completion rate and workload by course
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={courseAnalytics || []}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="completionRate" name="Completion Rate (%)" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="taskCount" name="Total Tasks" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Course Completion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Course Completion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {courseAnalytics?.slice(0, 5).map((course) => (
                    <div key={course.courseId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{course.courseCode}</span>
                        <span className="text-sm">{course.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${course.completionRate}%`,
                            backgroundColor: course.color || '#3498db' 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{course.completedTasks} of {course.totalTasks} completed</span>
                        {course.overdueTasks > 0 && (
                          <span className="text-red-500">{course.overdueTasks} overdue</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {courseAnalytics?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No course data available
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Courses
                </Button>
              </CardFooter>
            </Card>
            
            {/* Course Workload Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Course Workload Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {courseAnalytics?.slice(0, 5)
                    .sort((a, b) => b.totalTasks - a.totalTasks)
                    .map((course) => (
                    <div key={course.courseId}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-medium">{course.courseCode}</div>
                          <div className="text-xs text-muted-foreground">{course.courseName}</div>
                        </div>
                        <div className="text-sm font-medium">
                          {course.totalTasks} tasks
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-grow flex items-center space-x-1">
                          <div className="h-2 bg-green-500 rounded-full" 
                            style={{ width: `${course.completedTasks / course.totalTasks * 100}%` }}></div>
                          <div className="h-2 bg-yellow-500 rounded-full" 
                            style={{ width: `${course.inProgressTasks / course.totalTasks * 100}%` }}></div>
                          <div className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${course.pendingTasks / course.totalTasks * 100}%` }}></div>
                          <div className="h-2 bg-red-500 rounded-full" 
                            style={{ width: `${course.overdueTasks / course.totalTasks * 100}%` }}></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(course.averageCompletionTime)} days avg
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {courseAnalytics?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No course data available
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Download Workload Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
