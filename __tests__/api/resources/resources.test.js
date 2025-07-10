import { GET, POST } from '@/app/api/resources/route';
import Resource from '@/models/Resource';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';

// Mock the NextAuth session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock mongoose
jest.mock('@/lib/mongoose', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve())
}));

describe('Resources API', () => {
  let mockSession;
  let mockUser;
  
  beforeEach(() => {
    // Setup mock session
    mockUser = {
      id: new mongoose.Types.ObjectId().toString(),
      name: 'Test User',
      email: 'test@example.com'
    };
    
    mockSession = {
      user: mockUser
    };
    
    getServerSession.mockResolvedValue(mockSession);
    
    // Mock Resource.find
    Resource.find = jest.fn().mockImplementation(() => ({
      sort: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockImplementation(() => ({
          populate: jest.fn().mockResolvedValue([
            {
              _id: 'resource1',
              title: 'Test Resource 1',
              type: 'document',
              owner: mockUser.id
            },
            {
              _id: 'resource2',
              title: 'Test Resource 2',
              type: 'link',
              owner: mockUser.id
            }
          ])
        }))
      }))
    }));
    
    // Mock Resource.create
    Resource.create = jest.fn().mockImplementation((data) => 
      Promise.resolve({
        ...data,
        _id: 'new-resource-id'
      })
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/resources', () => {
    it('should return 401 if not authenticated', async () => {
      getServerSession.mockResolvedValueOnce(null);
      
      const response = await GET(new NextRequest('http://localhost/api/resources', { method: 'GET' }));
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return resources for the authenticated user', async () => {
      const response = await GET(new NextRequest('http://localhost/api/resources', { method: 'GET' }));
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveLength(2);
      expect(responseBody[0].title).toBe('Test Resource 1');
      expect(responseBody[1].title).toBe('Test Resource 2');
    });
    
    it('should apply filters from query parameters', async () => {
      await GET(new NextRequest('http://localhost/api/resources?course=course123&type=document', { method: 'GET' }));
      
      expect(Resource.find).toHaveBeenCalledWith({
        $or: [
          { owner: mockUser.id },
          { 'sharedWith.user': mockUser.id }
        ],
        course: 'course123',
        type: 'document'
      });
    });
  });
  
  describe('POST /api/resources', () => {
    it('should return 401 if not authenticated', async () => {
      getServerSession.mockResolvedValueOnce(null);
      
      const response = await POST(
        new NextRequest('http://localhost/api/resources', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Resource',
            type: 'document'
          })
        })
      );
      
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    it('should create a new resource', async () => {
      const resourceData = {
        title: 'New Resource',
        type: 'document',
        description: 'A test resource',
        url: 'https://example.com/resource.pdf'
      };
      
      const response = await POST(
        new NextRequest('http://localhost/api/resources', {
          method: 'POST',
          body: JSON.stringify(resourceData)
        })
      );
      
      expect(response.status).toBe(201);
      
      const responseBody = await response.json();
      expect(responseBody._id).toBe('new-resource-id');
      
      expect(Resource.create).toHaveBeenCalledWith({
        ...resourceData,
        owner: mockUser.id
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await POST(
        new NextRequest('http://localhost/api/resources', {
          method: 'POST',
          body: JSON.stringify({
            // Missing required 'type' field
            title: 'New Resource'
          })
        })
      );
      
      expect(response.status).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeTruthy();
    });
  });
});
