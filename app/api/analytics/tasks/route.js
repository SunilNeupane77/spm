import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Task from '@/models/Task';
import { eachDayOfInterval, endOfDay, endOfMonth, format, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/analytics/tasks - Get task analytics data
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'year'
    
    // Get date range
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        startDate = startOfDay(new Date(now.setDate(now.getDate() - now.getDay())));
        endDate = endOfDay(new Date(now.setDate(now.getDate() + 6)));
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }
    
    // Get tasks for the current user within date range
    const tasks = await Task.find({
      $or: [
        { owner: session.user.id },
        { 'collaborators.user': session.user.id }
      ],
      dueDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('course', 'name code color');
    
    // Get tasks completed over time (for trend charts)
    const completedTasks = await Task.find({
      $or: [
        { owner: session.user.id },
        { 'collaborators.user': session.user.id }
      ],
      status: 'completed',
      dueDate: {
        $gte: startOfMonth(subMonths(now, 5)),
        $lte: endOfMonth(now)
      }
    });
    
    // Compute statistics
    const totalTasks = tasks.length;
    const completedCount = tasks.filter(task => task.status === 'completed').length;
    const overdueCount = tasks.filter(task => task.status === 'overdue').length;
    const inProgressCount = tasks.filter(task => task.status === 'in-progress').length;
    const pendingCount = tasks.filter(task => task.status === 'pending').length;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
    
    // Calculate average task progress
    const avgProgress = totalTasks > 0
      ? tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks
      : 0;
    
    // Calculate task type distribution
    const typeDistribution = {
      assignment: tasks.filter(task => task.type === 'assignment').length,
      exam: tasks.filter(task => task.type === 'exam').length,
      project: tasks.filter(task => task.type === 'project').length
    };
    
    // Calculate priority distribution
    const priorityDistribution = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length
    };
    
    // Get tasks by course
    const tasksByCourse = tasks.reduce((acc, task) => {
      if (task.course) {
        const courseId = task.course._id.toString();
        if (!acc[courseId]) {
          acc[courseId] = {
            name: task.course.name,
            code: task.course.code,
            color: task.course.color,
            count: 0,
            completed: 0
          };
        }
        acc[courseId].count++;
        if (task.status === 'completed') {
          acc[courseId].completed++;
        }
      }
      return acc;
    }, {});
    
    // Generate time series data for completed tasks over months
    const monthlyCompletionData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTasks = completedTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= monthStart && taskDate <= monthEnd;
      });
      
      return {
        month: format(monthDate, 'MMM'),
        count: monthTasks.length
      };
    });
    
    // Generate daily data for current month
    const daysInCurrentMonth = eachDayOfInterval({
      start: startOfMonth(now),
      end: endOfMonth(now)
    });
    
    const dailyData = daysInCurrentMonth.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });
      
      return {
        date: format(day, 'yyyy-MM-dd'),
        day: format(day, 'd'),
        totalTasks: dayTasks.length,
        completed: dayTasks.filter(task => task.status === 'completed').length
      };
    });
    
    return NextResponse.json({
      summary: {
        totalTasks,
        completedCount,
        overdueCount,
        inProgressCount,
        pendingCount,
        completionRate,
        avgProgress
      },
      distributions: {
        type: typeDistribution,
        priority: priorityDistribution
      },
      tasksByCourse: Object.values(tasksByCourse),
      timeSeriesData: Array.isArray(period === 'month' ? monthlyCompletionData : dailyData) 
        ? (period === 'month' ? monthlyCompletionData : dailyData)
        : []
    });
  } catch (error) {
    console.error('Failed to fetch task analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch task analytics' }, { status: 500 });
  }
}
