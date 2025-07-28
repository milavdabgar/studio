import { notificationService } from './notifications';
import type { Notification } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; statusText?: string }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => JSON.stringify(await (options.json ? options.json() : {})),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('NotificationService API Tests', () => {
  const now = new Date().toISOString();
  const mockNotification: Notification = {
    id: "notif1",
    userId: "user1",
    recipientId: "user1",
    recipientType: "student",
    message: "This is a test notification",
    type: "info",
    channels: ["push"],
    priority: "medium",
    status: "sent",
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };
  const mockNotifications: Notification[] = [mockNotification];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getNotificationsForUser', () => {
    it('should fetch notifications for a user successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockNotifications }));
      const result = await notificationService.getNotificationsForUser('user1');
      expect(fetch).toHaveBeenCalledWith('/api/notifications?userId=user1');
      expect(result).toEqual(mockNotifications);
    });

    it('should throw error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ message: "Server Error" }) }));
      await expect(notificationService.getNotificationsForUser('user1')).rejects.toThrow("Server Error");
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(notificationService.getNotificationsForUser('user1')).rejects.toThrow('Failed to fetch notifications');
    });
  });

  describe('createNotification', () => {
    const newNotificationData = {
      userId: "user1",
      recipientId: "user1",
      recipientType: "student" as const,
      title: "New Notification",
      message: "This is a new notification",
      type: "warning" as const,
      channels: ["push" as const],
      priority: "medium" as const,
      status: "pending" as const,
    };

    it('should create a notification successfully', async () => {
      const createdNotification = { ...mockNotification, ...newNotificationData, id: 'newNotif1' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdNotification }));
      const result = await notificationService.createNotification(newNotificationData);
      expect(fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotificationData)
      }));
      expect(result).toEqual(createdNotification);
    });

    it('should throw error if creation fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: "Validation Error" }) }));
      await expect(notificationService.createNotification(newNotificationData)).rejects.toThrow("Validation Error");
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const readNotification = { ...mockNotification, isRead: true };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => readNotification }));
      const result = await notificationService.markNotificationAsRead('notif1');
      expect(fetch).toHaveBeenCalledWith('/api/notifications/notif1/read', expect.objectContaining({
        method: 'PATCH'
      }));
      expect(result).toEqual(readNotification);
    });

    it('should throw error if marking as read fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: "Notification not found" }) }));
      await expect(notificationService.markNotificationAsRead('nonexistent')).rejects.toThrow("Notification not found");
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      const successResponse = { message: "All notifications marked as read" };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => successResponse }));
      const result = await notificationService.markAllNotificationsAsRead('user1');
      expect(fetch).toHaveBeenCalledWith('/api/notifications/mark-all-read?userId=user1', expect.objectContaining({
        method: 'POST'
      }));
      expect(result).toEqual(successResponse);
    });

    it('should throw error if marking all as read fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: "Invalid user ID" }) }));
      await expect(notificationService.markAllNotificationsAsRead('invalid')).rejects.toThrow("Invalid user ID");
    });
  });
});