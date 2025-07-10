import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Resource from '@/models/Resource';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// POST /api/resources/[id]/share - Share a resource with another user
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const { email, permission = 'view' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 });
    }
    
    await dbConnect();
    
    // Find the resource
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    
    // Only the owner can share the resource
    if (resource.owner.toString() !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only the resource owner can share it' 
      }, { status: 403 });
    }
    
    // Find the user to share with
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found with that email'
      }, { status: 404 });
    }
    
    // Don't share with yourself
    if (user._id.toString() === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot share resource with yourself'
      }, { status: 400 });
    }
    
    // Check if already shared with this user
    const existingShareIndex = resource.sharedWith.findIndex(
      share => share.user.toString() === user._id.toString()
    );
    
    if (existingShareIndex !== -1) {
      // Update existing permission
      resource.sharedWith[existingShareIndex].permission = permission;
    } else {
      // Add new shared user
      resource.sharedWith.push({
        user: user._id,
        permission
      });
    }
    
    await resource.save();
    
    return NextResponse.json({
      message: 'Resource shared successfully',
      sharedWith: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        },
        permission
      }
    });
    
  } catch (error) {
    console.error(`Failed to share resource ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to share resource' }, { status: 500 });
  }
}

// DELETE /api/resources/[id]/share - Remove a user's access to a resource
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    await dbConnect();
    
    // Find the resource
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    
    // Only the owner can modify sharing settings
    if (resource.owner.toString() !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only the resource owner can modify sharing settings' 
      }, { status: 403 });
    }
    
    // Remove the user from sharedWith
    const initialLength = resource.sharedWith.length;
    resource.sharedWith = resource.sharedWith.filter(
      share => share.user.toString() !== userId
    );
    
    if (resource.sharedWith.length === initialLength) {
      return NextResponse.json({ 
        error: 'User not found in sharing list'
      }, { status: 404 });
    }
    
    await resource.save();
    
    return NextResponse.json({ 
      message: 'User access removed successfully'
    });
    
  } catch (error) {
    console.error(`Failed to update sharing for resource ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update sharing settings' }, { status: 500 });
  }
}
