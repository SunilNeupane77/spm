import { GET as getCoursesAnalytics } from '@/app/api/analytics/courses/route';
import { GET as getSummary } from '@/app/api/analytics/summary/route';
import { GET as getTasksAnalytics } from '@/app/api/analytics/tasks/route';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Mindmap from '@/models/Mindmap';
import Resource from '@/models/Resource';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';

// Mock the dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongoose', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Course', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Task', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Mindmap', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Resource', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

describe('Analytics API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/summary', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/analytics/summary',
      });
      
      const response = await getSummary(req);
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return summary analytics for authenticated user', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: { id: 'user123' }
      });
      
      // Mock database connection
      dbConnect.mockResolvedValueOnce();
      
      // Mock counts
      Course.countDocuments.mockResolvedValueOnce(5);
      Task.countDocuments.mockResolvedValueOnce(20);
      Mindmap.countDocuments.mockResolvedValueOnce(3);
      Resource.countDocuments.mockResolvedValueOnce(15);
      
      // Mock tasks for completion metrics
      const mockTasks = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'in-progress' },
        { status: 'pending' },
        { status: 'overdue' },
      ];
      
      Task.find.mockResolvedValueOnce(mockTasks);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/analytics/summary',
      });
      
      const response = await getSummary(req);
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('counts');
      expect(responseBody.counts).toHaveProperty('courses', 5);
      expect(responseBody.counts).toHaveProperty('tasks', 20);
      expect(responseBody.counts).toHaveProperty('mindmaps', 3);
      expect(responseBody.counts).toHaveProperty('resources', 15);
    });
  });

  describe('GET /api/analytics/courses', () => {
    it('should return course analytics for authenticated user', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: { id: 'user123' }
      });
      
      // Mock database connection
      dbConnect.mockResolvedValueOnce();
      
      // Mock courses
      const mockCourses = [
        { _id: 'course1', name: 'Course 1' },
        { _id: 'course2', name: 'Course 2' }
      ];
      
      // Mock tasks
      const mockTasks = [
        { course: 'course1', status: 'completed' },
        { course: 'course1', status: 'completed' },
        { course: 'course1', status: 'in-progress' },
        { course: 'course2', status: 'pending' },
        { course: 'course2', status: 'overdue' }
      ];
      
      Course.find.mockResolvedValueOnce(mockCourses);
      Task.find.mockResolvedValueOnce(mockTasks);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/analytics/courses',
      });
      
      const response = await getCoursesAnalytics(req);
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody).toHaveLength(2);
    });
  });

  describe('GET /api/analytics/tasks', () => {
    it('should return task analytics with period filtering', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: { id: 'user123' }
      });
      
      // Mock database connection
      dbConnect.mockResolvedValueOnce();
      
      // Mock tasks
      const mockTasks = [
        { status: 'completed', priority: 'high', type: 'assignment' },
        { status: 'completed', priority: 'medium', type: 'project' },
        { status: 'in-progress', priority: 'low', type: 'assignment' },
        { status: 'pending', priority: 'high', type: 'exam' },
        { status: 'overdue', priority: 'medium', type: 'assignment' }
      ];
      
      // Mock the completed tasks for trend
      const mockCompletedTasks = [
        { completedAt: new Date('2025-07-01') },
        { completedAt: new Date('2025-07-05') }
      ];
      
      Task.find.mockResolvedValueOnce(mockTasks);
      Task.find.mockResolvedValueOnce(mockCompletedTasks);
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/analytics/tasks?period=month',
      });
      
      const response = await getTasksAnalytics(req);
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('summary');
      expect(responseBody).toHaveProperty('distributions');
      expect(responseBody).toHaveProperty('timeSeriesData');
    });
  });
});
