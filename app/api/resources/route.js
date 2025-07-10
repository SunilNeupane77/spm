import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Resource from '@/models/Resource';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/resources - Get resources for the current user
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
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const tag = searchParams.get('tag');
    const isPublic = searchParams.get('isPublic');
    
    // Build query
    const query = { 
      $or: [
        { owner: session.user.id },
        { 'sharedWith.user': session.user.id },
        { isPublic: true }
      ]
    };
    
    if (courseId) query.course = courseId;
    if (type) query.type = type;
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (tag) query.tags = tag;
    if (isPublic !== null) query.isPublic = isPublic === 'true';
    
    // Get resources
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .populate('course', 'name code')
      .populate('owner', 'name email');
    
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST /api/resources - Create a new resource
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    await dbConnect();
    
    // Create resource
    const resource = await Resource.create({
      ...data,
      owner: session.user.id
    });
    
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Failed to create resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
