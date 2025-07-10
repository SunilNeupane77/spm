import { GET, POST } from '@/app/api/mindmaps/route';
import dbConnect from '@/lib/mongoose';
import Mindmap from '@/models/Mindmap';
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

jest.mock('@/models/Mindmap', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Mindmaps API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/mindmaps', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      const { req, res } = createMocks({
        method: 'GET',
      });
      
      const response = await GET(req);
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return mindmaps for authenticated user', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: { id: 'user123' }
      });
      
      // Mock database connection
      dbConnect.mockResolvedValueOnce();
      
      // Mock Mindmap find response
      const mockMindmaps = [
        { _id: 'mindmap1', title: 'Test Mindmap 1' },
        { _id: 'mindmap2', title: 'Test Mindmap 2' }
      ];
      
      // Mock the populate chain
      const findMock = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockReturnThis();
      const populateMock = jest.fn().mockReturnThis();
      const finalPopulateMock = jest.fn().mockResolvedValue(mockMindmaps);
      
      Mindmap.find.mockReturnValue({
        sort: sortMock,
        populate: populateMock
      });
      
      sortMock.mockReturnValue({
        populate: populateMock
      });
      
      populateMock.mockReturnValue({
        populate: finalPopulateMock
      });
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/mindmaps',
      });
      
      const response = await GET(req);
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual(mockMindmaps);
      
      // Verify correct query was used
      expect(Mindmap.find).toHaveBeenCalledWith({
        $or: [
          { owner: 'user123' },
          { sharedWith: { $elemMatch: { user: 'user123' } } }
        ]
      });
    });
  });

  describe('POST /api/mindmaps', () => {
    it('should create a new mindmap for authenticated user', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: { id: 'user123' }
      });
      
      // Mock database connection
      dbConnect.mockResolvedValueOnce();
      
      // Mock mindmap creation
      const newMindmap = {
        _id: 'new-mindmap-id',
        title: 'New Mindmap',
        description: 'Test Description',
        owner: 'user123'
      };
      
      Mindmap.create.mockResolvedValueOnce(newMindmap);
      
      const { req } = createMocks({
        method: 'POST',
        url: '/api/mindmaps',
        body: {
          title: 'New Mindmap',
          description: 'Test Description'
        }
      });
      
      const response = await POST(req);
      expect(response.status).toBe(201);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual(newMindmap);
      
      // Verify mindmap was created with correct data
      expect(Mindmap.create).toHaveBeenCalledWith({
        title: 'New Mindmap',
        description: 'Test Description',
        owner: 'user123',
        nodes: expect.any(Array),
        edges: expect.any(Array)
      });
    });
  });
});
