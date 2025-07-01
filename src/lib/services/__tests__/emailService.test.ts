import { EmailService, EmailConfig, EmailOptions, TemplateEmailOptions } from '../emailService';
import fs from 'fs/promises';

// Mock fs
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock handlebars
jest.mock('handlebars', () => ({
  compile: jest.fn().mockReturnValue(jest.fn().mockReturnValue('<h1>Test Template</h1>')),
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;
  
  const testConfig: EmailConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'password123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
    };

    // Mock nodemailer.createTransporter to return our mock
    const nodemailerMock = require('../emailService');
    nodemailerMock.nodemailer = {
      createTransport: jest.fn().mockReturnValue(mockTransporter),
    };

    emailService = new EmailService(testConfig);
  });

  describe('initialization', () => {
    it('should initialize email service successfully', async () => {
      await emailService.initialize();
      
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle verification failure gracefully', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
      
      await emailService.initialize();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await emailService.verifyConnection();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Email service verification failed:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should throw error when verifying connection without initialization', async () => {
      await expect(emailService.verifyConnection()).rejects.toThrow(
        'Email service not initialized'
      );
    });
  });

  describe('sendEmail', () => {
    beforeEach(async () => {
      await emailService.initialize();
    });

    it('should send a simple email successfully', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
        text: 'Test Email',
      };

      await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: testConfig.auth.user,
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
        text: 'Test Email',
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });

    it('should send email with multiple recipients', async () => {
      const emailOptions: EmailOptions = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
      };

      await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: testConfig.auth.user,
        to: 'user1@example.com, user2@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
        text: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });

    it('should send email with custom from address', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
        from: 'custom@example.com',
      };

      await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });

    it('should send email with CC and BCC recipients', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: 'bcc@example.com',
      };

      await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: testConfig.auth.user,
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
        text: undefined,
        cc: 'cc1@example.com, cc2@example.com',
        bcc: 'bcc@example.com',
        attachments: undefined,
      });
    });

    it('should send email with attachments', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test Email</h1>',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf',
          },
        ],
      };

      await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: 'test.pdf',
              content: Buffer.from('test content'),
              contentType: 'application/pdf',
            },
          ],
        })
      );
    });

    it('should throw error when sending email without initialization', async () => {
      const uninitializedService = new EmailService(testConfig);
      
      await expect(
        uninitializedService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: 'Test',
        })
      ).rejects.toThrow('Email service not initialized');
    });
  });

  describe('sendTemplateEmail', () => {
    beforeEach(async () => {
      await emailService.initialize();
    });

    it('should send email using template', async () => {
      mockFs.readFile.mockResolvedValue('Hello {{name}}!');
      
      const templateOptions: TemplateEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Template Test',
        template: 'welcome',
        data: { name: 'John Doe' },
      };

      await emailService.sendTemplateEmail(templateOptions);

      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('welcome.hbs'),
        'utf-8'
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Template Test',
          html: '<h1>Test Template</h1>',
        })
      );
    });

    it('should cache templates for reuse', async () => {
      mockFs.readFile.mockResolvedValue('Hello {{name}}!');
      
      const templateOptions: TemplateEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Template Test',
        template: 'welcome',
        data: { name: 'John Doe' },
      };

      // Send email twice with same template
      await emailService.sendTemplateEmail(templateOptions);
      await emailService.sendTemplateEmail(templateOptions);

      // Should only read file once (cached on second call)
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should handle template not found error', async () => {
      mockFs.readFile.mockRejectedValue(new Error('Template file not found'));
      
      const templateOptions: TemplateEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Template Test',
        template: 'nonexistent',
        data: { name: 'John Doe' },
      };

      await expect(emailService.sendTemplateEmail(templateOptions)).rejects.toThrow(
        'Template file not found'
      );
    });
  });

  describe('sendBulkEmail', () => {
    beforeEach(async () => {
      await emailService.initialize();
    });

    it('should send emails to multiple recipients', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const emailOptions = {
        subject: 'Bulk Email Test',
        html: '<h1>Bulk Email</h1>',
      };

      await emailService.sendBulkEmail(recipients, emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com',
          subject: 'Bulk Email Test',
          html: '<h1>Bulk Email</h1>',
        })
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user2@example.com',
          subject: 'Bulk Email Test',
          html: '<h1>Bulk Email</h1>',
        })
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user3@example.com',
          subject: 'Bulk Email Test',
          html: '<h1>Bulk Email</h1>',
        })
      );
    });

    it('should handle bulk email errors gracefully', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'success1' })
        .mockRejectedValueOnce(new Error('Failed to send'))
        .mockResolvedValueOnce({ messageId: 'success3' });

      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const emailOptions = {
        subject: 'Bulk Email Test',
        html: '<h1>Bulk Email</h1>',
      };

      await expect(emailService.sendBulkEmail(recipients, emailOptions)).rejects.toThrow(
        'Failed to send'
      );
    });
  });

  describe('close', () => {
    it('should close the transporter connection', async () => {
      await emailService.initialize();
      await emailService.close();

      expect(mockTransporter.close).toHaveBeenCalled();
    });

    it('should handle closing when not initialized', async () => {
      await emailService.close();
      
      // Should not throw error
      expect(mockTransporter.close).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await emailService.initialize();
    });

    it('should handle transporter sendMail errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      
      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: 'Test',
        })
      ).rejects.toThrow('SMTP Error');
    });
  });
});
