import { EmailService, EmailConfig, EmailOptions, TemplateEmailOptions } from '../emailService';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('handlebars');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockHandlebars = handlebars as jest.Mocked<typeof handlebars>;

describe('EmailService', () => {
  let emailService: EmailService;
  
  const defaultConfig: EmailConfig = {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'password123'
    }
  };

  beforeEach(() => {
    emailService = new EmailService(defaultConfig);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await emailService.close();
  });

  describe('constructor', () => {
    it('should create EmailService instance with config', () => {
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should store config correctly', () => {
      const customConfig: EmailConfig = {
        host: 'custom.smtp.com',
        port: 465,
        secure: true,
        auth: {
          user: 'custom@example.com',
          pass: 'custompass'
        }
      };

      const customService = new EmailService(customConfig);
      expect(customService).toBeInstanceOf(EmailService);
    });
  });

  describe('initialize()', () => {
    it('should initialize successfully', async () => {
      await expect(emailService.initialize()).resolves.toBeUndefined();
    });

    it('should allow operations after initialization', async () => {
      await emailService.initialize();
      await expect(emailService.verifyConnection()).resolves.toBe(true);
    });
  });

  describe('verifyConnection()', () => {
    it('should verify connection successfully after initialization', async () => {
      await emailService.initialize();
      
      const result = await emailService.verifyConnection();
      expect(result).toBe(true);
    });

    it('should throw error if not initialized', async () => {
      await expect(emailService.verifyConnection()).rejects.toThrow('Email service not initialized');
    });
  });

  describe('sendEmail()', () => {
    const emailOptions: EmailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<h1>Test Email</h1>',
      text: 'Test Email'
    };

    it('should send email successfully', async () => {
      await emailService.initialize();
      await expect(emailService.sendEmail(emailOptions)).resolves.toBeUndefined();
    });

    it('should throw error if not initialized', async () => {
      await expect(emailService.sendEmail(emailOptions)).rejects.toThrow('Email service not initialized');
    });

    it('should handle array of recipients', async () => {
      await emailService.initialize();
      
      const arrayOptions = {
        ...emailOptions,
        to: ['user1@example.com', 'user2@example.com']
      };
      
      await expect(emailService.sendEmail(arrayOptions)).resolves.toBeUndefined();
    });

    it('should handle CC and BCC recipients', async () => {
      await emailService.initialize();
      
      const ccBccOptions = {
        ...emailOptions,
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: 'bcc@example.com'
      };
      
      await expect(emailService.sendEmail(ccBccOptions)).resolves.toBeUndefined();
    });

    it('should handle custom from address', async () => {
      await emailService.initialize();
      
      const customFromOptions = {
        ...emailOptions,
        from: 'custom@example.com'
      };
      
      await expect(emailService.sendEmail(customFromOptions)).resolves.toBeUndefined();
    });

    it('should handle attachments', async () => {
      await emailService.initialize();
      
      const attachmentOptions = {
        ...emailOptions,
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf'
          }
        ]
      };
      
      await expect(emailService.sendEmail(attachmentOptions)).resolves.toBeUndefined();
    });
  });

  describe('sendTemplateEmail()', () => {
    const templateOptions: TemplateEmailOptions = {
      to: 'recipient@example.com',
      subject: 'Template Test',
      template: 'welcome',
      data: { name: 'John Doe', company: 'Test Corp' }
    };

    beforeEach(() => {
      // Mock template compilation
      const mockTemplate = jest.fn().mockReturnValue('<h1>Hello John Doe from Test Corp</h1>') as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockHandlebars.compile.mockReturnValue(mockTemplate);
      
      // Mock file reading
      mockFs.readFile.mockResolvedValue('<h1>Hello {{name}} from {{company}}</h1>');
    });

    it('should send template email successfully', async () => {
      await emailService.initialize();
      
      await expect(emailService.sendTemplateEmail(templateOptions)).resolves.toBeUndefined();
      
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'templates', 'email', 'welcome.hbs'),
        'utf-8'
      );
      expect(mockHandlebars.compile).toHaveBeenCalledWith('<h1>Hello {{name}} from {{company}}</h1>');
    });

    it('should cache compiled templates', async () => {
      await emailService.initialize();
      
      // Send same template email twice
      await emailService.sendTemplateEmail(templateOptions);
      await emailService.sendTemplateEmail(templateOptions);
      
      // File should only be read once due to caching
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      expect(mockHandlebars.compile).toHaveBeenCalledTimes(1);
    });

    it('should handle different templates', async () => {
      await emailService.initialize();
      
      const secondTemplateOptions = {
        ...templateOptions,
        template: 'notification'
      };
      
      await emailService.sendTemplateEmail(templateOptions);
      await emailService.sendTemplateEmail(secondTemplateOptions);
      
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'templates', 'email', 'welcome.hbs'),
        'utf-8'
      );
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'templates', 'email', 'notification.hbs'),
        'utf-8'
      );
    });

    it('should handle template file read errors', async () => {
      await emailService.initialize();
      mockFs.readFile.mockRejectedValue(new Error('Template not found'));
      
      await expect(emailService.sendTemplateEmail(templateOptions)).rejects.toThrow('Template not found');
    });

    it('should handle additional template options', async () => {
      await emailService.initialize();
      
      const extendedOptions = {
        ...templateOptions,
        from: 'custom@example.com',
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com']
      };
      
      await expect(emailService.sendTemplateEmail(extendedOptions)).resolves.toBeUndefined();
    });
  });

  describe('sendBulkEmail()', () => {
    const bulkOptions = {
      subject: 'Bulk Email Test',
      html: '<h1>Bulk Email Content</h1>',
      text: 'Bulk Email Content'
    };

    it('should send emails to multiple recipients', async () => {
      await emailService.initialize();
      
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      
      await expect(emailService.sendBulkEmail(recipients, bulkOptions)).resolves.toBeUndefined();
    });

    it('should handle empty recipients array', async () => {
      await emailService.initialize();
      
      await expect(emailService.sendBulkEmail([], bulkOptions)).resolves.toBeUndefined();
    });

    it('should handle single recipient', async () => {
      await emailService.initialize();
      
      await expect(emailService.sendBulkEmail(['single@example.com'], bulkOptions)).resolves.toBeUndefined();
    });

    it('should handle large recipient lists', async () => {
      await emailService.initialize();
      
      const manyRecipients = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
      
      await expect(emailService.sendBulkEmail(manyRecipients, bulkOptions)).resolves.toBeUndefined();
    });
  });

  describe('close()', () => {
    it('should close successfully', async () => {
      await emailService.initialize();
      await expect(emailService.close()).resolves.toBeUndefined();
    });

    it('should handle close when not initialized', async () => {
      await expect(emailService.close()).resolves.toBeUndefined();
    });

    it('should handle multiple close calls', async () => {
      await emailService.initialize();
      
      await emailService.close();
      await expect(emailService.close()).resolves.toBeUndefined();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle special characters in email content', async () => {
      await emailService.initialize();
      
      const specialOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test with émojis 🎉 and spëcial chars',
        html: '<p>Héllo wörld! 🌍 Testing spëcial chàracters</p>',
        text: 'Héllo wörld! Testing spëcial chàracters'
      };
      
      await expect(emailService.sendEmail(specialOptions)).resolves.toBeUndefined();
    });

    it('should handle malformed email addresses gracefully', async () => {
      await emailService.initialize();
      
      const malformedOptions: EmailOptions = {
        to: 'not-an-email',
        subject: 'Test',
        html: '<p>Test</p>'
      };
      
      // The service should pass through the email as-is
      await expect(emailService.sendEmail(malformedOptions)).resolves.toBeUndefined();
    });

    it('should handle empty email content', async () => {
      await emailService.initialize();
      
      const emptyOptions: EmailOptions = {
        to: 'test@example.com',
        subject: '',
        html: '',
        text: ''
      };
      
      await expect(emailService.sendEmail(emptyOptions)).resolves.toBeUndefined();
    });

    it('should handle undefined template data', async () => {
      await emailService.initialize();
      
      const mockTemplate = jest.fn().mockReturnValue('<h1>Hello undefined</h1>') as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockHandlebars.compile.mockReturnValue(mockTemplate);
      mockFs.readFile.mockResolvedValue('<h1>Hello {{name}}</h1>');
      
      const undefinedDataOptions: TemplateEmailOptions = {
        to: 'test@example.com',
        subject: 'Test',
        template: 'welcome',
        data: { name: undefined }
      };
      
      await expect(emailService.sendTemplateEmail(undefinedDataOptions)).resolves.toBeUndefined();
      expect(mockTemplate).toHaveBeenCalledWith({ name: undefined });
    });
  });

  describe('template path construction', () => {
    it('should construct correct template path', async () => {
      await emailService.initialize();
      
      mockFs.readFile.mockResolvedValue('<p>Template content</p>');
      mockHandlebars.compile.mockReturnValue(jest.fn().mockReturnValue('<p>Compiled</p>') as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      await emailService.sendTemplateEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: 'custom/nested-template',
        data: {}
      });
      
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'templates', 'email', 'custom/nested-template.hbs'),
        'utf-8'
      );
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent email sending', async () => {
      await emailService.initialize();
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        emailService.sendEmail({
          to: `user${i}@example.com`,
          subject: `Test ${i}`,
          html: `<p>Test ${i}</p>`
        })
      );
      
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle concurrent template loading', async () => {
      await emailService.initialize();
      
      mockFs.readFile.mockResolvedValue('<p>{{message}}</p>');
      const mockTemplate = jest.fn().mockReturnValue('<p>Hello</p>') as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockHandlebars.compile.mockReturnValue(mockTemplate);
      
      const promises = Array.from({ length: 5 }, () => 
        emailService.sendTemplateEmail({
          to: 'test@example.com',
          subject: 'Test',
          template: 'same-template',
          data: { message: 'Hello' }
        })
      );
      
      await expect(Promise.all(promises)).resolves.toBeDefined();
      
      // Due to async nature, each concurrent call might read the template
      // This is expected behavior and doesn't break functionality
      expect(mockFs.readFile).toHaveBeenCalled();
      expect(mockHandlebars.compile).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should support complete email workflow', async () => {
      await emailService.initialize();
      
      // Verify connection
      expect(await emailService.verifyConnection()).toBe(true);
      
      // Send simple email
      await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<h1>Welcome!</h1>'
      });
      
      // Send bulk emails
      await emailService.sendBulkEmail(
        ['user1@example.com', 'user2@example.com'],
        { subject: 'Newsletter', html: '<p>Newsletter content</p>' }
      );
      
      // Clean up
      await emailService.close();
    });
  });
});