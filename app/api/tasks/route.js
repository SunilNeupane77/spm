import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/tasks - Get tasks for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    
    // Build query
    const query = { 
      $or: [
        { owner: session.user.id },
        { 'collaborators.user': session.user.id }
      ]
    };
    
    if (courseId) query.course = courseId;
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    
    // Get tasks
    const tasks = await Task.find(query)
      .sort({ dueDate: 1 })
      .populate('course', 'name code color')
      .populate('owner', 'name email');
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    await dbConnect();
    
    // Validate course access if a course is specified
    if (data.course) {
      const course = await Course.findById(data.course);
      
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      
      // Check if user has access to the course
      const isOwner = course.owner.toString() === session.user.id;
      const isSharedWithEditPermission = course.sharedWith.some(
        share => share.user.toString() === session.user.id && share.permission === 'edit'
      );
      
      if (!isOwner && !isSharedWithEditPermission) {
        return NextResponse.json({ error: 'You do not have permission to add tasks to this course' }, { status: 403 });
      }
    }
    
    // Create task
    const task = await Task.create({
      ...data,
      owner: session.user.id
    });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
