import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Mindmap from '@/models/Mindmap';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/analytics/mindmaps - Get analytics data for mindmaps
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get mindmaps for the current user
    const mindmaps = await Mindmap.find({
      $or: [
        { owner: session.user.id },
        { sharedWith: { $elemMatch: { user: session.user.id } } }
      ]
    }).populate('course', 'name code color');
    
    // Get course IDs from mindmaps to find related courses
    const courseIds = mindmaps
      .filter(mindmap => mindmap.course)
      .map(mindmap => mindmap.course._id);
    
    // Get courses for these mindmaps
    const courses = await Course.find({
      _id: { $in: courseIds }
    });
    
    // Calculate mindmap statistics
    const totalMindmaps = mindmaps.length;
    const mindmapsWithCourses = mindmaps.filter(m => m.course).length;
    const averageNodesPerMap = mindmaps.reduce((sum, map) => 
      sum + (map.nodes ? map.nodes.length : 0), 0) / (totalMindmaps || 1);
    const averageEdgesPerMap = mindmaps.reduce((sum, map) => 
      sum + (map.edges ? map.edges.length : 0), 0) / (totalMindmaps || 1);
    
    // Calculate node types distribution
    const nodeTypeDistribution = mindmaps.reduce((acc, map) => {
      if (map.nodes && map.nodes.length > 0) {
        map.nodes.forEach(node => {
          const type = node.type || 'custom';
          acc[type] = (acc[type] || 0) + 1;
        });
      }
      return acc;
    }, {});
    
    // Calculate mindmaps by course
    const mindmapsByCourse = courses.map(course => {
      const courseMindmaps = mindmaps.filter(
        mindmap => mindmap.course && mindmap.course._id.toString() === course._id.toString()
      );
      
      const totalNodes = courseMindmaps.reduce((sum, map) => 
        sum + (map.nodes ? map.nodes.length : 0), 0);
      
      return {
        courseId: course._id,
        courseName: course.name,
        courseCode: course.code,
        color: course.color,
        mindmapsCount: courseMindmaps.length,
        nodesCount: totalNodes,
        averageNodesPerMap: totalNodes / (courseMindmaps.length || 1)
      };
    });
    
    // Get recently modified mindmaps
    const recentMindmaps = [...mindmaps]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5)
      .map(m => ({
        id: m._id,
        title: m.title,
        course: m.course ? {
          id: m.course._id,
          name: m.course.name,
          code: m.course.code,
          color: m.course.color
        } : null,
        nodeCount: m.nodes ? m.nodes.length : 0,
        lastModified: m.updatedAt || m.createdAt
      }));
    
    // Format the response
    return NextResponse.json({
      summary: {
        totalMindmaps,
        mindmapsWithCourses,
        averageNodesPerMap,
        averageEdgesPerMap
      },
      nodeTypeDistribution,
      mindmapsByCourse,
      recentMindmaps
    });
  } catch (error) {
    console.error('Failed to fetch mindmap analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch mindmap analytics' }, { status: 500 });
  }
}
