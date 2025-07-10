import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Resource from '@/models/Resource';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/courses/[id]/resources - Get all resources for a specific course
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    await dbConnect();
    
    // First check if the user has access to the course
    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check course access permission
    const isOwner = course.owner.toString() === session.user.id;
    const isSharedWith = course.sharedWith.some(share => 
      share.user.toString() === session.user.id
    );
    
    if (!isOwner && !isSharedWith) {
      return NextResponse.json({ 
        error: 'You do not have access to this course' 
      }, { status: 403 });
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const topic = searchParams.get('topic');
    const tag = searchParams.get('tag');
    
    // Build query for resources
    const query = { 
      course: id,
      $or: [
        { owner: session.user.id },
        { 'sharedWith.user': session.user.id },
        { isPublic: true }
      ]
    };
    
    if (type) query.type = type;
    if (topic) query.topic = topic;
    if (tag) query.tags = tag;
    
    // Get resources
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .populate('owner', 'name email');
    
    return NextResponse.json(resources);
  } catch (error) {
    console.error(`Failed to fetch resources for course ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch course resources' 
    }, { status: 500 });
  }
}

// POST /api/courses/[id]/resources - Add a resource to a course
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json({ 
        error: 'Title is required',
        field: 'title'
      }, { status: 400 });
    }
    
    if (!data.type || !['document', 'video', 'link', 'book', 'article', 'other'].includes(data.type)) {
      return NextResponse.json({ 
        error: 'Valid resource type is required',
        field: 'type' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Check course exists and user has access
    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const isOwner = course.owner.toString() === session.user.id;
    const canEdit = course.sharedWith.some(share => 
      share.user.toString() === session.user.id && share.permission === 'edit'
    );
    
    if (!isOwner && !canEdit) {
      return NextResponse.json({ 
        error: 'You do not have permission to add resources to this course' 
      }, { status: 403 });
    }
    
    // Create resource with course association
    const resource = await Resource.create({
      ...data,
      course: id,
      owner: session.user.id
    });
    
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error(`Failed to add resource to course ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to add resource to course',
      message: error.message 
    }, { status: 500 });
  }
}
