import { Server as SocketServer } from 'socket.io';

// Store for active mindmap sessions and connected users
export const activeSessions = new Map();

/**
 * Initialize a Socket.IO server with Next.js
 * @param {Object} req - The request object
 * @returns {Object} Socket.IO server instance
 */
export function initSocketServer(req) {
  // If socket.io server is already initialized for this Next.js instance, return it
  if (req.socket.server.io) {
    return req.socket.server.io;
  }
  
  // Set up Socket.IO server
  const io = new SocketServer(req.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });
  
  // Store the io instance on the server
  req.socket.server.io = io;
  
  // Add middleware for authentication and security
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    
    // Validate the connection
    if (!token || !userId) {
      return next(new Error('Authentication error'));
    }
    
    // Attach user data to the socket
    socket.userId = userId;
    socket.userData = { id: userId, lastActive: new Date() };
    next();
  });
  
  // Set up event handlers
  setupSocketEventHandlers(io);
  
  return io;
}

/**
 * Set up event handlers for Socket.IO
 * @param {Object} io - Socket.IO server instance
 */
function setupSocketEventHandlers(io) {
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    // Log connection information
    const { userId } = socket;
    console.log(`User ${userId} connected via socket ${socket.id}`);
    
    // Error handling for socket events
    socket.onAny((eventName, ...args) => {
      try {
        console.log(`Socket event received: ${eventName}`, args);
      } catch (error) {
        console.error(`Error handling socket event ${eventName}:`, error);
        socket.emit('error', { message: 'Server error processing your request' });
      }
    });

    // Join a mindmap collaboration session
    socket.on('join-mindmap', ({ mindmapId, userId }) => {
      // Add user to mindmap room
      socket.join(`mindmap-${mindmapId}`);
      
      // Track user in active sessions
      if (!activeSessions.has(mindmapId)) {
        activeSessions.set(mindmapId, new Map());
      }
      const mindmapUsers = activeSessions.get(mindmapId);
      mindmapUsers.set(userId, {
        socketId: socket.id,
        joinedAt: new Date(),
        userId,
      });
      
      // Get all users in this mindmap session
      const users = Array.from(mindmapUsers.values());
      
      // Notify everyone about the new user
      io.to(`mindmap-${mindmapId}`).emit('user-joined', users);
      
      console.log(`User ${userId} joined mindmap ${mindmapId}`);
    });

    // Leave a mindmap collaboration session
    socket.on('leave-mindmap', ({ mindmapId, userId }) => {
      socket.leave(`mindmap-${mindmapId}`);
      
      // Remove user from active sessions
      if (activeSessions.has(mindmapId)) {
        const mindmapUsers = activeSessions.get(mindmapId);
        mindmapUsers.delete(userId);
        
        // If no users left, clean up the session
        if (mindmapUsers.size === 0) {
          activeSessions.delete(mindmapId);
        } else {
          // Notify remaining users
          const users = Array.from(mindmapUsers.values());
          io.to(`mindmap-${mindmapId}`).emit('user-left', users);
        }
      }
      
      console.log(`User ${userId} left mindmap ${mindmapId}`);
    });

    // Handle node operations
    socket.on('add-node', ({ mindmapId, userId, node }) => {
      try {
        // Validate input
        if (!mindmapId || !userId || !node || !node.id) {
          socket.emit('error', { 
            message: 'Invalid parameters for adding node', 
            operation: 'add-node'
          });
          return;
        }
        
        // Emit to room
        socket.to(`mindmap-${mindmapId}`).emit('node-added', { userId, node });
        
        // Acknowledge success
        socket.emit('operation-success', { 
          operation: 'add-node', 
          nodeId: node.id,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error adding node:`, error);
        socket.emit('error', { 
          message: 'Server error adding node', 
          operation: 'add-node'
        });
      }
    });

    // Handle node updates
    socket.on('update-node', ({ mindmapId, userId, nodeId, updates }) => {
      try {
        // Validate input
        if (!mindmapId || !userId || !nodeId || !updates) {
          socket.emit('error', { 
            message: 'Invalid parameters for updating node',
            operation: 'update-node'
          });
          return;
        }
        
        // Emit to room
        socket.to(`mindmap-${mindmapId}`).emit('node-updated', { userId, nodeId, updates });
        
        // Acknowledge success
        socket.emit('operation-success', { 
          operation: 'update-node', 
          nodeId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error updating node:`, error);
        socket.emit('error', { 
          message: 'Server error updating node',
          operation: 'update-node'
        });
      }
    });

    // Handle node deletion
    socket.on('delete-node', ({ mindmapId, userId, nodeId }) => {
      try {
        // Validate input
        if (!mindmapId || !userId || !nodeId) {
          socket.emit('error', { 
            message: 'Invalid parameters for deleting node',
            operation: 'delete-node'
          });
          return;
        }
        
        // Emit to room
        socket.to(`mindmap-${mindmapId}`).emit('node-deleted', { userId, nodeId });
        
        // Acknowledge success
        socket.emit('operation-success', { 
          operation: 'delete-node', 
          nodeId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error deleting node:`, error);
        socket.emit('error', { 
          message: 'Server error deleting node',
          operation: 'delete-node'
        });
      }
    });

    // Handle edge operations
    socket.on('add-edge', ({ mindmapId, userId, edge }) => {
      try {
        // Validate input
        if (!mindmapId || !userId || !edge || !edge.id) {
          socket.emit('error', { 
            message: 'Invalid parameters for adding edge', 
            operation: 'add-edge'
          });
          return;
        }
        
        // Emit to room
        socket.to(`mindmap-${mindmapId}`).emit('edge-added', { userId, edge });
        
        // Acknowledge success
        socket.emit('operation-success', { 
          operation: 'add-edge', 
          edgeId: edge.id,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error adding edge:`, error);
        socket.emit('error', { 
          message: 'Server error adding edge', 
          operation: 'add-edge'
        });
      }
    });

    // Handle edge updates
    socket.on('update-edge', ({ mindmapId, userId, edgeId, updates }) => {
      try {
        // Validate input
        if (!mindmapId || !userId || !edgeId || !updates) {
          socket.emit('error', { 
            message: 'Invalid parameters for updating edge',
            operation: 'update-edge'
          });
          return;
        }
        
        // Emit to room
        socket.to(`mindmap-${mindmapId}`).emit('edge-updated', { userId, edgeId, updates });
        
        // Acknowledge success
        socket.emit('operation-success', { 
          operation: 'update-edge', 
          edgeId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error updating edge:`, error);
        socket.emit('error', { 
          message: 'Server error updating edge',
          operation: 'update-edge'
        });
      }
    });

    // Handle edge deletion
    socket.on('delete-edge', ({ mindmapId, userId, edgeId }) => {
      try {
        // Validate input
        if (!mindmapId || !userId || !edgeId) {
          socket.emit('error', { 
            message: 'Invalid parameters for deleting edge',
            operation: 'delete-edge'
          });
          return;
        }
        
        // Emit to room
        socket.to(`mindmap-${mindmapId}`).emit('edge-deleted', { userId, edgeId });
        
        // Acknowledge success
        socket.emit('operation-success', { 
          operation: 'delete-edge', 
          edgeId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error deleting edge:`, error);
        socket.emit('error', { 
          message: 'Server error deleting edge',
          operation: 'delete-edge'
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
      
      // Find and remove the user from all active sessions
      for (const [mindmapId, users] of activeSessions.entries()) {
        for (const [userId, user] of users.entries()) {
          if (user.socketId === socket.id) {
            users.delete(userId);
            
            // If no users left in this mindmap, clean up
            if (users.size === 0) {
              activeSessions.delete(mindmapId);
            } else {
              // Notify remaining users
              const remainingUsers = Array.from(users.values());
              io.to(`mindmap-${mindmapId}`).emit('user-left', remainingUsers);
            }
            
            break;
          }
        }
      }
    });
  });
}
