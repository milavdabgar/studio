// IORedis mock
const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  flushall: jest.fn().mockResolvedValue('OK'),
  quit: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
  multi: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

const Redis = jest.fn().mockImplementation(() => mockRedis);

module.exports = Redis;
