export interface NotificationConfig {
  emailService?: { sendTemplatedEmail: (params: { to: string; subject: string; template: string; data: Record<string, unknown> }) => Promise<boolean> };
  smsService?: { sendSms: (params: { to: string; message: string }) => Promise<boolean> };
  pushService?: { sendPush: (params: { userId: string; title: string; body: string; data?: Record<string, unknown> }) => Promise<boolean> };
  webhookService?: { sendWebhook: (params: { event: string; payload: Record<string, unknown> }) => Promise<{ success: boolean }> };
  userRepository?: { findById: (id: string) => Promise<{ email?: string; phone?: string; deviceTokens?: string[] } | null>; getUserPreferences: (userId: string) => Promise<Record<string, boolean> | null> };
  logger?: {
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
  };
  templates?: Record<string, NotificationTemplate>;
  rateLimits?: {
    perUser?: number;
    perChannel?: number;
    windowMs?: number;
  };
}

export interface NotificationTemplate {
  email?: {
    subject: string;
    body: string;
    html?: string;
  };
  sms?: {
    message: string;
  };
  push?: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
  };
}

export interface NotificationRequest {
  userId?: string;
  email?: string;
  phone?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels?: ('email' | 'sms' | 'push' | 'webhook')[];
  template?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
}

export interface BatchNotificationRequest {
  users: string[];
  notification: Omit<NotificationRequest, 'userId'>;
  maxConcurrency?: number;
}

export interface ScheduledNotificationRequest extends NotificationRequest {
  scheduleAt: Date;
  timezone?: string;
}

export interface NotificationResult {
  success: boolean;
  channels: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    webhook?: boolean;
  };
  errors: string[];
  messageId?: string;
}

export interface BatchNotificationResult {
  totalSent: number;
  successful: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}

export class NotificationError extends Error {
  constructor(message: string, public code?: string, public channel?: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class NotificationService {
  private config: NotificationConfig;
  private logger: NotificationConfig['logger'];
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: NotificationConfig) {
    this.config = config;
    this.logger = config.logger || {
      info: () => {},
      error: () => {},
      debug: () => {},
      warn: () => {},
    };
  }

  async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    const { userId, email, phone, type, title, message, data, channels, template } = request;

    // Check rate limits
    if (userId && this.config.rateLimits) {
      if (await this.isRateLimited(userId)) {
        throw new NotificationError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      }
    }

    // Get user data if userId provided
    let user: { email?: string; phone?: string; deviceTokens?: string[] } | null = null;
    if (userId && this.config.userRepository) {
      user = await this.config.userRepository.findById(userId);
      if (!user) {
        throw new NotificationError(`User not found: ${userId}`, 'USER_NOT_FOUND');
      }
    }

    // Determine target channels
    const targetChannels = channels || ['email', 'sms', 'push'];
    const userPreferences = user && userId ? await this.getUserPreferences(userId) : null;
    
    // Filter channels based on user preferences and availability
    const enabledChannels = targetChannels.filter(channel => {
      if (userPreferences && !userPreferences[channel]) {
        return false;
      }
      
      switch (channel) {
        case 'email':
          return (user?.email || email) && this.config.emailService;
        case 'sms':
          return (user?.phone || phone) && this.config.smsService;
        case 'push':
          return user?.deviceTokens && user.deviceTokens.length > 0 && this.config.pushService;
        case 'webhook':
          return this.config.webhookService;
        default:
          return false;
      }
    });

    const result: NotificationResult = {
      success: false,
      channels: {},
      errors: [],
    };

    let hasSuccess = false;

    // Send to each enabled channel
    for (const channel of enabledChannels) {
      try {
        switch (channel) {
          case 'email':
            result.channels.email = await this.sendEmail({
              to: user?.email || email!,
              subject: title,
              message,
              template,
              data,
            });
            break;
            
          case 'sms':
            result.channels.sms = await this.sendSms({
              to: user?.phone || phone!,
              message,
              template,
              data,
            });
            break;
            
          case 'push':
            result.channels.push = await this.sendPush({
              userId: userId!,
              title,
              message,
              data,
            });
            break;
            
          case 'webhook':
            result.channels.webhook = await this.sendWebhook({
              userId,
              type,
              title,
              message,
              data,
              metadata: request.metadata,
            });
            break;
        }
        
        if (result.channels[channel]) {
          hasSuccess = true;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`${channel}: ${errorMessage}`);
        this.logger?.error(`Failed to send ${channel} notification`, { error: errorMessage, userId, type });
      }
    }

    result.success = hasSuccess;
    
    // Update rate limit tracker
    if (userId && hasSuccess) {
      await this.updateRateLimit(userId);
    }

    this.logger?.info('Notification sent', { userId, type, channels: enabledChannels, success: hasSuccess });
    
    return result;
  }

  async sendBatchNotification(request: BatchNotificationRequest): Promise<BatchNotificationResult> {
    const { users, notification, maxConcurrency = 10 } = request;

    const result: BatchNotificationResult = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process users in batches
    for (let i = 0; i < users.length; i += maxConcurrency) {
      const batch = users.slice(i, i + maxConcurrency);
      
      const promises = batch.map(async (userId) => {
        try {
          const notificationResult = await this.sendNotification({
            ...notification,
            userId,
          });
          
          if (notificationResult.success) {
            result.successful++;
          } else {
            result.failed++;
            result.errors.push({
              userId,
              error: notificationResult.errors?.join(', ') || 'Unknown error',
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        
        result.totalSent++;
      });

      await Promise.allSettled(promises);
    }

    this.logger?.info('Batch notification completed', {
      totalSent: result.totalSent,
      successful: result.successful,
      failed: result.failed,
    });

    return result;
  }

  async scheduleNotification(request: ScheduledNotificationRequest): Promise<string> {
    const { scheduleAt, ...notificationRequest } = request;
    const scheduleId = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const delay = scheduleAt.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new NotificationError('Schedule time must be in the future', 'INVALID_SCHEDULE_TIME');
    }

    const timer = setTimeout(async () => {
      try {
        await this.sendNotification(notificationRequest);
        this.scheduledNotifications.delete(scheduleId);
        this.logger?.info('Scheduled notification sent', { scheduleId });
      } catch (error) {
        this.logger?.error('Failed to send scheduled notification', { 
          scheduleId, 
          error: error instanceof Error ? error.message : String(error) 
        });
        this.scheduledNotifications.delete(scheduleId);
      }
    }, delay);

    this.scheduledNotifications.set(scheduleId, timer);
    
    this.logger?.info('Notification scheduled', { 
      scheduleId, 
      scheduleAt: scheduleAt.toISOString(),
      delay 
    });
    
    return scheduleId;
  }

  async cancelScheduledNotification(scheduleId: string): Promise<boolean> {
    const timer = this.scheduledNotifications.get(scheduleId);
    
    if (!timer) {
      return false;
    }

    clearTimeout(timer);
    this.scheduledNotifications.delete(scheduleId);
    
    this.logger?.info('Scheduled notification cancelled', { scheduleId });
    
    return true;
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    message: string;
    template?: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    if (!this.config.emailService) {
      throw new NotificationError('Email service not configured', 'EMAIL_SERVICE_NOT_CONFIGURED');
    }

    return await this.config.emailService.sendTemplatedEmail({
      to: params.to,
      subject: params.subject,
      template: params.template || 'default',
      data: {
        message: params.message,
        ...params.data,
      },
    });
  }

  private async sendSms(params: {
    to: string;
    message: string;
    template?: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    if (!this.config.smsService) {
      throw new NotificationError('SMS service not configured', 'SMS_SERVICE_NOT_CONFIGURED');
    }

    return await this.config.smsService.sendSms({
      to: params.to,
      message: params.message,
    });
  }

  private async sendPush(params: {
    userId: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    if (!this.config.pushService) {
      throw new NotificationError('Push service not configured', 'PUSH_SERVICE_NOT_CONFIGURED');
    }

    return await this.config.pushService.sendPush({
      userId: params.userId,
      title: params.title,
      body: params.message,
      data: params.data,
    });
  }

  private async sendWebhook(params: {
    userId?: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<boolean> {
    if (!this.config.webhookService) {
      throw new NotificationError('Webhook service not configured', 'WEBHOOK_SERVICE_NOT_CONFIGURED');
    }

    const result = await this.config.webhookService.sendWebhook({
      event: 'notification',
      payload: params,
    });

    return result.success;
  }

  private async getUserPreferences(userId: string): Promise<Record<string, boolean> | null> {
    if (!this.config.userRepository) {
      return null;
    }

    try {
      return await this.config.userRepository.getUserPreferences(userId);
    } catch (error) {
      this.logger?.warn('Failed to get user preferences', { userId, error });
      return null;
    }
  }

  private async isRateLimited(userId: string): Promise<boolean> {
    const rateLimits = this.config.rateLimits;
    if (!rateLimits) {
      return false;
    }

    const key = `user:${userId}`;
    const now = Date.now();
    const maxRequests = rateLimits.perUser || 10; // 10 requests per window default

    const record = this.rateLimitTracker.get(key);

    if (!record || record.resetTime <= now) {
      return false;
    }

    return record.count >= maxRequests;
  }

  private async updateRateLimit(userId: string): Promise<void> {
    const rateLimits = this.config.rateLimits;
    if (!rateLimits) {
      return;
    }

    const key = `user:${userId}`;
    const now = Date.now();
    const windowMs = rateLimits.windowMs || 60000;

    let record = this.rateLimitTracker.get(key);

    if (!record || record.resetTime <= now) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    record.count++;
    this.rateLimitTracker.set(key, record);
  }

  async shutdown(): Promise<void> {
    // Cancel all scheduled notifications
    for (const [, timer] of this.scheduledNotifications) {
      clearTimeout(timer);
    }
    this.scheduledNotifications.clear();

    // Clear rate limit tracker
    this.rateLimitTracker.clear();

    this.logger?.info('Notification service shutdown complete');
  }
}
