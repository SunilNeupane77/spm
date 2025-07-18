'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  
  const [newCourse, setNewCourse] = useState({
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
  
  // Fetch courses
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses', filterYear, filterSemester],
    queryFn: async () => {
      let url = '/api/courses';
      const params = new URLSearchParams();
      
      if (filterYear && filterYear !== 'all') params.append('year', filterYear);
      if (filterSemester && filterSemester !== 'all') params.append('semester', filterSemester);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    },
  });
  
  // Create course mutation
  const createCourse = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create course');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsNewDialogOpen(false);
      setNewCourse({
        name: '',
        code: '',
        description: '',
        instructor: '',
        semester: '',
        year: new Date().getFullYear(),
        color: '#3498db'
      });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    }
  });
  
  // Share course mutationfm
  const shareCourse = useMutation({
    mutationFn: async ({ courseId, email, permission }) => {
      const response = await fetch(`/api/courses/${courseId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, permission }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share course');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsShareDialogOpen(false);
      setShareEmail('');
      setSharePermission('view');
      setSelectedCourse(null);
      toast({
        title: "Success",
        description: "Course shared successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share course",
        variant: "destructive",
      });
    }
  });
  
  const handleCreateCourse = (e) => {
    e.preventDefault();
    createCourse.mutate(newCourse);
  };
  
  const handleShareCourse = (e) => {
    e.preventDefault();
    if (selectedCourse) {
      shareCourse.mutate({ 
        courseId: selectedCourse._id, 
        email: shareEmail, 
        permission: sharePermission 
      });
    }
  };
  
  const openShareDialog = (course) => {
    setSelectedCourse(course);
    setIsShareDialogOpen(true);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center">
          <Label htmlFor="yearFilter" className="mr-2">Year:</Label>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger id="yearFilter" className="w-[120px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <Label htmlFor="semesterFilter" className="mr-2">Semester:</Label>
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger id="semesterFilter" className="w-[150px]">
              <SelectValue placeholder="All Semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map(semester => (
                <SelectItem key={semester} value={semester}>{semester}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <p className="text-red-500">Error loading courses.</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['courses'] })}>
            Try again
          </Button>
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-1">No courses found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first course.</p>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <Card key={course._id} className="overflow-hidden border-t-4" style={{ borderTopColor: course.color }}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-1">{course.name}</CardTitle>
                    <CardDescription>{course.code}</CardDescription>
                  </div>
                  {course.owner._id === queryClient.getQueryData(['user'])?.id && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openShareDialog(course)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {course.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{course.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {course.instructor && (
                    <div>
                      <span className="font-medium">Instructor:</span>
                      <p className="text-muted-foreground truncate">{course.instructor}</p>
                    </div>
                  )}
                  {course.semester && course.year && (
                    <div>
                      <span className="font-medium">Term:</span>
                      <p className="text-muted-foreground">{course.semester} {course.year}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => router.push(`/courses/${course._id}`)}>
                  View Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push(`/courses/${course._id}/resources`)}>
                  Resources
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Course Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to your academic organizer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  placeholder="Introduction to Computer Science"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                  placeholder="CS101"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select 
                    value={newCourse.semester} 
                    onValueChange={(value) => setNewCourse({...newCourse, semester: value})}
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
                    value={newCourse.year.toString()} 
                    onValueChange={(value) => setNewCourse({...newCourse, year: parseInt(value)})}
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
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                  placeholder="Prof. John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  placeholder="Course description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${newCourse.color === color.value ? 'border-black dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewCourse({...newCourse, color: color.value})}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCourse.isPending}>
                {createCourse.isPending ? 'Creating...' : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Share Course Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Course</DialogTitle>
            <DialogDescription>
              Share this course with other students or colleagues.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShareCourse}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permission">Permission</Label>
                <Select 
                  value={sharePermission} 
                  onValueChange={setSharePermission}
                >
                  <SelectTrigger id="permission">
                    <SelectValue placeholder="Select Permission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={shareCourse.isPending}>
                {shareCourse.isPending ? 'Sharing...' : 'Share Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
