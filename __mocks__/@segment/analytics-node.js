// Segment Analytics Node mock
const mockAnalytics = {
  track: jest.fn().mockResolvedValue(undefined),
  identify: jest.fn().mockResolvedValue(undefined),
  page: jest.fn().mockResolvedValue(undefined),
  group: jest.fn().mockResolvedValue(undefined),
  alias: jest.fn().mockResolvedValue(undefined),
  flush: jest.fn().mockResolvedValue(undefined),
  closeAndFlush: jest.fn().mockResolvedValue(undefined),
};

const Analytics = jest.fn().mockImplementation(() => mockAnalytics);

module.exports = Analytics;
