// node-mocks-http mock
const createMocks = (options = {}) => {
  const { method = 'GET', url = '/', headers = {}, body = null } = options;
  
  const req = {
    method,
    url,
    headers,
    body,
    query: {},
    params: {},
    json: jest.fn().mockResolvedValue(body),
  };
  
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    getHeader: jest.fn(),
  };
  
  return { req, res };
};

module.exports = {
  createMocks,
};
