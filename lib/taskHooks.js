'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Fetch all tasks for the current user
export function useTasks(filters = {}) {
  // Convert filters to query string
  const queryString = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
    
  const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;
  
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
  });
}

// Fetch tasks for timeline view (with date range)
export function useTimelineTasks(startDate, endDate, courseId = null) {
  let queryString = `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
  if (courseId) {
    queryString += `&courseId=${courseId}`;
  }
  
  return useQuery({
    queryKey: ['timeline-tasks', startDate, endDate, courseId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/timeline?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline tasks');
      }
      return response.json();
    },
  });
}

// Fetch a single task by ID
export function useTask(id) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/tasks/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task');
      }
      return response.json();
    },
    enabled: !!id, // Only run this query if we have an ID
  });
}

// Add a new task
export function useAddTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newTask) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch tasks list and timeline
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
      
      // Also invalidate course tasks if this task belongs to a course
      if (data.course) {
        queryClient.invalidateQueries({ queryKey: ['courses', data.course] });
      }
    },
  });
}

// Update a task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update both the list and the individual task data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
      
      // Also invalidate course tasks if this task belongs to a course
      if (data.course) {
        queryClient.invalidateQueries({ queryKey: ['courses', data.course] });
      }
    },
  });
}

// Update task progress
export function useUpdateTaskProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, progress }) => {
      const response = await fetch(`/api/tasks/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task progress');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update task data
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
      
      // Also invalidate course tasks if we know the course
      if (data.course) {
        queryClient.invalidateQueries({ queryKey: ['courses', data.course] });
      }
    },
  });
}
