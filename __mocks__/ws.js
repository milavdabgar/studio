// WebSocket (ws) mock
const mockWebSocket = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // WebSocket.OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

const mockServer = {
  on: jest.fn(),
  close: jest.fn((callback) => callback && callback()),
  clients: new Set(),
};

const WebSocket = jest.fn().mockImplementation(() => mockWebSocket);
WebSocket.Server = jest.fn().mockImplementation(() => mockServer);

// Constants
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

module.exports = WebSocket;
