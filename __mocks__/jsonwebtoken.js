// JSON Web Token mock
const jwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ 
    userId: 'test-user-id',
    exp: Math.floor(Date.now() / 1000) + 3600 
  }),
  decode: jest.fn().mockReturnValue({ 
    userId: 'test-user-id',
    exp: Math.floor(Date.now() / 1000) + 3600 
  }),
};

module.exports = jwt;
