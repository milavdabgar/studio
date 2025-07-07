/**
 * Mock for puppeteer library
 */

const mockPage = {
  setViewport: jest.fn().mockResolvedValue(undefined),
  evaluateOnNewDocument: jest.fn().mockResolvedValue(undefined),
  setContent: jest.fn().mockResolvedValue(undefined),
  evaluateHandle: jest.fn().mockResolvedValue({}),
  evaluate: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from('mock pdf content'))
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined)
};

const launch = jest.fn().mockResolvedValue(mockBrowser);

module.exports = {
  launch,
  mockPage,
  mockBrowser
};