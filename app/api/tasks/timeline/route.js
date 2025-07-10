import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/tasks/timeline - Get tasks for timeline within a date range
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const courseId = searchParams.get('courseId');
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }
    
    // Build query
    const query = { 
      $or: [
        { owner: session.user.id },
        { 'collaborators.user': session.user.id }
      ],
      $or: [
        // Tasks that start within the range
        { 
          startDate: { 
            $gte: new Date(startDate), 
            $lte: new Date(endDate) 
          } 
        },
        // Tasks that end within the range
        { 
          dueDate: { 
            $gte: new Date(startDate), 
            $lte: new Date(endDate) 
          } 
        },
        // Tasks that span the entire range
        {
          startDate: { $lte: new Date(startDate) },
          dueDate: { $gte: new Date(endDate) }
        }
      ]
    };
    
    if (courseId) {
      query.course = courseId;
    }
    
    // Get tasks
    const tasks = await Task.find(query)
      .sort({ startDate: 1 })
      .populate('course', 'name code color')
      .populate('owner', 'name email');
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch timeline tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline tasks' }, { status: 500 });
  }
}
