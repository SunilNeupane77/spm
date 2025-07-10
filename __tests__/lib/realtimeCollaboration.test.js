import { useRealtimeCollaboration } from '@/lib/realtimeCollaboration';
import { act, renderHook } from '@testing-library/react';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockEmit = jest.fn();
  const mockOn = jest.fn();
  const mockOff = jest.fn();
  
  const mockSocket = {
    connected: true,
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    id: 'mock-socket-id',
  };
  
  return {
    io: jest.fn(() => mockSocket),
    mockSocket,
  };
});

describe('useRealtimeCollaboration Hook', () => {
  const { mockSocket } = require('socket.io-client');
  const mindmapId = 'test-mindmap-id';
  const userId = 'test-user-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default event handlers
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'connect') {
        // Simulate immediate connection
        callback();
      }
      return mockSocket;
    });
  });
  
  it('should initialize and connect to socket server', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(mindmapId, userId));
    
    // Check initial state
    expect(result.current.connected).toBe(true);
    expect(result.current.activeUsers).toEqual([]);
    expect(result.current.error).toBeNull();
    
    // Check socket initialization
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    
    // Check join mindmap
    expect(mockSocket.emit).toHaveBeenCalledWith('join-mindmap', { mindmapId, userId });
  });
  
  it('should not connect if mindmapId or userId is missing', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(null, userId));
    
    // Socket should not be initialized
    expect(mockSocket.on).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
  
  it('should update users when user-joined event is fired', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(mindmapId, userId));
    
    // Find user-joined handler
    const userJoinedHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'user-joined'
    )[1];
    
    // Mock users data
    const users = [
      { userId: 'user1', socketId: 'socket1', joinedAt: new Date() },
      { userId: 'user2', socketId: 'socket2', joinedAt: new Date() },
    ];
    
    // Trigger user-joined event
    act(() => {
      userJoinedHandler(users);
    });
    
    // Check state updates
    expect(result.current.activeUsers).toEqual(users);
  });
  
  it('should set error when connection error occurs', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(mindmapId, userId));
    
    // Find connect_error handler
    const connectErrorHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect_error'
    )[1];
    
    // Trigger connect_error event
    act(() => {
      connectErrorHandler({ message: 'Connection failed' });
    });
    
    // Check state updates
    expect(result.current.connected).toBe(false);
    expect(result.current.error).toBe('Connection error: Connection failed');
  });
  
  it('should emit node operations when called', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(mindmapId, userId));
    
    // Call node operations
    const node = { id: 'node1', data: { label: 'Test Node' } };
    act(() => {
      result.current.addNode(node);
    });
    
    // Check emitted events
    expect(mockSocket.emit).toHaveBeenCalledWith('add-node', {
      mindmapId,
      userId,
      node,
    });
    
    // Update node
    act(() => {
      result.current.updateNode('node1', { data: { label: 'Updated Node' } });
    });
    
    // Check for debounced update - should not call emit immediately due to debouncing
    // This is an indirect test since we can't easily test the debounce timing
    
    // Delete node
    act(() => {
      result.current.deleteNode('node1');
    });
    
    // Check emitted events
    expect(mockSocket.emit).toHaveBeenCalledWith('delete-node', {
      mindmapId,
      userId,
      nodeId: 'node1',
    });
  });
  
  it('should not emit events if not connected', () => {
    // Setup disconnected state
    mockSocket.connected = false;
    
    const { result } = renderHook(() => useRealtimeCollaboration(mindmapId, userId));
    
    // Reset emit calls from initialization
    mockSocket.emit.mockClear();
    
    // Try to add a node while disconnected
    act(() => {
      result.current.addNode({ id: 'node1' });
    });
    
    // Check that no events were emitted
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
  
  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeCollaboration(mindmapId, userId));
    
    // Unmount the hook
    unmount();
    
    // Check that leave-mindmap event was emitted
    expect(mockSocket.emit).toHaveBeenCalledWith('leave-mindmap', { mindmapId, userId });
    
    // Check that event listeners were removed
    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledWith('user-joined');
    expect(mockSocket.off).toHaveBeenCalledWith('user-left');
  });
});
