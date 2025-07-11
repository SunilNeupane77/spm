// This module provides real-time collaboration functionality for mindmaps
// using Socket.IO for bidirectional communication

import { getSocket } from '@/lib/socket';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Utility for debouncing events to reduce network traffic
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function useRealtimeCollaboration(mindmapId, userId) {
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [error, setError] = useState(null);
  const [lastOperationStatus, setLastOperationStatus] = useState(null);
  
  // Use refs to store values that don't need to trigger re-renders
  const socketRef = useRef(socket);
  const mindmapIdRef = useRef(mindmapId);
  const userIdRef = useRef(userId);
  
  // Update refs when props change
  useEffect(() => {
    mindmapIdRef.current = mindmapId;
    userIdRef.current = userId;
  }, [mindmapId, userId]);
  
  // Initialize socket connection with optimized connection handling
  useEffect(() => {
    if (!mindmapId || !userId) return;
    
    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      // Get or initialize the socket with authentication data
      socketRef.current = getSocket({
        path: '/api/socket',
        auth: { token: "session-token", userId }
      });
    }
    
    // Connection events with error handling
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setConnected(true);
      socketRef.current.emit('join-mindmap', { mindmapId, userId });
    });
    
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });
    
    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated the disconnect, attempt to reconnect
        socketRef.current.connect();
      }
    });
    
    // Server error events
    socketRef.current.on('error', (data) => {
      console.error('Server reported an error:', data);
      setError(`Server error: ${data.message}`);
      setLastOperationStatus({ success: false, operation: data.operation, timestamp: new Date() });
    });
    
    // Operation status
    socketRef.current.on('operation-success', (data) => {
      console.log('Operation successful:', data);
      setLastOperationStatus({ success: true, ...data });
    });
    
    // User presence with optimized state updates
    socketRef.current.on('user-joined', (users) => {
      setActiveUsers(prevUsers => {
        // Only update if the users list has changed
        if (JSON.stringify(prevUsers) !== JSON.stringify(users)) {
          return users;
        }
        return prevUsers;
      });
    });
    
    socketRef.current.on('user-left', (users) => {
      setActiveUsers(prevUsers => {
        // Only update if the users list has changed
        if (JSON.stringify(prevUsers) !== JSON.stringify(users)) {
          return users;
        }
        return prevUsers;
      });
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-mindmap', { mindmapId, userId });
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('user-joined');
        socketRef.current.off('user-left');
        socketRef.current.off('node-added');
        socketRef.current.off('node-updated');
        socketRef.current.off('node-deleted');
        socketRef.current.off('edge-added');
        socketRef.current.off('edge-updated');
        socketRef.current.off('edge-deleted');
      }
    };
  }, [mindmapId, userId]);
  
  // Debounced node operations to optimize network traffic
  const debouncedNodeUpdate = useRef(
    debounce((nodeId, updates, socket, mindmapId, userId) => {
      if (socket && socket.connected) {
        socket.emit('update-node', { mindmapId, userId, nodeId, updates });
      }
    }, 50)
  ).current;
  
  // Node operations with optimized payloads
  const addNode = useCallback((node) => {
    if (socketRef.current && connected) {
      // For adding nodes, we want immediate feedback, no debounce
      socketRef.current.emit('add-node', { 
        mindmapId: mindmapIdRef.current, 
        userId: userIdRef.current, 
        node 
      });
    }
  }, [connected]);
  
  const updateNode = useCallback((nodeId, updates) => {
    if (socketRef.current && connected) {
      // Debounce update operations to reduce network traffic
      debouncedNodeUpdate(
        nodeId, 
        updates, 
        socketRef.current, 
        mindmapIdRef.current, 
        userIdRef.current
      );
    }
  }, [connected, debouncedNodeUpdate]);
  
  const deleteNode = useCallback((nodeId) => {
    if (socketRef.current && connected) {
      // For deletion, immediate feedback is important
      socketRef.current.emit('delete-node', { 
        mindmapId: mindmapIdRef.current, 
        userId: userIdRef.current, 
        nodeId 
      });
    }
  }, [connected]);
  
  // Debounced edge operation
  const debouncedEdgeUpdate = useRef(
    debounce((edgeId, updates, socket, mindmapId, userId) => {
      if (socket && socket.connected) {
        socket.emit('update-edge', { mindmapId, userId, edgeId, updates });
      }
    }, 50)
  ).current;
  
  // Edge operations with optimized payloads
  const addEdge = useCallback((edge) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('add-edge', { 
        mindmapId: mindmapIdRef.current, 
        userId: userIdRef.current, 
        edge 
      });
    }
  }, [connected]);
  
  const updateEdge = useCallback((edgeId, updates) => {
    if (socketRef.current && connected) {
      debouncedEdgeUpdate(
        edgeId,
        updates,
        socketRef.current,
        mindmapIdRef.current,
        userIdRef.current
      );
    }
  }, [connected, debouncedEdgeUpdate]);
  
  const deleteEdge = useCallback((edgeId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('delete-edge', { 
        mindmapId: mindmapIdRef.current, 
        userId: userIdRef.current, 
        edgeId 
      });
    }
  }, [connected]);
  
  // Optimized listener for changes from other users with batching
  const subscribeToChanges = useCallback((callbacks) => {
    if (!socketRef.current) return;
    
    // Batch node updates to reduce render cycles
    const batchedNodeUpdates = new Map();
    const batchedEdgeUpdates = new Map();
    
    // Process batched updates after a brief delay
    const processBatchedNodeUpdates = debounce(() => {
      if (callbacks.onBatchedNodeUpdates && batchedNodeUpdates.size > 0) {
        const updates = Array.from(batchedNodeUpdates.entries()).map(
          ([nodeId, updates]) => ({ nodeId, updates })
        );
        callbacks.onBatchedNodeUpdates(updates);
        batchedNodeUpdates.clear();
      }
    }, 50);
    
    const processBatchedEdgeUpdates = debounce(() => {
      if (callbacks.onBatchedEdgeUpdates && batchedEdgeUpdates.size > 0) {
        const updates = Array.from(batchedEdgeUpdates.entries()).map(
          ([edgeId, updates]) => ({ edgeId, updates })
        );
        callbacks.onBatchedEdgeUpdates(updates);
        batchedEdgeUpdates.clear();
      }
    }, 50);
    
    // Node events
    socketRef.current.on('node-added', (data) => {
      if (data.userId !== userIdRef.current && callbacks.onNodeAdded) {
        callbacks.onNodeAdded(data.node);
      }
    });
    
    socketRef.current.on('node-updated', (data) => {
      if (data.userId !== userIdRef.current) {
        // For batch processing
        if (callbacks.onBatchedNodeUpdates) {
          batchedNodeUpdates.set(data.nodeId, data.updates);
          processBatchedNodeUpdates();
        } 
        // For individual processing
        else if (callbacks.onNodeUpdated) {
          callbacks.onNodeUpdated(data.nodeId, data.updates);
        }
      }
    });
    
    socketRef.current.on('node-deleted', (data) => {
      if (data.userId !== userIdRef.current && callbacks.onNodeDeleted) {
        callbacks.onNodeDeleted(data.nodeId);
      }
    });
    
    // Edge events
    socketRef.current.on('edge-added', (data) => {
      if (data.userId !== userIdRef.current && callbacks.onEdgeAdded) {
        callbacks.onEdgeAdded(data.edge);
      }
    });
    
    socketRef.current.on('edge-updated', (data) => {
      if (data.userId !== userIdRef.current) {
        // For batch processing
        if (callbacks.onBatchedEdgeUpdates) {
          batchedEdgeUpdates.set(data.edgeId, data.updates);
          processBatchedEdgeUpdates();
        } 
        // For individual processing
        else if (callbacks.onEdgeUpdated) {
          callbacks.onEdgeUpdated(data.edgeId, data.updates);
        }
      }
    });
    
    socketRef.current.on('edge-deleted', (data) => {
      if (data.userId !== userIdRef.current && callbacks.onEdgeDeleted) {
        callbacks.onEdgeDeleted(data.edgeId);
      }
    });
    
    return () => {
      socketRef.current?.off('node-added');
      socketRef.current?.off('node-updated');
      socketRef.current?.off('node-deleted');
      socketRef.current?.off('edge-added');
      socketRef.current?.off('edge-updated');
      socketRef.current?.off('edge-deleted');
    };
  }, []);
  
  // Reconnect function for manual reconnection
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  // Memoize active users to prevent unnecessary re-renders
  const memoizedActiveUsers = useMemo(() => activeUsers, [activeUsers]);

  // Return stable references
  return {
    connected,
    activeUsers: memoizedActiveUsers,
    error,
    lastOperationStatus,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    subscribeToChanges,
    reconnect,
    // Additional helper methods
    isUserActive: useCallback((checkUserId) => 
      activeUsers.some(user => user.userId === checkUserId), [activeUsers]),
  };
}
