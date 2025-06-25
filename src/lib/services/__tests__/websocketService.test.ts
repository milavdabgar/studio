import { WebSocketService } from '../websocketService';
import { Server } from 'ws';
import http from 'http';
import { AddressInfo } from 'net';
import WebSocket from 'ws';

// Mock WebSocket server
jest.mock('ws', () => {
  const mockServer = {
    on: jest.fn(),
    close: jest.fn((callback) => callback()),
    clients: new Set(),
  };
  
  const mockWebSocket = {
    on: jest.fn(),
    send: jest.fn(),
    readyState: 1, // WebSocket.OPEN constant value
    close: jest.fn(),
  };
  
  return {
    Server: jest.fn().mockImplementation(() => mockServer),
    WebSocket: jest.fn().mockImplementation(() => mockWebSocket),
    mockServer,
    mockWebSocket,
  };
});

// Mock Redis pub/sub
jest.mock('@/lib/redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  })),
}));

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  let httpServer: http.Server;
  let port: number;
  
  const { mockServer, mockWebSocket } = require('ws');
  
  beforeAll((done) => {
    httpServer = http.createServer();
    httpServer.listen(0, () => {
      const address = httpServer.address() as AddressInfo;
      port = address.port;
      done();
    });
  });
  
  afterAll((done) => {
    httpServer.close(done);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    webSocketService = WebSocketService.getInstance();
    // Reset singleton instance for testing
    (WebSocketService as any).instance = null;
  });
  
  afterEach(async () => {
    await webSocketService.close();
  });

  describe('initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = WebSocketService.getInstance();
      const instance2 = WebSocketService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
    
    it('should initialize WebSocket server', () => {
      webSocketService.initialize(httpServer);
      
      expect(WebSocket.Server).toHaveBeenCalledWith({
        server: httpServer,
        path: '/ws',
      });
      
      // Verify event handlers are set up
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockServer.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
    
    it('should initialize Redis pub/sub if enabled', () => {
      webSocketService.initialize(httpServer, { enableRedis: true });
      
      const redis = require('@/lib/redis');
      expect(redis.createClient).toHaveBeenCalledTimes(2); // One for pub, one for sub
    });
  });
  
  describe('connection handling', () => {
    let connectionHandler: Function;
    
    beforeEach(() => {
      webSocketService.initialize(httpServer);
      // Get the connection handler
      connectionHandler = (mockServer.on as jest.Mock).mock.calls.find(
        (call: any) => call[0] === 'connection'
      )[1];
    });
    
    it('should handle new WebSocket connections', () => {
      const ws: any = { on: jest.fn() };
      const req = { url: '/ws?token=test-token' };
      
      connectionHandler(ws, req);
      
      // Verify WebSocket event handlers are set up
      expect(ws.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(ws.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(ws.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
    
    it('should authenticate connection with JWT token', () => {
      const verifyMock = jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({ userId: '123' });
      
      const ws: any = { on: jest.fn(), send: jest.fn() };
      const req = { url: '/ws?token=valid.token.here' };
      
      connectionHandler(ws, req);
      
      // Get the message handler
      const messageHandler = (ws.on as jest.Mock).mock.calls.find(
        (call: any) => call[0] === 'message'
      )[1];
      
      // Simulate authentication message
      messageHandler(JSON.stringify({
        type: 'auth',
        token: 'valid.token.here',
      }));
      
      expect(verifyMock).toHaveBeenCalledWith('valid.token.here', expect.any(String));
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'auth',
        status: 'success',
      }));
      
      verifyMock.mockRestore();
    });
    
    it('should reject invalid JWT token', () => {
      const verifyMock = jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const ws: any = { on: jest.fn(), send: jest.fn(), close: jest.fn() };
      const req = { url: '/ws?token=invalid.token' };
      
      connectionHandler(ws, req);
      
      // Get the message handler
      const messageHandler = (ws.on as jest.Mock).mock.calls.find(
        (call: any) => call[0] === 'message'
      )[1];
      
      // Simulate authentication message
      messageHandler(JSON.stringify({
        type: 'auth',
        token: 'invalid.token',
      }));
      
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'auth',
        status: 'error',
        error: 'Invalid token',
      }));
      expect(ws.close).toHaveBeenCalled();
      
      verifyMock.mockRestore();
    });
  });
  
  describe('message handling', () => {
    let messageHandler: Function;
    let ws: any;
    
    beforeEach(() => {
      webSocketService.initialize(httpServer);
      
      // Mock authenticated connection
      ws = {
        id: 'test-client-1',
        userId: 'user-123',
        on: jest.fn(),
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };
      
      // Add to clients
      (webSocketService as any).clients.set(ws.id, ws);
      
      // Get the message handler
      const connectionHandler = (mockServer.on as jest.Mock).mock.calls.find(
        (call: any) => call[0] === 'connection'
      )[1];
      
      connectionHandler(ws, { url: '/ws' });
      
      messageHandler = (ws.on as jest.Mock).mock.calls.find(
        (call: any) => call[0] === 'message'
      )[1];
    });
    
    it('should handle ping message', () => {
      messageHandler(JSON.stringify({
        type: 'ping',
      }));
      
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'pong',
        timestamp: expect.any(Number),
      }));
    });
    
    it('should broadcast message to all clients', () => {
      const otherClient = {
        id: 'test-client-2',
        userId: 'user-456',
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };
      
      (webSocketService as any).clients.set(otherClient.id, otherClient);
      
      const message = {
        type: 'chat',
        content: 'Hello, world!',
      };
      
      messageHandler(JSON.stringify({
        ...message,
        broadcast: true,
      }));
      
      expect(ws.send).not.toHaveBeenCalled(); // Original sender shouldn't receive their own broadcast
      expect(otherClient.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
    
    it('should send private message to specific user', () => {
      const targetClient = {
        id: 'target-client',
        userId: 'user-789',
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };
      
      (webSocketService as any).clients.set(targetClient.id, targetClient);
      
      const message = {
        type: 'private',
        to: 'user-789',
        content: 'Secret message',
      };
      
      messageHandler(JSON.stringify(message));
      
      expect(targetClient.send).toHaveBeenCalledWith(JSON.stringify({
        ...message,
        from: 'user-123',
      }));
    });
  });
  
  describe('room management', () => {
    let ws: any;
    let messageHandler: Function;
    
    beforeEach(() => {
      webSocketService.initialize(httpServer);
      
      // Mock authenticated connection
      ws = {
        id: 'test-client-1',
        userId: 'user-123',
        on: jest.fn(),
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };
      
      // Add to clients
      (webSocketService as any).clients.set(ws.id, ws);
      
      // Get the message handler
      const connectionHandler = (mockServer.on as jest.Mock).mock.calls.find(
        (call: any) => call[0] === 'connection'
      )[1];
      
      connectionHandler(ws, { url: '/ws' });
      
      messageHandler = (ws.on as jest.Mock).mock.calls.find(
        (call: any) => call[0] === 'message'
      )[1];
    });
    
    it('should allow joining a room', () => {
      messageHandler(JSON.stringify({
        type: 'room:join',
        room: 'room-1',
      }));
      
      const rooms = (webSocketService as any).rooms;
      expect(rooms.get('room-1')).toContain(ws.id);
      
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'room:joined',
        room: 'room-1',
      }));
    });
    
    it('should allow leaving a room', () => {
      // First join the room
      (webSocketService as any).rooms.set('room-1', new Set([ws.id]));
      
      messageHandler(JSON.stringify({
        type: 'room:leave',
        room: 'room-1',
      }));
      
      const rooms = (webSocketService as any).rooms;
      expect(rooms.get('room-1')?.has(ws.id)).toBe(false);
      
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'room:left',
        room: 'room-1',
      }));
    });
    
    it('should broadcast to room', () => {
      const roomClient1 = {
        id: 'room-client-1',
        userId: 'user-456',
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };
      
      const roomClient2 = {
        id: 'room-client-2',
        userId: 'user-789',
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };
      
      // Add clients to room
      (webSocketService as any).clients.set(roomClient1.id, roomClient1);
      (webSocketService as any).clients.set(roomClient2.id, roomClient2);
      (webSocketService as any).rooms.set('room-1', new Set([ws.id, roomClient1.id, roomClient2.id]));
      
      const message = {
        type: 'room:message',
        room: 'room-1',
        content: 'Hello room!',
      };
      
      messageHandler(JSON.stringify(message));
      
      // Original sender should not receive their own message
      expect(ws.send).not.toHaveBeenCalled();
      
      // Other room members should receive the message
      expect(roomClient1.send).toHaveBeenCalledWith(JSON.stringify({
        ...message,
        from: 'user-123',
      }));
      
      expect(roomClient2.send).toHaveBeenCalledWith(JSON.stringify({
        ...message,
        from: 'user-123',
      }));
    });
  });
  
  describe('cleanup', () => {
    it('should clean up resources on close', async () => {
      const mockRedisPub = { quit: jest.fn().mockResolvedValue('OK') };
      const mockRedisSub = { quit: jest.fn().mockResolvedValue('OK') };
      
      // Initialize with Redis
      webSocketService.initialize(httpServer, { enableRedis: true });
      
      // Mock Redis clients
      (webSocketService as any).redisPub = mockRedisPub;
      (webSocketService as any).redisSub = mockRedisSub;
      
      await webSocketService.close();
      
      expect(mockServer.close).toHaveBeenCalled();
      expect(mockRedisPub.quit).toHaveBeenCalled();
      expect(mockRedisSub.quit).toHaveBeenCalled();
    });
  });
});
