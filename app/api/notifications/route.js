import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// GET /api/notifications - Get notifications for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    
    // Build query
    const query = { user: session.user.id };
    
    if (isRead !== null) query.isRead = isRead === 'true';
    if (type) query.type = type;
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications/read - Mark notifications as read
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Update notifications
    const result = await Notification.updateMany(
      { 
        _id: { $in: ids },
        user: session.user.id
      },
      { $set: { isRead: true } }
    );
    
    return NextResponse.json({ 
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
