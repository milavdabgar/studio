// BullMQ mock
const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: '1', data: {} }),
  process: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
};

const mockWorker = {
  on: jest.fn(),
  close: jest.fn(),
};

module.exports = {
  Queue: jest.fn().mockImplementation(() => mockQueue),
  Worker: jest.fn().mockImplementation(() => mockWorker),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
};
