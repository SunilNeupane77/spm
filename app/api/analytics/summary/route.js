import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Mindmap from '@/models/Mindmap';
import Resource from '@/models/Resource';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/analytics/summary - Get an overall summary of user activity
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Count all user resources
    const courseCount = await Course.countDocuments({
      $or: [
        { owner: session.user.id },
        { sharedWith: { $elemMatch: { user: session.user.id } } }
      ]
    });
    
    const taskCount = await Task.countDocuments({
      $or: [
        { owner: session.user.id },
        { 'collaborators.user': session.user.id }
      ]
    });
    
    const mindmapCount = await Mindmap.countDocuments({
      $or: [
        { owner: session.user.id },
        { sharedWith: { $elemMatch: { user: session.user.id } } }
      ]
    });
    
    const resourceCount = await Resource.countDocuments({
      $or: [
        { owner: session.user.id },
        { sharedWith: { $elemMatch: { user: session.user.id } } }
      ]
    });
    
    // Get completion metrics
    const tasks = await Task.find({
      $or: [
        { owner: session.user.id },
        { 'collaborators.user': session.user.id }
      ]
    });
    
    const completedTaskCount = tasks.filter(task => task.status === 'completed').length;
    const overdueTaskCount = tasks.filter(task => task.status === 'overdue').length;
    const taskCompletionRate = tasks.length > 0
      ? (completedTaskCount / tasks.length) * 100
      : 0;
    
    // Calculate average progress across all tasks
    const avgTaskProgress = tasks.length > 0
      ? tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
      : 0;
    
    // Get most active course (with most tasks)
    const coursesWithTaskCounts = await Course.aggregate([
      {
        $match: {
          $or: [
            { owner: session.user.id },
            { 'sharedWith.user': session.user.id }
          ]
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'course',
          as: 'tasks'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          code: 1,
          color: 1,
          taskCount: { $size: '$tasks' }
        }
      },
      {
        $sort: { taskCount: -1 }
      },
      {
        $limit: 1
      }
    ]);
    
    const mostActiveCourse = coursesWithTaskCounts.length > 0
      ? coursesWithTaskCounts[0]
      : null;
    
    return NextResponse.json({
      counts: {
        courses: courseCount,
        tasks: taskCount,
        mindmaps: mindmapCount,
        resources: resourceCount
      },
      taskMetrics: {
        completed: completedTaskCount,
        overdue: overdueTaskCount,
        completionRate: taskCompletionRate,
        avgProgress: avgTaskProgress
      },
      mostActiveCourse
    });
  } catch (error) {
    console.error('Failed to fetch analytics summary:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics summary' }, { status: 500 });
  }
}
