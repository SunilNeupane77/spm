'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

export default function CourseEditPage({ params }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [courseData, setCourseData] = useState({
    name: '',
    code: '',
    description: '',
    instructor: '',
    semester: '',
    year: new Date().getFullYear(),
    color: '#3498db'
  });
  
  // Available colors for courses
  const colors = [
    { name: 'Blue', value: '#3498db' },
    { name: 'Green', value: '#2ecc71' },
    { name: 'Purple', value: '#9b59b6' },
    { name: 'Red', value: '#e74c3c' },
    { name: 'Orange', value: '#e67e22' },
    { name: 'Yellow', value: '#f1c40f' },
    { name: 'Pink', value: '#fd79a8' },
    { name: 'Teal', value: '#1abc9c' }
  ];
  
  // Semesters
  const semesters = ['Fall', 'Spring', 'Summer', 'Winter'];
  
  // Years (current year and 4 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
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
  
  // Update course mutation
  const updateCourse = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update course');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
      router.push(`/courses/${courseId}`);
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive",
      });
    }
  });
  
  // Set initial form data when course is loaded
  // editing the course data
  useEffect(() => {
    if (course) {
      setCourseData({
        name: course.name || '',
        code: course.code || '',
        description: course.description || '',
        instructor: course.instructor || '',
        semester: course.semester || '',
        year: course.year || new Date().getFullYear(),
        color: course.color || '#3498db'
      });
    }
  }, [course]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateCourse.mutate(courseData);
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
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push(`/courses/${courseId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Course</h1>
          <p className="text-muted-foreground">{course?.name}</p>
        </div>
      </div>
      
      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  value={courseData.name}
                  onChange={(e) => setCourseData({...courseData, name: e.target.value})}
                  placeholder="Introduction to Computer Science"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  value={courseData.code}
                  onChange={(e) => setCourseData({...courseData, code: e.target.value})}
                  placeholder="CS101"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="semester">Semester</Label>
                <Select 
                  value={courseData.semester} 
                  onValueChange={(value) => setCourseData({...courseData, semester: value})}
                >
                  <SelectTrigger id="semester">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(semester => (
                      <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Select 
                  value={courseData.year?.toString()} 
                  onValueChange={(value) => setCourseData({...courseData, year: parseInt(value)})}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={courseData.instructor}
                  onChange={(e) => setCourseData({...courseData, instructor: e.target.value})}
                  placeholder="Prof. John Doe"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${courseData.color === color.value ? 'border-black dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setCourseData({...courseData, color: color.value})}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                  placeholder="Course description"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/courses/${courseId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCourse.isPending}>
                {updateCourse.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
