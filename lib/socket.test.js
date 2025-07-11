/**
 * Simple test to verify socket.io client module functionality
 */
import { closeSocket, getSocket, initializeSocket } from './socket';

describe('Socket.io client module', () => {
  beforeEach(() => {
    // Mock window.location
    global.window = {
      location: {
        origin: 'http://localhost:3000'
      }
    };
  });
  
  afterEach(() => {
    closeSocket();
  });
  
  it('should create a socket instance', () => {
    const socket = initializeSocket({ auth: { userId: '123' } });
    expect(socket).toBeDefined();
    
    // Should return the same instance
    const sameSocket = getSocket();
    expect(sameSocket).toBe(socket);
  });
  
  it('should initialize with correct options', () => {
    const options = { 
      auth: { userId: '123', token: 'test-token' },
      path: '/custom-socket-path'
    };
    
    const socket = initializeSocket(options);
    
    // Check that options were passed correctly
    expect(socket.io.opts.path).toBe('/custom-socket-path');
    expect(socket.io.opts.auth).toEqual({ userId: '123', token: 'test-token' });
  });
});
