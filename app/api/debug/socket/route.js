import { authOptions } from '@/lib/auth';
import { activeSessions } from '@/lib/socketMiddleware';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * Debug endpoint for Socket.IO status
 */
export async function GET(req) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get Socket.IO server status
    const socketServerExists = Boolean(req.socket.server.io);
    const sessionsCount = req.socket.server.sessions ? req.socket.server.sessions.size : 0;
    
    // Get active mindmap sessions
    const mindmapSessions = [];
    
    for (const [mindmapId, users] of activeSessions.entries()) {
      mindmapSessions.push({
        mindmapId,
        userCount: users.size,
        users: Array.from(users.values()).map(u => ({
          userId: u.userId,
          socketId: u.socketId,
          joinedAt: u.joinedAt
        }))
      });
    }
    
    // Return debug information
    return NextResponse.json({
      status: 'ok',
      socketServerInitialized: socketServerExists,
      activeSessions: mindmapSessions,
      sessionsCount,
      currentUser: {
        id: session.user.id,
        name: session.user.name
      }
    });
    
  } catch (error) {
    console.error('Socket debug error:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
