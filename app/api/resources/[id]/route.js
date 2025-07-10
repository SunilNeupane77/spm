import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Resource from '@/models/Resource';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Helper function to check if the user has access to the resource
async function checkResourceAccess(resourceId, userId) {
  const resource = await Resource.findById(resourceId);
  
  if (!resource) {
    return { error: 'Resource not found', status: 404 };
  }
  
  // Check if the resource is public
  if (resource.isPublic) {
    return { resource, isOwner: resource.owner.toString() === userId };
  }
  
  // Check if the user owns the resource or it's shared with them
  const isOwner = resource.owner.toString() === userId;
  const isSharedWith = resource.sharedWith.some(share => 
    share.user.toString() === userId
  );
  
  if (!isOwner && !isSharedWith) {
    return { error: 'Access denied', status: 403 };
  }
  
  return { resource, isOwner };
}

// GET /api/resources/[id] - Get a specific resource
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { resource, error, status } = await checkResourceAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Populate course and owner information
    await resource.populate('course', 'name code');
    await resource.populate('owner', 'name email');
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error(`Failed to fetch resource ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

// PUT /api/resources/[id] - Update a specific resource
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { resource, isOwner, error, status } = await checkResourceAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only resource owner or user with edit permission can update
    const isSharedWithEditPermission = resource.sharedWith.some(share => 
      share.user.toString() === session.user.id && share.permission === 'edit'
    );
    
    if (!isOwner && !isSharedWithEditPermission) {
      return NextResponse.json({ error: 'You do not have permission to edit this resource' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Update resource
    Object.keys(data).forEach(key => {
      // Only the owner can change ownership or sharing settings
      if ((key === 'owner' || key === 'sharedWith' || key === 'isPublic') && !isOwner) {
        return;
      }
      
      if (key !== '_id') {
        resource[key] = data[key];
      }
    });
    
    await resource.save();
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error(`Failed to update resource ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

// DELETE /api/resources/[id] - Delete a specific resource
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { resource, isOwner, error, status } = await checkResourceAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only resource owner can delete
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the resource owner can delete it' }, { status: 403 });
    }
    
    const deletedResource = { ...resource.toObject() };
    await resource.deleteOne();
    
    return NextResponse.json({ 
      message: 'Resource deleted successfully',
      course: deletedResource.course
    });
  } catch (error) {
    console.error(`Failed to delete resource ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
