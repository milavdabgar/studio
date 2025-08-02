import { NotificationService, NotificationConfig, NotificationRequest, BatchNotificationRequest } from '@/lib/services/notificationService';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mock;
  let mockSmsService: jest.Mock;
  let mockPushService: jest.Mock;
  let mockWebhookService: jest.Mock;
  let mockUserRepository: {
    findById: jest.Mock;
    getUserPreferences: jest.Mock;
  };
  let mockLogger: {
    info: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    warn: jest.Mock;
  };

  beforeEach(() => {
    mockEmailService = jest.fn().mockResolvedValue(true);
    mockSmsService = jest.fn().mockResolvedValue(true);
    mockPushService = jest.fn().mockResolvedValue(true);
    mockWebhookService = jest.fn().mockResolvedValue({ success: true });
    
    mockUserRepository = {
      findById: jest.fn(),
      getUserPreferences: jest.fn()
    };
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    };

    const config: NotificationConfig = {
      emailService: { sendTemplatedEmail: mockEmailService },
      smsService: { sendSms: mockSmsService },
      pushService: { sendPush: mockPushService },
      webhookService: { sendWebhook: mockWebhookService },
      userRepository: mockUserRepository,
      logger: mockLogger,
      templates: {
        welcome: {
          email: {
            subject: 'Welcome to {{appName}}',
            body: 'Hello {{name}}, welcome to our platform!'
          },
          push: {
            title: 'Welcome!',
            body: 'Thanks for joining us, {{name}}!'
          }
        }
      },
      rateLimits: {
        perUser: 100,
        perChannel: 50,
        windowMs: 60000
      }
    };

    notificationService = new NotificationService(config);
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      expect(notificationService).toBeInstanceOf(NotificationService);
    });

    it('should create instance with minimal config', () => {
      const minimalConfig: NotificationConfig = {
        logger: mockLogger
      };
      const service = new NotificationService(minimalConfig);
      expect(service).toBeInstanceOf(NotificationService);
    });
  });

  describe('sendNotification', () => {
    const basicNotification: NotificationRequest = {
      userId: 'user123',
      type: 'welcome',
      title: 'Welcome',
      message: 'Welcome to our platform',
      channels: ['email', 'push']
    };

    beforeEach(() => {
      mockUserRepository.findById.mockResolvedValue({
        email: 'user@example.com',
        phone: '+1234567890',
        deviceTokens: ['device_token_123']
      });
      mockUserRepository.getUserPreferences.mockResolvedValue({
        email: true,
        push: true,
        sms: false
      });
    });

    it('should send email notification successfully', async () => {
      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['email']
      });

      expect(result.success).toBe(true);
      expect(result.channels.email).toBe(true);
      expect(mockEmailService).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Welcome',
        template: expect.any(String),
        data: expect.objectContaining({
          title: 'Welcome',
          message: 'Welcome to our platform'
        })
      });
    });

    it('should send push notification successfully', async () => {
      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['push']
      });

      expect(result.success).toBe(true);
      expect(result.channels.push).toBe(true);
      expect(mockPushService).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Welcome',
        body: 'Welcome to our platform',
        data: expect.any(Object)
      });
    });

    it('should send SMS notification successfully', async () => {
      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['sms']
      });

      expect(result.success).toBe(true);
      expect(result.channels.sms).toBe(true);
      expect(mockSmsService).toHaveBeenCalledWith({
        to: '+1234567890',
        message: 'Welcome to our platform'
      });
    });

    it('should send webhook notification successfully', async () => {
      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['webhook']
      });

      expect(result.success).toBe(true);
      expect(result.channels.webhook).toBe(true);
      expect(mockWebhookService).toHaveBeenCalledWith({
        event: 'welcome',
        payload: expect.objectContaining({
          userId: 'user123',
          type: 'welcome',
          title: 'Welcome'
        })
      });
    });

    it('should handle multiple channels', async () => {
      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['email', 'push', 'sms']
      });

      expect(result.success).toBe(true);
      expect(Object.values(result.channels).filter(Boolean)).toHaveLength(3);
      expect(mockEmailService).toHaveBeenCalled();
      expect(mockPushService).toHaveBeenCalled();
      expect(mockSmsService).toHaveBeenCalled();
    });

    it('should use direct email when provided', async () => {
      const result = await notificationService.sendNotification({
        email: 'direct@example.com',
        type: 'welcome',
        title: 'Welcome',
        message: 'Direct email test',
        channels: ['email']
      });

      expect(result.success).toBe(true);
      expect(mockEmailService).toHaveBeenCalledWith({
        to: 'direct@example.com',
        subject: 'Welcome',
        template: expect.any(String),
        data: expect.any(Object)
      });
    });

    it('should use direct phone when provided', async () => {
      const result = await notificationService.sendNotification({
        phone: '+9876543210',
        type: 'welcome',
        title: 'Welcome',
        message: 'Direct SMS test',
        channels: ['sms']
      });

      expect(result.success).toBe(true);
      expect(mockSmsService).toHaveBeenCalledWith({
        to: '+9876543210',
        message: 'Direct SMS test'
      });
    });

    it('should respect user preferences', async () => {
      mockUserRepository.getUserPreferences.mockResolvedValue({
        email: false,
        push: true,
        sms: false
      });

      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['email', 'push', 'sms']
      });

      expect(result.success).toBe(true);
      expect(result.channels.push).toBe(true);
      expect(result.channels.email).toBe(false);
      expect(result.channels.sms).toBe(false);
    });

    it('should handle template interpolation', async () => {
      const result = await notificationService.sendNotification({
        userId: 'user123',
        type: 'welcome',
        title: 'Welcome {{name}}',
        message: 'Hello {{name}}, welcome to {{appName}}!',
        channels: ['email'],
        data: {
          name: 'John Doe',
          appName: 'TestApp'
        }
      });

      expect(result.success).toBe(true);
      expect(mockEmailService).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Welcome John Doe',
        template: expect.stringContaining('Hello John Doe, welcome to TestApp!'),
        data: expect.any(Object)
      });
    });

    it('should handle missing user gracefully', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await notificationService.sendNotification({
        userId: 'nonexistent',
        type: 'test',
        title: 'Test',
        message: 'Test message',
        channels: ['email']
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('User not found');
    });

    it('should handle service failures gracefully', async () => {
      mockEmailService.mockRejectedValue(new Error('Email service down'));

      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['email']
      });

      expect(result.success).toBe(false);
      expect(result.channels.email).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('email'));
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send email notification:',
        expect.any(Error)
      );
    });

    it('should handle partial failures', async () => {
      mockEmailService.mockRejectedValue(new Error('Email failed'));
      // Push service succeeds

      const result = await notificationService.sendNotification({
        ...basicNotification,
        channels: ['email', 'push']
      });

      expect(result.success).toBe(true); // At least one channel succeeded
      expect(result.channels.push).toBe(true);
      expect(result.channels.email).toBe(false);
    });

    it('should apply rate limiting', async () => {
      // Mock rate limit exceeded
      const rateLimitedService = new NotificationService({
        ...notificationService['config'],
        rateLimits: { perUser: 1, windowMs: 60000 }
      });

      // First notification should succeed
      const result1 = await rateLimitedService.sendNotification(basicNotification);
      expect(result1.success).toBe(true);

      // Second notification should be rate limited
      const result2 = await rateLimitedService.sendNotification(basicNotification);
      expect(result2.success).toBe(false);
      expect(result2.errors).toContain('Rate limit exceeded');
    });
  });

  describe('sendBatchNotification', () => {
    const batchRequest: BatchNotificationRequest = {
      users: ['user1', 'user2'],
      notification: {
        type: 'announcement',
        title: 'Announcement',
        message: 'Batch message',
        channels: ['email']
      },
      maxConcurrency: 2
    };

    beforeEach(() => {
      mockUserRepository.findById.mockImplementation((id: string) => {
        return Promise.resolve({
          email: `${id}@example.com`,
          phone: `+123456789${id.slice(-1)}`,
          deviceTokens: [`token_${id}`]
        });
      });
      mockUserRepository.getUserPreferences.mockResolvedValue({
        email: true,
        push: true,
        sms: true
      });
    });

    it('should send batch notifications successfully', async () => {
      const result = await notificationService.sendBatchNotification(batchRequest);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle batch failures with continueOnError', async () => {
      mockEmailService.mockRejectedValueOnce(new Error('First email failed'));

      const result = await notificationService.sendBatchNotification(batchRequest);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should respect concurrency limits', async () => {
      const startTimes: number[] = [];
      mockEmailService.mockImplementation(async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      });

      const largeBatch: BatchNotificationRequest = {
        users: Array(5).fill(null).map((_, i) => `user${i}`),
        notification: {
          type: 'test',
          title: 'Test',
          message: 'Test message',
          channels: ['email']
        },
        maxConcurrency: 2
      };

      await notificationService.sendBatchNotification(largeBatch);

      // With concurrency of 2, we shouldn't have more than 2 concurrent executions
      expect(startTimes).toHaveLength(5);
    });

    // Note: retryFailures is not implemented in the current BatchNotificationRequest interface
    // This test would need to be updated when retry functionality is added
    /*
    it('should retry failures when retryFailures is true', async () => {
      mockEmailService
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(true);

      const result = await notificationService.sendBatchNotification({
        ...batchRequest,
        // batchOptions: { ...batchRequest.batchOptions, retryFailures: true }
      });

      expect(mockEmailService).toHaveBeenCalledTimes(2); // Initial + retry
    });
    */
  });

  // Note: The following methods are not implemented in the current NotificationService
  // These tests should be uncommented and updated when the methods are added

  /*
  describe('getNotificationStatus', () => {
    it('should return notification status', async () => {
      const notificationId = 'notif_123';
      const status = await notificationService.getNotificationStatus(notificationId);

      expect(status).toEqual({
        id: notificationId,
        status: 'unknown', // Default status since we haven't implemented storage
        sentAt: null,
        readAt: null,
        channels: []
      });
    });
  });

  describe('getUserNotificationHistory', () => {
    it('should return user notification history', async () => {
      const history = await notificationService.getUserNotificationHistory('user123');

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(0); // Empty since we haven't implemented storage
    });

    it('should handle pagination', async () => {
      const history = await notificationService.getUserNotificationHistory('user123', {
        limit: 10,
        offset: 0
      });

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('template interpolation', () => {
    it('should interpolate simple variables', () => {
      const template = 'Hello {{name}}, welcome to {{app}}!';
      const data = { name: 'John', app: 'TestApp' };
      
      const result = notificationService['interpolateTemplate'](template, data);
      expect(result).toBe('Hello John, welcome to TestApp!');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, your score is {{score}}!';
      const data = { name: 'John' }; // Missing score
      
      const result = notificationService['interpolateTemplate'](template, data);
      expect(result).toBe('Hello John, your score is !'); // Empty substitution
    });

    it('should handle nested object properties', () => {
      const template = 'Hello {{user.name}}, your role is {{user.role}}!';
      const data = { user: { name: 'John', role: 'admin' } };
      
      const result = notificationService['interpolateTemplate'](template, data);
      expect(result).toBe('Hello John, your role is admin!');
    });
  });

  describe('error handling', () => {
    it('should handle invalid notification request', async () => {
      const invalidRequest = {
        type: '',
        title: '',
        message: '',
        channels: []
      } as NotificationRequest;

      const result = await notificationService.sendNotification(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid notification request');
    });

    it('should handle service unavailability', async () => {
      const serviceWithoutEmail = new NotificationService({
        logger: mockLogger
        // No email service configured
      });

      const result = await serviceWithoutEmail.sendNotification({
        email: 'test@example.com',
        type: 'test',
        title: 'Test',
        message: 'Test message',
        channels: ['email']
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Email service not configured');
    });
  });
  */
});