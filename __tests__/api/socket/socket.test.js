import { GET as socketHandler } from '@/app/api/socket/route';
import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';
import { Server as SocketServer } from 'socket.io';

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('socket.io', () => {
  const mockSocketOn = jest.fn();
  const mockSocketTo = jest.fn().mockReturnValue({ emit: jest.fn() });
  const mockSocketJoin = jest.fn();
  const mockSocketLeave = jest.fn();
  const mockSocket = {
    on: mockSocketOn,
    to: mockSocketTo,
    join: mockSocketJoin,
    leave: mockSocketLeave,
    id: 'test-socket-id',
    userId: 'test-user-id',
  };

  const mockIo = {
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'connection') {
        callback(mockSocket);
      }
      return mockIo;
    }),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  };

  return {
    Server: jest.fn().mockImplementation(() => mockIo),
    mockIo,
    mockSocket,
  };
});

describe('Socket.IO API Route', () => {
  let req, res, mockServer;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock request and response
    ({ req, res } = createMocks({
      method: 'GET',
    }));
    
    // Mock socket server
    req.socket = {
      server: {},
    };
    
    // Mock authenticated session
    getServerSession.mockResolvedValue({
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      }
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    // Set up an unauthenticated session
    getServerSession.mockResolvedValueOnce(null);
    
    // Call the API handler
    const response = await socketHandler(req);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should initialize socket server successfully', async () => {
    // Call the API handler
    const response = await socketHandler(req);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(200);
    expect(data.message).toBe('Socket server initialized');
    
    // Check that Socket.IO server was initialized
    expect(SocketServer).toHaveBeenCalled();
    expect(req.socket.server.io).toBeDefined();
  });

  it('should return early if socket is already initialized', async () => {
    // Set up an existing socket server
    req.socket.server.io = {};
    
    // Call the API handler
    const response = await socketHandler(req);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(200);
    expect(data.message).toBe('Socket already initialized');
  });

  describe('Socket Event Handlers', () => {
    let { mockSocket, mockIo } = require('socket.io');

    beforeEach(async () => {
      // Initialize the socket server
      await socketHandler(req);
    });

    it('should set up connection handler', () => {
      // Check that connection handler is set up
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should handle join-mindmap event', () => {
      // Find the connection callback and verify it sets up the join-mindmap handler
      expect(mockSocket.on).toHaveBeenCalledWith('join-mindmap', expect.any(Function));
      
      // Get the join-mindmap handler
      const joinMindmapHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'join-mindmap'
      )[1];
      
      // Call the handler
      const mindmapId = 'test-mindmap-id';
      const userId = 'test-user-id';
      joinMindmapHandler({ mindmapId, userId });
      
      // Verify the socket joins the room
      expect(mockSocket.join).toHaveBeenCalledWith(`mindmap-${mindmapId}`);
    });

    it('should handle leave-mindmap event', () => {
      // Verify the leave-mindmap handler is set up
      expect(mockSocket.on).toHaveBeenCalledWith('leave-mindmap', expect.any(Function));
      
      // Get the leave-mindmap handler
      const leaveMindmapHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'leave-mindmap'
      )[1];
      
      // Call the handler
      const mindmapId = 'test-mindmap-id';
      const userId = 'test-user-id';
      leaveMindmapHandler({ mindmapId, userId });
      
      // Verify the socket leaves the room
      expect(mockSocket.leave).toHaveBeenCalledWith(`mindmap-${mindmapId}`);
    });

    it('should handle node operations', () => {
      // Check that node operation handlers are set up
      expect(mockSocket.on).toHaveBeenCalledWith('add-node', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('update-node', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('delete-node', expect.any(Function));
      
      // Get the add-node handler
      const addNodeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'add-node'
      )[1];
      
      // Call the handler
      const mindmapId = 'test-mindmap-id';
      const userId = 'test-user-id';
      const node = { id: 'test-node-id', data: { label: 'Test Node' } };
      addNodeHandler({ mindmapId, userId, node });
      
      // Verify the event is emitted to the room
      expect(mockSocket.to).toHaveBeenCalledWith(`mindmap-${mindmapId}`);
    });

    it('should handle edge operations', () => {
      // Check that edge operation handlers are set up
      expect(mockSocket.on).toHaveBeenCalledWith('add-edge', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('update-edge', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('delete-edge', expect.any(Function));
    });

    it('should handle disconnection', () => {
      // Check that disconnect handler is set up
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });
});
