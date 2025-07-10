import { GET, POST } from '@/app/api/courses/route';
import Course from '@/models/Course';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';

// Mock the NextAuth session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock mongoose
jest.mock('@/lib/mongoose', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve())
}));

describe('Courses API', () => {
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
    
    // Mock Course.find
    Course.find = jest.fn().mockImplementation(() => ({
      sort: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue([
          {
            _id: 'course1',
            name: 'Test Course 1',
            code: 'TC101',
            owner: mockUser.id
          },
          {
            _id: 'course2',
            name: 'Test Course 2',
            code: 'TC102',
            owner: mockUser.id
          }
        ])
      }))
    }));
    
    // Mock Course.create
    Course.create = jest.fn().mockImplementation((data) => 
      Promise.resolve({
        ...data,
        _id: 'new-course-id'
      })
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/courses', () => {
    it('should return 401 if not authenticated', async () => {
      getServerSession.mockResolvedValueOnce(null);
      
      const { req } = createMocks({
        method: 'GET',
      });
      
      const response = await GET(new NextRequest('http://localhost/api/courses', { method: 'GET' }));
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return courses for the authenticated user', async () => {
      const { req } = createMocks({
        method: 'GET',
      });
      
      const response = await GET(new NextRequest('http://localhost/api/courses', { method: 'GET' }));
      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveLength(2);
      expect(responseBody[0].name).toBe('Test Course 1');
      expect(responseBody[1].name).toBe('Test Course 2');
    });
    
    it('should apply filters from query parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { year: '2025', semester: 'Fall' }
      });
      
      await GET(new NextRequest('http://localhost/api/courses?year=2025&semester=Fall', { method: 'GET' }));
      
      expect(Course.find).toHaveBeenCalledWith({
        $or: [
          { owner: mockUser.id },
          { 'sharedWith.user': mockUser.id }
        ],
        year: 2025,
        semester: 'Fall'
      });
    });
  });
  
  describe('POST /api/courses', () => {
    it('should return 401 if not authenticated', async () => {
      getServerSession.mockResolvedValueOnce(null);
      
      const { req } = createMocks({
        method: 'POST',
        body: {
          name: 'New Course',
          code: 'NC101'
        }
      });
      
      const response = await POST(
        new NextRequest('http://localhost/api/courses', {
          method: 'POST',
          body: JSON.stringify({
            name: 'New Course',
            code: 'NC101'
          })
        })
      );
      
      expect(response.status).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    it('should create a new course', async () => {
      const courseData = {
        name: 'New Course',
        code: 'NC101',
        description: 'A test course',
        instructor: 'Test Instructor',
        semester: 'Fall',
        year: 2025
      };
      
      const response = await POST(
        new NextRequest('http://localhost/api/courses', {
          method: 'POST',
          body: JSON.stringify(courseData)
        })
      );
      
      expect(response.status).toBe(201);
      
      const responseBody = await response.json();
      expect(responseBody._id).toBe('new-course-id');
      
      expect(Course.create).toHaveBeenCalledWith({
        ...courseData,
        owner: mockUser.id
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await POST(
        new NextRequest('http://localhost/api/courses', {
          method: 'POST',
          body: JSON.stringify({
            // Missing required 'name' field
            code: 'NC101'
          })
        })
      );
      
      expect(response.status).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBeTruthy();
    });
  });
});
