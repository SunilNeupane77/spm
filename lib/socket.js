'use client';

import io from 'socket.io-client';

// Socket instance (initialized only on client-side)
let socket = null;


export function initializeSocket(options = {}) {
  if (socket) {
    return socket;
  }
  
  // Create socket using the absolute URL of the current page
  const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Default options for the socket connection
  const defaultOptions = {
    path: '/api/socket',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  };
  
  // Create and return the socket instance
  socket = io(socketUrl, { ...defaultOptions, ...options });
  return socket;
}

export function getSocket(options = {}) {
  if (!socket) {
    return initializeSocket(options);
  }
  return socket;
}

/**
 * Close the socket connection and clean up
 */
export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

const socketModule = {
  initializeSocket,
  getSocket,
  closeSocket
};

export default socketModule;
