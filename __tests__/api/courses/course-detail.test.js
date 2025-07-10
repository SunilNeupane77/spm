import { DELETE, GET, PUT } from '@/app/api/courses/[id]/route';
import Course from '@/models/Course';
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

describe('Course Detail API', () => {
  let mockSession;
  let mockUser;
  let mockCourse;
  let mockParams;
  
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

    mockParams = { params: { id: 'course-123' } };
    
    mockCourse = {
      _id: 'course-123',
      name: 'Test Course',
      code: 'TC101',
      description: 'A test course',
      instructor: 'Professor Test',
      owner: mockUser.id,
      toObject: jest.fn().mockReturnValue({
        _id: 'course-123',
        name: 'Test Course',
        code: 'TC101',
        description: 'A test course',
        instructor: 'Professor Test',
        owner: mockUser.id
      })
    };
    
    getServerSession.mockResolvedValue(mockSession);
    
    // Mock Course.findById
    Course.findById = jest.fn().mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue(mockCourse)
    }));

    // Mock Course.findByIdAndUpdate
    Course.findByIdAndUpdate = jest.fn().mockResolvedValue(mockCourse);

    // Mock Course.findByIdAndDelete
    Course.findByIdAndDelete = jest.fn().mockResolvedValue(mockCourse);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/courses/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      getServerSession.mockResolvedValueOnce(null);
      
      const response = await GET(new NextRequest('http://localhost/api/courses/course-123'), mockParams);
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return the course if the user owns it', async () => {
      const response = await GET(new NextRequest('http://localhost/api/courses/course-123'), mockParams);
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.name).toBe('Test Course');
      expect(responseBody.code).toBe('TC101');
    });
    
    it('should return 404 if the course is not found', async () => {
      Course.findById = jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null)
      }));
      
      const response = await GET(new NextRequest('http://localhost/api/courses/not-found'), { params: { id: 'not-found' } });
      expect(response.status).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Course not found' });
    });

    it('should return 403 if the user does not have access to the course', async () => {
      mockCourse.owner = 'different-user-id';
      mockCourse.sharedWith = [];
      
      const response = await GET(new NextRequest('http://localhost/api/courses/course-123'), mockParams);
      expect(response.status).toBe(403);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Access denied' });
    });
  });
  
  describe('PUT /api/courses/[id]', () => {
    it('should update the course if user is owner', async () => {
      const updateData = {
        name: 'Updated Course',
        code: 'UC101',
        description: 'An updated course'
      };
      
      const response = await PUT(
        new NextRequest('http://localhost/api/courses/course-123', {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }),
        mockParams
      );
      
      expect(response.status).toBe(200);
      expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
        'course-123',
        expect.objectContaining(updateData),
        { new: true }
      );
    });
    
    it('should return 403 if user is not owner', async () => {
      mockCourse.owner = 'different-user-id';
      
      const updateData = {
        name: 'Updated Course',
        code: 'UC101'
      };
      
      const response = await PUT(
        new NextRequest('http://localhost/api/courses/course-123', {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }),
        mockParams
      );
      
      expect(response.status).toBe(403);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Only the owner can update this course' });
    });
  });
  
  describe('DELETE /api/courses/[id]', () => {
    it('should delete the course if user is owner', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost/api/courses/course-123'),
        mockParams
      );
      
      expect(response.status).toBe(200);
      expect(Course.findByIdAndDelete).toHaveBeenCalledWith('course-123');
    });
    
    it('should return 403 if user is not owner', async () => {
      mockCourse.owner = 'different-user-id';
      
      const response = await DELETE(
        new NextRequest('http://localhost/api/courses/course-123'),
        mockParams
      );
      
      expect(response.status).toBe(403);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Only the owner can delete this course' });
    });
  });
});
