import { authOptions } from '@/lib/auth';
import { initSocketServer } from '@/lib/socketMiddleware';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * Socket.IO handler for real-time collaboration on mindmaps
 */
export async function GET(req) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Store session user for socket authentication
    if (!req.socket.server.sessions) {
      req.socket.server.sessions = new Map();
    }
    
    // Map session user to socket for later authentication
    req.socket.server.sessions.set(session.user.id, {
      user: session.user,
      lastActive: new Date()
    });
    
    // Initialize Socket.IO server (this will return existing instance if already initialized)
    const io = initSocketServer(req);
    
    // Return success response
    return NextResponse.json({ message: 'Socket server initialized' });
    
  } catch (error) {
    console.error('Socket initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize socket server' }, { status: 500 });
  }
}
