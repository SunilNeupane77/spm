'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Fetch all resources for the current user
export function useResources(filters = {}) {
  // Convert filters to query string
  const queryString = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
    
  const url = `/api/resources${queryString ? `?${queryString}` : ''}`;
  
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      return response.json();
    },
  });
}

// Fetch resources for a specific course
export function useCourseResources(courseId) {
  return useQuery({
    queryKey: ['resources', 'course', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const response = await fetch(`/api/resources?course=${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course resources');
      }
      return response.json();
    },
    enabled: !!courseId,
  });
}

// Fetch a single resource by ID
export function useResource(id) {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/resources/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resource');
      }
      return response.json();
    },
    enabled: !!id, // Only run this query if we have an ID
  });
}

// Add a new resource
export function useAddResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newResource) => {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newResource),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add resource');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch resources list
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      
      // Also invalidate course resources if this resource belongs to a course
      if (data.course) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'course', data.course] });
      }
    },
  });
}

// Update a resource
export function useUpdateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update resource');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update both the list and the individual resource data
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
      
      // Also invalidate course resources if this resource belongs to a course
      if (data.course) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'course', data.course] });
      }
    },
  });
}

// Delete a resource
export function useDeleteResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      
      // Also invalidate course resources if we know the course
      if (data.course) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'course', data.course] });
      }
    },
  });
}

// Share a resource with other users
export function useShareResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ resourceId, shareData }) => {
      const response = await fetch(`/api/resources/${resourceId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to share resource');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update resource data
      queryClient.invalidateQueries({ queryKey: ['resources', variables.resourceId] });
    },
  });
}
