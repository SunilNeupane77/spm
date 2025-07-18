import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/courses - Get all courses for the current user
// 
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const semester = searchParams.get('semester');
    
    // Build query
    const query = { 
      $or: [
        { owner: session.user.id },
        { 'sharedWith.user': session.user.id }
      ]
    };
    
    if (year) query.year = parseInt(year);
    if (semester) query.semester = semester;
    
    // Get courses
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .populate('owner', 'name email');
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST /api/courses - Create a new course
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    await dbConnect();
    
    const course = await Course.create({
      ...data,
      owner: session.user.id
    });
    
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Failed to create course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
