import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Mindmap from '@/models/Mindmap';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Helper function to check if the user has access to the mindmap
async function checkMindmapAccess(mindmapId, userId) {
  const mindmap = await Mindmap.findById(mindmapId);
  
  if (!mindmap) {
    return { error: 'Mindmap not found', status: 404 };
  }
  
  // Check if the user owns the mindmap or is a collaborator
  const isOwner = mindmap.owner.toString() === userId;
  const isSharedWith = mindmap.sharedWith && mindmap.sharedWith.some(share => 
    share.user.toString() === userId
  );
  
  if (!isOwner && !isSharedWith) {
    return { error: 'Access denied', status: 403 };
  }
  
  return { mindmap, isOwner };
}

// GET /api/mindmaps/:id - Get a specific mindmap
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { mindmap, error, status } = await checkMindmapAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Populate references
    await mindmap.populate('course', 'name code color');
    await mindmap.populate('owner', 'name email');
    await mindmap.populate('sharedWith.user', 'name email');
    
    return NextResponse.json(mindmap);
  } catch (error) {
    console.error(`Failed to fetch mindmap ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch mindmap' }, { status: 500 });
  }
}

// PUT /api/mindmaps/:id - Update a mindmap
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    await dbConnect();
    
    const { mindmap, isOwner, error, status } = await checkMindmapAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only owner can update certain fields
    if (!isOwner) {
      const restrictedFields = ['title', 'course', 'owner', 'sharedWith'];
      const hasRestrictedField = restrictedFields.some(field => data[field] !== undefined);
      
      if (hasRestrictedField) {
        return NextResponse.json({ error: 'You do not have permission to update these fields' }, { status: 403 });
      }
    }
    
    // Update mindmap
    const updatedMindmap = await Mindmap.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    await updatedMindmap.populate('course', 'name code color');
    await updatedMindmap.populate('owner', 'name email');
    
    return NextResponse.json(updatedMindmap);
  } catch (error) {
    console.error(`Failed to update mindmap ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update mindmap' }, { status: 500 });
  }
}

// DELETE /api/mindmaps/:id - Delete a mindmap
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { mindmap, isOwner, error, status } = await checkMindmapAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only owner can delete
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the owner can delete this mindmap' }, { status: 403 });
    }
    
    // Delete mindmap
    await Mindmap.findByIdAndDelete(params.id);
    
    return NextResponse.json({ message: 'Mindmap deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete mindmap ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete mindmap' }, { status: 500 });
  }
}
