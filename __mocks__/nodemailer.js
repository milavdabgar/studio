// Nodemailer mock
const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    response: '250 OK',
  }),
  verify: jest.fn().mockResolvedValue(true),
};

const nodemailer = {
  createTransporter: jest.fn().mockReturnValue(mockTransporter),
  createTransport: jest.fn().mockReturnValue(mockTransporter),
};

module.exports = nodemailer;
