'use client';

import { useQuery } from '@tanstack/react-query';

// Fetch course analytics
export function useCourseAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'courses'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch course analytics');
      }
      return response.json();
    },
  });
}

// Fetch task analytics with period parameter
export function useTaskAnalytics(period = 'month') {
  return useQuery({
    queryKey: ['analytics', 'tasks', period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/tasks?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task analytics');
      }
      return response.json();
    },
  });
}

// Fetch overall analytics summary
export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics summary');
      }
      return response.json();
    },
  });
}
