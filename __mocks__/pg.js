// PostgreSQL (pg) mock
const mockClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  end: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  end: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

const Client = jest.fn().mockImplementation(() => mockClient);
const Pool = jest.fn().mockImplementation(() => mockPool);

module.exports = {
  Client,
  Pool,
};
