import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Mindmap from '@/models/Mindmap';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Helper function to check if the user has access to the mindmap
async function checkMindmapAccess(mindmapId, userId) {
  const mindmap = await Mindmap.findById(mindmapId);
  
  if (!mindmap) {
    return { error: 'Mindmap not found', status: 404 };
  }
  
  // Check if the user owns the mindmap
  const isOwner = mindmap.owner.toString() === userId;
  
  if (!isOwner) {
    return { error: 'Only the owner can share this mindmap', status: 403 };
  }
  
  return { mindmap, isOwner };
}

// POST /api/mindmaps/:id/share - Share mindmap with other users
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { email, permission } = await request.json();
    
    if (!email || !permission) {
      return NextResponse.json({ error: 'Email and permission are required' }, { status: 400 });
    }
    
    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 });
    }
    
    await dbConnect();
    
    const { mindmap, error, status } = await checkMindmapAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Find user to share with
    const userToShare = await User.findOne({ email });
    
    if (!userToShare) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Prevent sharing with self
    if (userToShare._id.toString() === session.user.id) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
    }
    
    // Check if already shared with this user
    const alreadySharedIndex = mindmap.sharedWith.findIndex(
      share => share.user.toString() === userToShare._id.toString()
    );
    
    if (alreadySharedIndex !== -1) {
      // Update permission if already shared
      mindmap.sharedWith[alreadySharedIndex].permission = permission;
    } else {
      // Add new share
      mindmap.sharedWith.push({
        user: userToShare._id,
        permission
      });
    }
    
    await mindmap.save();
    
    // Populate references for response
    await mindmap.populate('sharedWith.user', 'name email');
    
    return NextResponse.json(mindmap);
  } catch (error) {
    console.error(`Failed to share mindmap ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to share mindmap' }, { status: 500 });
  }
}

// DELETE /api/mindmaps/:id/share - Remove a user's access to a mindmap
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    await dbConnect();
    
    const { mindmap, error, status } = await checkMindmapAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Remove user from sharedWith array
    mindmap.sharedWith = mindmap.sharedWith.filter(
      share => share.user.toString() !== userId
    );
    
    await mindmap.save();
    
    return NextResponse.json({ message: 'Access removed successfully' });
  } catch (error) {
    console.error(`Failed to remove sharing for mindmap ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to remove sharing' }, { status: 500 });
  }
}
