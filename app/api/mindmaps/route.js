import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Mindmap from '@/models/Mindmap';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/mindmaps - Get all mindmaps for the current user
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
    
    // Build query
    const query = { 
      $or: [
        { owner: session.user.id },
        { sharedWith: { $elemMatch: { user: session.user.id } } }
      ]
    };
    
    if (courseId) query.course = courseId;
    
    // Get mindmaps
    const mindmaps = await Mindmap.find(query)
      .sort({ updatedAt: -1 })
      .populate('course', 'name code color')
      .populate('owner', 'name email');
    
    return NextResponse.json(mindmaps);
  } catch (error) {
    console.error('Failed to fetch mindmaps:', error);
    return NextResponse.json({ error: 'Failed to fetch mindmaps' }, { status: 500 });
  }
}

// POST /api/mindmaps - Create a new mindmap
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    await dbConnect();
    
    // Create mindmap
    const mindmap = await Mindmap.create({
      ...data,
      owner: session.user.id,
      nodes: data.nodes || [],
      edges: data.edges || []
    });
    
    return NextResponse.json(mindmap, { status: 201 });
  } catch (error) {
    console.error('Failed to create mindmap:', error);
    return NextResponse.json({ error: 'Failed to create mindmap' }, { status: 500 });
  }
}
