import { EmailService } from '../emailService';
import nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';

// Mock nodemailer
jest.mock('nodemailer');
jest.mock('fs/promises');
jest.mock('handlebars');

// Mock the createTransport function
const mockCreateTransport = createTransport as jest.MockedFunction<typeof createTransport>;
const mockSendMail = jest.fn();
const mockVerify = jest.fn();

// Mock the transport object
const mockTransport = {
  sendMail: mockSendMail,
  verify: mockVerify,
  close: jest.fn(),
};

// Mock the compiled template
const mockCompiledTemplate = {
  html: '<p>Test Template</p>',
  text: 'Test Template',
  subject: 'Test Email'
};

// Mock the template compilation
const mockCompile = jest.fn().mockReturnValue(() => mockCompiledTemplate);

// Mock the readFile function
(fs.readFile as jest.Mock).mockImplementation(async (filePath) => {
  if (filePath.includes('test-template.hbs')) {
    return '<p>Hello {{name}}</p>';
  }
  throw new Error('Template not found');
});

// Setup mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset the mock transport
  mockCreateTransport.mockReturnValue(mockTransport as any);
  mockSendMail.mockImplementation((mailOptions, callback) => {
    callback(null, { messageId: 'test-message-id' });
  });
  mockVerify.mockImplementation((callback) => {
    callback(null, true);
  });
  
  // Reset the template mock
  (handlebars.compile as jest.Mock) = mockCompile;
});

describe('EmailService', () => {
  let emailService: EmailService;
  
  const testConfig = {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'test-password',
    },
    from: 'Test Sender <test@example.com>',
    templatesDir: '/path/to/templates',
  };
  
  const testRecipient = 'recipient@example.com';
  const testSubject = 'Test Email';
  const testText = 'This is a test email';
  const testHtml = '<p>This is a test email</p>';
  
  beforeEach(() => {
    emailService = new EmailService(testConfig);
  });
  
  afterEach(async () => {
    await emailService.close();
  });

  describe('initialization', () => {
    it('should create a transport with the provided config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: testConfig.host,
        port: testConfig.port,
        secure: testConfig.secure,
        auth: testConfig.auth,
      });
    });
    
    it('should verify the connection on initialization when verifyOnInit is true', async () => {
      const verifyEmailService = new EmailService({
        ...testConfig,
        verifyOnInit: true,
      });
      
      expect(mockVerify).toHaveBeenCalled();
      await verifyEmailService.close();
    });
  });
  
  describe('sending emails', () => {
    it('should send a plain text email', async () => {
      const result = await emailService.sendEmail({
        to: testRecipient,
        subject: testSubject,
        text: testText,
      });
      
      expect(mockSendMail).toHaveBeenCalledWith(
        {
          from: testConfig.from,
          to: testRecipient,
          subject: testSubject,
          text: testText,
          html: undefined,
          attachments: undefined,
          replyTo: undefined,
          cc: undefined,
          bcc: undefined,
        },
        expect.any(Function)
      );
      
      expect(result).toEqual({
        messageId: 'test-message-id',
        success: true,
      });
    });
    
    it('should send an HTML email', async () => {
      const result = await emailService.sendEmail({
        to: testRecipient,
        subject: testSubject,
        html: testHtml,
      });
      
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: testHtml,
        }),
        expect.any(Function)
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should handle multiple recipients', async () => {
      const recipients = ['user1@example.com', 'user2@example.com'];
      
      await emailService.sendEmail({
        to: recipients,
        subject: testSubject,
        text: testText,
      });
      
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipients.join(', '),
        }),
        expect.any(Function)
      );
    });
    
    it('should handle CC and BCC recipients', async () => {
      const cc = ['cc1@example.com', 'cc2@example.com'];
      const bcc = ['bcc@example.com'];
      
      await emailService.sendEmail({
        to: testRecipient,
        cc,
        bcc,
        subject: testSubject,
        text: testText,
      });
      
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: cc.join(', '),
          bcc: bcc.join(', '),
        }),
        expect.any(Function)
      );
    });
    
    it('should handle email attachments', async () => {
      const attachments = [
        {
          filename: 'test.txt',
          content: 'test content',
        },
        {
          filename: 'test.pdf',
          path: '/path/to/test.pdf',
        },
      ];
      
      await emailService.sendEmail({
        to: testRecipient,
        subject: testSubject,
        text: testText,
        attachments,
      });
      
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'test.txt',
            }),
            expect.objectContaining({
              filename: 'test.pdf',
            }),
          ]),
        }),
        expect.any(Function)
      );
    });
    
    it('should handle email sending errors', async () => {
      const error = new Error('SMTP error');
      mockSendMail.mockImplementationOnce((mailOptions, callback) => {
        callback(error, null);
      });
      
      const result = await emailService.sendEmail({
        to: testRecipient,
        subject: testSubject,
        text: testText,
      });
      
      expect(result).toEqual({
        success: false,
        error: error.message,
      });
    });
  });
  
  describe('templated emails', () => {
    const templateName = 'test-template';
    const templateData = { name: 'Test User' };
    const templatePath = path.join(testConfig.templatesDir, `${templateName}.hbs`);
    
    it('should send an email using a template', async () => {
      const result = await emailService.sendTemplatedEmail({
        to: testRecipient,
        template: templateName,
        data: templateData,
      });
      
      // Verify template was loaded
      expect(fs.readFile).toHaveBeenCalledWith(
        templatePath,
        'utf-8'
      );
      
      // Verify template was compiled with data
      expect(mockCompile).toHaveBeenCalledWith(expect.stringContaining('Hello {{name}}'));
      
      // Verify email was sent with compiled template
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: mockCompiledTemplate.subject,
          text: mockCompiledTemplate.text,
          html: mockCompiledTemplate.html,
        }),
        expect.any(Function)
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should handle template compilation errors', async () => {
      const templateError = new Error('Template error');
      (handlebars.compile as jest.Mock).mockImplementationOnce(() => {
        throw templateError;
      });
      
      const result = await emailService.sendTemplatedEmail({
        to: testRecipient,
        template: 'invalid-template',
        data: {},
      });
      
      expect(result).toEqual({
        success: false,
        error: `Failed to compile email template: ${templateError.message}`,
      });
    });
    
    it('should handle template file not found', async () => {
      (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
      
      const result = await emailService.sendTemplatedEmail({
        to: testRecipient,
        template: 'nonexistent-template',
        data: {},
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load email template');
    });
  });
  
  describe('email verification', () => {
    it('should verify the SMTP connection', async () => {
      const result = await emailService.verifyConnection();
      
      expect(mockVerify).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should handle verification errors', async () => {
      const error = new Error('Connection failed');
      mockVerify.mockImplementationOnce((callback) => {
        callback(error);
      });
      
      const result = await emailService.verifyConnection();
      
      expect(result).toBe(false);
    });
  });
  
  describe('template management', () => {
    it('should precompile templates', async () => {
      const templates = ['welcome', 'password-reset'];
      
      await emailService.precompileTemplates(templates);
      
      templates.forEach(template => {
        expect(fs.readFile).toHaveBeenCalledWith(
          path.join(testConfig.templatesDir, `${template}.hbs`),
          'utf-8'
        );
      });
      
      expect(handlebars.compile).toHaveBeenCalledTimes(templates.length);
    });
    
    it('should handle template cache', async () => {
      const templateName = 'cached-template';
      
      // First call - should compile
      await emailService.getCompiledTemplate(templateName);
      
      // Second call - should use cache
      await emailService.getCompiledTemplate(templateName);
      
      // Should only read and compile once
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(handlebars.compile).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('error handling', () => {
    it('should handle transport creation errors', async () => {
      const error = new Error('Transport creation failed');
      mockCreateTransport.mockImplementationOnce(() => {
        throw error;
      });
      
      const failingService = new EmailService(testConfig);
      
      await expect(
        failingService.sendEmail({
          to: testRecipient,
          subject: testSubject,
          text: testText,
        })
      ).rejects.toThrow(error);
      
      await failingService.close();
    });
    
    it('should handle transport close errors', async () => {
      const error = new Error('Failed to close transport');
      mockTransport.close.mockImplementationOnce((callback) => {
        callback(error);
      });
      
      const service = new EmailService(testConfig);
      
      // Should not throw when closing with error
      await expect(service.close()).resolves.not.toThrow();
    });
  });
  
  describe('template helpers', () => {
    it('should register template helpers', () => {
      const helperName = 'uppercase';
      const helperFn = jest.fn();
      
      emailService.registerHelper(helperName, helperFn);
      
      expect(handlebars.registerHelper).toHaveBeenCalledWith(
        helperName,
        helperFn
      );
    });
    
    it('should register partials', () => {
      const partialName = 'header';
      const partialContent = '<header>Test Header</header>';
      
      emailService.registerPartial(partialName, partialContent);
      
      expect(handlebars.registerPartial).toHaveBeenCalledWith(
        partialName,
        partialContent
      );
    });
  });
});
