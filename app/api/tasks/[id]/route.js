import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Helper function to check if the user has access to the task
async function checkTaskAccess(taskId, userId) {
  const task = await Task.findById(taskId);
  
  if (!task) {
    return { error: 'Task not found', status: 404 };
  }
  
  // Check if the user owns the task or is a collaborator
  const isOwner = task.owner.toString() === userId;
  const isCollaborator = task.collaborators.some(collab => 
    collab.user.toString() === userId
  );
  
  if (!isOwner && !isCollaborator) {
    return { error: 'Access denied', status: 403 };
  }
  
  return { task, isOwner };
}

// GET /api/tasks/[id] - Get a specific task
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { task, error, status } = await checkTaskAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Populate course and owner information
    await task.populate('course', 'name code color');
    await task.populate('owner', 'name email');
    
    return NextResponse.json(task);
  } catch (error) {
    console.error(`Failed to fetch task ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PATCH /api/tasks/[id] - Partially update a task (for timeline drag and drop and progress updates)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { task, isOwner, error, status } = await checkTaskAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only task owner or collaborator with edit permission can update
    const isCollaboratorWithEditPermission = task.collaborators.some(collab => 
      collab.user.toString() === session.user.id && collab.permission === 'edit'
    );
    
    if (!isOwner && !isCollaboratorWithEditPermission) {
      return NextResponse.json({ error: 'You do not have permission to edit this task' }, { status: 403 });
    }
    
    // Check if the URL contains '/progress' to handle progress updates separately
    const url = request.url;
    if (url.includes('/progress')) {
      const { progress } = await request.json();
      
      if (progress === undefined || progress < 0 || progress > 100) {
        return NextResponse.json({ error: 'Invalid progress value' }, { status: 400 });
      }
      
      // Update progress
      task.progress = progress;
      
      // Auto-update status based on progress
      if (progress === 100) {
        task.status = 'completed';
      } else if (progress > 0) {
        task.status = 'in-progress';
      }
      
      await task.save();
      
      return NextResponse.json(task);
    }
    
    // Regular PATCH update for timeline drag and drop
    const updates = await request.json();
    
    // Handle date updates - if updating start date, adjust due date to maintain duration
    if (updates.startDate && !updates.dueDate) {
      const oldDuration = new Date(task.dueDate) - new Date(task.startDate);
      const newStartDate = new Date(updates.startDate);
      updates.dueDate = new Date(newStartDate.getTime() + oldDuration).toISOString();
    }
    
    // Update task status based on progress
    if (updates.progress === 100 && (!updates.status || updates.status !== 'completed')) {
      updates.status = 'completed';
    } else if (updates.progress < 100 && updates.status === 'completed') {
      updates.status = 'in-progress';
    }
    
    // Update the task using findByIdAndUpdate for atomic updates
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('course', 'name code color').populate('owner', 'name email');
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error(`Failed to update task ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to patch task' }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Update a specific task
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { task, isOwner, error, status } = await checkTaskAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only task owner or collaborator with edit permission can update
    const isCollaboratorWithEditPermission = task.collaborators.some(collab => 
      collab.user.toString() === session.user.id && collab.permission === 'edit'
    );
    
    if (!isOwner && !isCollaboratorWithEditPermission) {
      return NextResponse.json({ error: 'You do not have permission to edit this task' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Update task
    Object.keys(data).forEach(key => {
      // Only the owner can change ownership or collaborators
      if ((key === 'owner' || key === 'collaborators') && !isOwner) {
        return;
      }
      
      if (key !== '_id') {
        task[key] = data[key];
      }
    });
    
    await task.save();
    
    return NextResponse.json(task);
  } catch (error) {
    console.error(`Failed to update task ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// The PATCH functionality for progress updates has been merged with the main PATCH handler above

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { task, isOwner, error, status } = await checkTaskAccess(params.id, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    
    // Only task owner can delete
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the task owner can delete it' }, { status: 403 });
    }
    
    const deletedTask = { ...task.toObject() };
    await task.deleteOne();
    
    return NextResponse.json({ 
      message: 'Task deleted successfully',
      course: deletedTask.course
    });
  } catch (error) {
    console.error(`Failed to delete task ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
