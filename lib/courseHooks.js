'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Fetch all courses for the current user
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    },
  });
}

// Fetch a single course by ID
export function useCourse(id) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/courses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      return response.json();
    },
    enabled: !!id, // Only run this query if we have an ID
  });
}

// Add a new course
export function useAddCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newCourse) => {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add course');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch courses list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// Update a course
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update course');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update both the list and the individual course data
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', variables.id] });
    },
  });
}

// Delete a course
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// Share a course with other users
export function useShareCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, shareData }) => {
      const response = await fetch(`/api/courses/${courseId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to share course');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update course data
      queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId] });
    },
  });
}
