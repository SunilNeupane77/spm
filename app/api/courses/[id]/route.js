import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Helper function to check if the user has access to the course
async function checkCourseAccess(courseId, userId) {
  const course = await Course.findById(courseId);
  
  if (!course) {
    return { error: 'Course not found', status: 404 };
  }
  
  // Check if the user owns the course or is shared with them
  const isOwner = course.owner.toString() === userId;
  const isSharedWith = course.sharedWith.some(share => 
    share.user.toString() === userId
  );
  
  if (!isOwner && !isSharedWith) {
    return { error: 'Access denied', status: 403 };
  }
  
  return { course };
}

// GET /api/courses/[id] - Get a specific course
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { course, error, status } = await checkCourseAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error(`Failed to fetch course ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

// PUT /api/courses/[id] - Update a specific course
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { course, error, status } = await checkCourseAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only course owner can update
    if (course.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the course owner can update it' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Update course
    Object.keys(data).forEach(key => {
      if (key !== 'owner' && key !== '_id') {
        course[key] = data[key];
      }
    });
    
    await course.save();
    
    return NextResponse.json(course);
  } catch (error) {
    console.error(`Failed to update course ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// DELETE /api/courses/[id] - Delete a specific course
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { course, error, status } = await checkCourseAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only course owner can delete
    if (course.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the course owner can delete it' }, { status: 403 });
    }
    
    await course.deleteOne();
    
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete course ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
