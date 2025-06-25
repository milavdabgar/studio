// UUID mock
const uuid = {
  v4: jest.fn().mockReturnValue('test-uuid-12345'),
  v1: jest.fn().mockReturnValue('test-uuid-v1-12345'),
  validate: jest.fn().mockReturnValue(true),
  version: jest.fn().mockReturnValue(4),
};

module.exports = uuid;
