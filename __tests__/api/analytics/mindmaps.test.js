import { GET as getMindmapsAnalytics } from '@/app/api/analytics/mindmaps/route';
import Course from '@/models/Course';
import Mindmap from '@/models/Mindmap';
import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongoose', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Mindmap', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/models/Course', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

describe('Mindmap Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock unauthenticated session
    getServerSession.mockResolvedValueOnce(null);
    
    // Create mock request and response
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Call the API handler
    await getMindmapsAnalytics(req, res);
    
    // Parse the response body
    const data = JSON.parse(res._getData());
    
    // Verify response
    expect(res._getStatusCode()).toBe(401);
    expect(data).toHaveProperty('error', 'Unauthorized');
  });

  it('should return mindmap analytics for authenticated user', async () => {
    // Mock authenticated session
    getServerSession.mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' }
    });
    
    // Mock mindmaps data
    const mockMindmaps = [
      {
        _id: 'mindmap1',
        title: 'CS 101 Concepts',
        nodes: [{ id: 'node1', type: 'course' }, { id: 'node2', type: 'task' }],
        edges: [{ id: 'edge1', source: 'node1', target: 'node2' }],
        course: { _id: 'course1', name: 'Computer Science 101', code: 'CS101', color: '#ff0000' },
        createdAt: new Date('2025-06-01'),
        updatedAt: new Date('2025-06-05')
      },
      {
        _id: 'mindmap2',
        title: 'Math Concepts',
        nodes: [{ id: 'node3', type: 'custom' }, { id: 'node4', type: 'resource' }],
        edges: [{ id: 'edge2', source: 'node3', target: 'node4' }],
        course: { _id: 'course2', name: 'Mathematics', code: 'MATH101', color: '#0000ff' },
        createdAt: new Date('2025-06-10'),
        updatedAt: new Date('2025-06-15')
      }
    ];
    
    // Mock courses data
    const mockCourses = [
      { _id: 'course1', name: 'Computer Science 101', code: 'CS101', color: '#ff0000' },
      { _id: 'course2', name: 'Mathematics', code: 'MATH101', color: '#0000ff' }
    ];
    
    // Setup mock implementation
    Mindmap.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockMindmaps)
    });
    Course.find.mockResolvedValue(mockCourses);
    
    // Create mock request and response
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Call the API handler
    await getMindmapsAnalytics(req, res);
    
    // Parse the response body
    const data = JSON.parse(res._getData());
    
    // Verify response structure
    expect(res._getStatusCode()).toBe(200);
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('nodeTypeDistribution');
    expect(data).toHaveProperty('mindmapsByCourse');
    expect(data).toHaveProperty('recentMindmaps');
    
    // Verify summary calculations
    expect(data.summary.totalMindmaps).toBe(2);
    expect(data.summary.mindmapsWithCourses).toBe(2);
    
    // Verify node distribution
    expect(data.nodeTypeDistribution).toHaveProperty('course', 1);
    expect(data.nodeTypeDistribution).toHaveProperty('task', 1);
    expect(data.nodeTypeDistribution).toHaveProperty('resource', 1);
    expect(data.nodeTypeDistribution).toHaveProperty('custom', 1);
    
    // Verify recent mindmaps
    expect(data.recentMindmaps).toHaveLength(2);
    expect(data.recentMindmaps[0].title).toBe('Math Concepts'); // Most recent first
  });

  it('should handle errors gracefully', async () => {
    // Mock authenticated session
    getServerSession.mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' }
    });
    
    // Mock error in database query
    Mindmap.find.mockImplementation(() => {
      throw new Error('Database error');
    });
    
    // Create mock request and response
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Call the API handler
    await getMindmapsAnalytics(req, res);
    
    // Parse the response body
    const data = JSON.parse(res._getData());
    
    // Verify error response
    expect(res._getStatusCode()).toBe(500);
    expect(data).toHaveProperty('error', 'Failed to fetch mindmap analytics');
  });
});
