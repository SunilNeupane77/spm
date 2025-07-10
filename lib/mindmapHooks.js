'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Fetch all mindmaps for the current user
export function useMindmaps() {
  return useQuery({
    queryKey: ['mindmaps'],
    queryFn: async () => {
      const response = await fetch('/api/mindmaps');
      if (!response.ok) {
        throw new Error('Failed to fetch mindmaps');
      }
      return response.json();
    },
  });
}

// Fetch a single mindmap by ID
export function useMindmap(id) {
  return useQuery({
    queryKey: ['mindmaps', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/mindmaps/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mindmap');
      }
      return response.json();
    },
    enabled: !!id, // Only run this query if we have an ID
  });
}

// Add a new mindmap
export function useAddMindmap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newMindmap) => {
      const response = await fetch('/api/mindmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMindmap),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add mindmap');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch mindmaps list
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
    },
  });
}

// Update a mindmap
export function useUpdateMindmap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const response = await fetch(`/api/mindmaps/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update mindmap');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update both the list and the individual mindmap data
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      queryClient.invalidateQueries({ queryKey: ['mindmaps', variables.id] });
    },
  });
}

// Delete a mindmap
export function useDeleteMindmap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/mindmaps/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete mindmap');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
    },
  });
}

// Share a mindmap with other users
export function useShareMindmap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ mindmapId, shareData }) => {
      const response = await fetch(`/api/mindmaps/${mindmapId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to share mindmap');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update mindmap data
      queryClient.invalidateQueries({ queryKey: ['mindmaps', variables.mindmapId] });
    },
  });
}
