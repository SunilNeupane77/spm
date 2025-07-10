import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Course from '@/models/Course';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// POST /api/courses/[id]/share - Share a course with another user
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get the course
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (course.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the course owner can share it' }, { status: 403 });
    }
    
    // Get share data
    const { email, permission = 'view' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Find the user to share with
    const userToShare = await User.findOne({ email });
    
    if (!userToShare) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if already shared
    const alreadyShared = course.sharedWith.find(
      share => share.user.toString() === userToShare._id.toString()
    );
    
    if (alreadyShared) {
      // Update permission if already shared
      alreadyShared.permission = permission;
    } else {
      // Add new share
      course.sharedWith.push({
        user: userToShare._id,
        permission
      });
    }
    
    await course.save();
    
    // Create notification for the user being shared with
    await Notification.create({
      user: userToShare._id,
      type: 'invitation',
      title: 'Course Shared With You',
      message: `${session.user.name} has shared the course "${course.name}" with you.`,
      relatedTo: {
        model: 'Course',
        id: course._id
      },
      isRead: false,
      deliveryMethod: ['app', 'email'],
      deliveryStatus: 'pending',
      scheduledFor: new Date()
    });
    
    return NextResponse.json({ 
      message: 'Course shared successfully', 
      sharedWith: course.sharedWith 
    });
  } catch (error) {
    console.error(`Failed to share course ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to share course' }, { status: 500 });
  }
}
