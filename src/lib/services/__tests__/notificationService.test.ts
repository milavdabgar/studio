import { NotificationService, NotificationError } from '../notificationService';
import { EmailService } from '../emailService';
import { SmsService } from '../smsService';
import { PushNotificationService } from '../pushNotificationService';
import { WebhookService } from '../webhookService';

// Mock dependencies
jest.mock('../emailService');
jest.mock('../smsService');
jest.mock('../pushNotificationService');
jest.mock('../webhookService');

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Mock user repository
const mockUserRepo = {
  findById: jest.fn(),
  getUserPreferences: jest.fn(),
};

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockSmsService: jest.Mocked<SmsService>;
  let mockPushService: jest.Mocked<PushNotificationService>;
  let mockWebhookService: jest.Mocked<WebhookService>;
  
  // Test data
  const testUserId = 'user-123';
  const testNotification = {
    type: 'account_created',
    title: 'Welcome!',
    message: 'Your account has been created successfully.',
    data: { username: 'testuser' },
  };
  
  const testUser = {
    id: testUserId,
    email: 'test@example.com',
    phone: '+1234567890',
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
    },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;
    mockSmsService = new SmsService() as jest.Mocked<SmsService>;
    mockPushService = new PushNotificationService() as jest.Mocked<PushNotificationService>;
    mockWebhookService = new WebhookService() as jest.Mocked<WebhookService>;
    
    // Setup default mock implementations
    mockUserRepo.findById.mockResolvedValue(testUser);
    mockUserRepo.getUserPreferences.mockResolvedValue({
      email: true,
      sms: true,
      push: true,
    });
    
    mockEmailService.sendTemplatedEmail.mockResolvedValue(true);
    mockSmsService.sendSms.mockResolvedValue(true);
    mockPushService.sendPush.mockResolvedValue(true);
    mockWebhookService.sendWebhook.mockResolvedValue({ success: true });
    
    // Create a new instance for each test
    notificationService = new NotificationService({
      emailService: mockEmailService,
      smsService: mockSmsService,
      pushService: mockPushService,
      webhookService: mockWebhookService,
      userRepository: mockUserRepo as any,
      logger: mockLogger as any,
    });
  });
  
  describe('sending notifications', () => {
    it('should send email notification', async () => {
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['email'],
        ...testNotification,
      });
      
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledWith(
        testUser.email,
        testNotification.type,
        {
          title: testNotification.title,
          message: testNotification.message,
          data: testNotification.data,
        }
      );
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Notification sent',
        expect.objectContaining({
          userId: testUserId,
          type: testNotification.type,
          channels: ['email'],
        })
      );
    });
    
    it('should send SMS notification', async () => {
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['sms'],
        ...testNotification,
      });
      
      expect(mockSmsService.sendSms).toHaveBeenCalledWith(
        testUser.phone,
        testNotification.message,
        { type: testNotification.type }
      );
    });
    
    it('should send push notification', async () => {
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['push'],
        ...testNotification,
      });
      
      expect(mockPushService.sendPush).toHaveBeenCalledWith(
        testUserId,
        {
          title: testNotification.title,
          body: testNotification.message,
          data: testNotification.data,
        }
      );
    });
    
    it('should send webhook notification', async () => {
      const webhookUrl = 'https://example.com/webhook';
      
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['webhook'],
        webhook: {
          url: webhookUrl,
          secret: 'test-secret',
        },
        ...testNotification,
      });
      
      expect(mockWebhookService.sendWebhook).toHaveBeenCalledWith(
        webhookUrl,
        {
          type: testNotification.type,
          title: testNotification.title,
          message: testNotification.message,
          data: testNotification.data,
          userId: testUserId,
          timestamp: expect.any(Number),
        },
        { secret: 'test-secret' }
      );
    });
    
    it('should send notification through multiple channels', async () => {
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['email', 'sms', 'push'],
        ...testNotification,
      });
      
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      expect(mockPushService.sendPush).toHaveBeenCalled();
    });
    
    it('should respect user notification preferences', async () => {
      // User has disabled email notifications
      mockUserRepo.getUserPreferences.mockResolvedValueOnce({
        email: false,
        sms: true,
        push: false,
      });
      
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['email', 'sms', 'push'],
        ...testNotification,
      });
      
      // Should only send SMS (email and push are disabled in preferences)
      expect(mockEmailService.sendTemplatedEmail).not.toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      expect(mockPushService.sendPush).not.toHaveBeenCalled();
    });
    
    it('should handle missing user', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(null);
      
      await expect(
        notificationService.sendNotification({
          userId: 'non-existent-user',
          channels: ['email'],
          ...testNotification,
        })
      ).rejects.toThrow(NotificationError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'User not found',
        { userId: 'non-existent-user' }
      );
    });
  });
  
  describe('batch notifications', () => {
    it('should send batch notifications', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      
      // Mock user repository to return different users
      mockUserRepo.findById.mockImplementation((userId) => 
        Promise.resolve({
          id: userId,
          email: `${userId}@example.com`,
          notificationPreferences: { email: true },
        })
      );
      
      await notificationService.sendBatchNotification({
        userIds,
        channels: ['email'],
        ...testNotification,
      });
      
      // Should send email to each user
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(userIds.length);
      
      // Verify each user was processed
      userIds.forEach(userId => {
        expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      });
    });
    
    it('should handle partial failures in batch notifications', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      
      // First email will fail, others will succeed
      mockEmailService.sendTemplatedEmail
        .mockRejectedValueOnce(new Error('Email failed'))
        .mockResolvedValue(true)
        .mockResolvedValue(true);
      
      mockUserRepo.findById.mockImplementation((userId) => 
        Promise.resolve({
          id: userId,
          email: `${userId}@example.com`,
          notificationPreferences: { email: true },
        })
      );
      
      const results = await notificationService.sendBatchNotification({
        userIds,
        channels: ['email'],
        ...testNotification,
      });
      
      // Should have one failure and two successes
      expect(results.successCount).toBe(2);
      expect(results.failureCount).toBe(1);
      expect(results.errors).toHaveLength(1);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send notification to user',
        expect.objectContaining({
          userId: 'user1',
          error: expect.any(Error),
        })
      );
    });
  });
  
  describe('scheduled notifications', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should schedule a notification', async () => {
      const sendAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      
      const scheduledId = await notificationService.scheduleNotification({
        userId: testUserId,
        channels: ['email'],
        sendAt,
        ...testNotification,
      });
      
      expect(scheduledId).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scheduled notification',
        expect.objectContaining({
          userId: testUserId,
          scheduledId,
          sendAt: sendAt.getTime(),
        })
      );
    });
    
    it('should cancel a scheduled notification', async () => {
      const scheduledId = 'sched-123';
      
      await notificationService.cancelScheduledNotification(scheduledId);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cancelled scheduled notification',
        { scheduledId }
      );
    });
  });
  
  describe('template handling', () => {
    it('should use custom template variables', async () => {
      const templateVars = {
        username: 'testuser',
        actionUrl: 'https://example.com/verify',
      };
      
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['email'],
        type: 'email_verification',
        templateVars,
      });
      
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledWith(
        testUser.email,
        'email_verification',
        expect.objectContaining({
          data: expect.objectContaining(templateVars),
        })
      );
    });
    
    it('should handle missing template', async () => {
      mockEmailService.sendTemplatedEmail.mockRejectedValueOnce(
        new Error('Template not found')
      );
      
      await expect(
        notificationService.sendNotification({
          userId: testUserId,
          channels: ['email'],
          type: 'non_existent_template',
        })
      ).rejects.toThrow(NotificationError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Template error',
        expect.any(Error)
      );
    });
  });
  
  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      // Mock rate limiting logic
      const isRateLimited = jest
        .spyOn(notificationService as any, 'isRateLimited')
        .mockResolvedValue(true);
      
      await expect(
        notificationService.sendNotification({
          userId: testUserId,
          channels: ['email'],
          ...testNotification,
        })
      ).rejects.toThrow(NotificationError);
      
      expect(isRateLimited).toHaveBeenCalledWith(testUserId, 'email');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.objectContaining({
          userId: testUserId,
          channel: 'email',
        })
      );
    });
  });
  
  describe('error handling', () => {
    it('should handle channel-specific errors', async () => {
      const emailError = new Error('Email service unavailable');
      mockEmailService.sendTemplatedEmail.mockRejectedValueOnce(emailError);
      
      // Should not throw for channel-specific errors when continueOnError is true
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['email', 'sms'],
        continueOnError: true,
        ...testNotification,
      });
      
      // Should still try to send SMS even if email fails
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      
      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send notification',
        expect.objectContaining({
          channel: 'email',
          error: emailError,
        })
      );
    });
    
    it('should throw when all channels fail', async () => {
      const emailError = new Error('Email service down');
      const smsError = new Error('SMS service down');
      
      mockEmailService.sendTemplatedEmail.mockRejectedValue(emailError);
      mockSmsService.sendSms.mockRejectedValue(smsError);
      
      await expect(
        notificationService.sendNotification({
          userId: testUserId,
          channels: ['email', 'sms'],
          ...testNotification,
        })
      ).rejects.toThrow(NotificationError);
      
      // Should include all channel errors
      expect(mockLogger.error).toHaveBeenCalledWith(
        'All notification channels failed',
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ channel: 'email' }),
            expect.objectContaining({ channel: 'sms' }),
          ]),
        })
      );
    });
  });
  
  describe('retry mechanism', () => {
    it('should retry failed notifications', async () => {
      // First attempt fails, second succeeds
      mockEmailService.sendTemplatedEmail
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue(true);
      
      await notificationService.sendNotification({
        userId: testUserId,
        channels: ['email'],
        retryOptions: {
          maxAttempts: 2,
          delayMs: 100,
        },
        ...testNotification,
      });
      
      // Should have been called twice (initial + retry)
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(2);
      
      // Should have logged the retry
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retrying notification',
        expect.objectContaining({
          attempt: 1,
          maxAttempts: 2,
          error: expect.any(Error),
        })
      );
    });
    
    it('should give up after max retries', async () => {
      const error = new Error('Persistent failure');
      mockEmailService.sendTemplatedEmail.mockRejectedValue(error);
      
      await expect(
        notificationService.sendNotification({
          userId: testUserId,
          channels: ['email'],
          retryOptions: {
            maxAttempts: 3,
            delayMs: 10,
          },
          ...testNotification,
        })
      ).rejects.toThrow(NotificationError);
      
      // Should have been called 3 times (initial + 2 retries)
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledTimes(3);
      
      // Should have logged the final failure
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Max retries exceeded',
        expect.objectContaining({
          attempt: 3,
          error,
        })
      );
    });
  });
  
  describe('webhook verification', () => {
    it('should verify webhook signature', async () => {
      const payload = { test: 'data' };
      const signature = 'test-signature';
      const secret = 'test-secret';
      
      mockWebhookService.verifySignature = jest.fn().mockReturnValue(true);
      
      const isValid = notificationService.verifyWebhookSignature(
        payload,
        signature,
        secret
      );
      
      expect(mockWebhookService.verifySignature).toHaveBeenCalledWith(
        payload,
        signature,
        secret
      );
      
      expect(isValid).toBe(true);
    });
  });
});
