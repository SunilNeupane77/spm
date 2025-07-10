import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/analytics/courses - Get analytics data for courses
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get courses for the current user
    const courses = await Course.find({
      $or: [
        { owner: session.user.id },
        { sharedWith: { $elemMatch: { user: session.user.id } } }
      ]
    });
    
    // Get all tasks for these courses
    const courseIds = courses.map(course => course._id);
    
    const tasks = await Task.find({
      course: { $in: courseIds }
    });
    
    // Group tasks by course and calculate stats
    const courseStats = courses.map(course => {
      const courseTasks = tasks.filter(task => 
        task.course.toString() === course._id.toString()
      );
      
      const totalTasks = courseTasks.length;
      const completedTasks = courseTasks.filter(task => task.status === 'completed').length;
      const overdueTasks = courseTasks.filter(task => task.status === 'overdue').length;
      const inProgressTasks = courseTasks.filter(task => task.status === 'in-progress').length;
      const pendingTasks = courseTasks.filter(task => task.status === 'pending').length;
      
      // Calculate average completion time (in days) for completed tasks
      let averageCompletionTime = 0;
      const completedTasksWithDates = courseTasks.filter(task => 
        task.status === 'completed' && task.startDate && task.dueDate
      );
      
      if (completedTasksWithDates.length > 0) {
        const totalCompletionDays = completedTasksWithDates.reduce((sum, task) => {
          const startDate = new Date(task.startDate);
          const dueDate = new Date(task.dueDate);
          const diffTime = Math.abs(dueDate - startDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0);
        
        averageCompletionTime = totalCompletionDays / completedTasksWithDates.length;
      }
      
      // Calculate completion rate
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      return {
        courseId: course._id,
        courseName: course.name,
        courseCode: course.code,
        color: course.color,
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        averageCompletionTime
      };
    });
    
    return NextResponse.json(courseStats);
  } catch (error) {
    console.error('Failed to fetch course analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch course analytics' }, { status: 500 });
  }
}
