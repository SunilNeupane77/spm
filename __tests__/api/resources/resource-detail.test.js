import { DELETE, GET, PUT } from '@/app/api/resources/[id]/route';
import Resource from '@/models/Resource';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';

// Mock NextAuth session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock mongoose
jest.mock('@/lib/mongoose', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve())
}));

describe('Resource Detail API', () => {
  let mockSession;
  let mockResourceId;
  let mockResource;
  
  beforeEach(() => {
    // Setup mock session
    mockSession = {
      user: {
        id: new mongoose.Types.ObjectId().toString(),
        name: 'Test User',
        email: 'test@example.com'
      }
    };
    
    // Setup mock resource ID
    mockResourceId = new mongoose.Types.ObjectId().toString();
    
    // Setup mock resource
    mockResource = {
      _id: mockResourceId,
      title: 'Test Resource',
      type: 'document',
      description: 'Test description',
      owner: mockSession.user.id,
      isPublic: false,
      sharedWith: [],
      populate: jest.fn().mockImplementation(function(field) {
        return this;
      }),
      toObject: jest.fn().mockReturnValue({
        _id: mockResourceId,
        title: 'Test Resource',
        type: 'document',
        owner: mockSession.user.id,
      }),
      deleteOne: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({
        _id: mockResourceId,
        title: 'Updated Resource',
        type: 'document',
        owner: mockSession.user.id,
      })
    };
    
    // Setup authentication
    getServerSession.mockResolvedValue(mockSession);
    
    // Mock Resource.findById
    Resource.findById = jest.fn().mockReturnValue(mockResource);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/resources/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      getServerSession.mockResolvedValueOnce(null);
      
      const request = new NextRequest(`http://localhost/api/resources/${mockResourceId}`);
      const response = await GET(request, { params: { id: mockResourceId } });
      
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Unauthorized');
    });
    
    it('should return the resource if user is owner', async () => {
      const request = new NextRequest(`http://localhost/api/resources/${mockResourceId}`);
      const response = await GET(request, { params: { id: mockResourceId } });
      
      expect(response.status).toBe(200);
      expect(Resource.findById).toHaveBeenCalledWith(mockResourceId);
    });
    
    it('should return the resource if it is shared with user', async () => {
      // Setup resource with shared user
      const sharedUserId = new mongoose.Types.ObjectId().toString();
      mockResource.owner = sharedUserId; // Different owner
      mockResource.sharedWith = [{
        user: mockSession.user.id,
        permission: 'view'
      }];
      
      const request = new NextRequest(`http://localhost/api/resources/${mockResourceId}`);
      const response = await GET(request, { params: { id: mockResourceId } });
      
      expect(response.status).toBe(200);
    });
    
    it('should return 404 if resource not found', async () => {
      Resource.findById.mockResolvedValueOnce(null);
      
      const request = new NextRequest(`http://localhost/api/resources/${mockResourceId}`);
      const response = await GET(request, { params: { id: mockResourceId } });
      
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Resource not found');
    });
  });
  
  describe('PUT /api/resources/[id]', () => {
    it('should update the resource if user is owner', async () => {
      const updatedData = {
        title: 'Updated Resource',
        description: 'Updated description'
      };
      
      const request = new NextRequest(
        `http://localhost/api/resources/${mockResourceId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updatedData)
        }
      );
      
      const response = await PUT(request, { params: { id: mockResourceId } });
      expect(response.status).toBe(200);
      expect(mockResource.save).toHaveBeenCalled();
    });
    
    it('should return 403 if user does not have edit permission', async () => {
      // Setup different owner
      const differentOwnerId = new mongoose.Types.ObjectId().toString();
      mockResource.owner = differentOwnerId;
      mockResource.sharedWith = [{
        user: mockSession.user.id,
        permission: 'view' // Only view permission, not edit
      }];
      
      const request = new NextRequest(
        `http://localhost/api/resources/${mockResourceId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'Should not update' })
        }
      );
      
      const response = await PUT(request, { params: { id: mockResourceId } });
      expect(response.status).toBe(403);
      expect(mockResource.save).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/resources/[id]', () => {
    it('should delete the resource if user is owner', async () => {
      const request = new NextRequest(
        `http://localhost/api/resources/${mockResourceId}`,
        { method: 'DELETE' }
      );
      
      const response = await DELETE(request, { params: { id: mockResourceId } });
      
      expect(response.status).toBe(200);
      expect(mockResource.deleteOne).toHaveBeenCalled();
      
      const responseBody = await response.json();
      expect(responseBody.message).toBe('Resource deleted successfully');
    });
    
    it('should return 403 if user is not the owner', async () => {
      // Setup different owner
      const differentOwnerId = new mongoose.Types.ObjectId().toString();
      mockResource.owner = differentOwnerId;
      
      const request = new NextRequest(
        `http://localhost/api/resources/${mockResourceId}`,
        { method: 'DELETE' }
      );
      
      const response = await DELETE(request, { params: { id: mockResourceId } });
      
      expect(response.status).toBe(403);
      expect(mockResource.deleteOne).not.toHaveBeenCalled();
    });
  });
});
