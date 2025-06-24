import { test, expect } from '@playwright/test';

test.describe('Notifications API - Comprehensive E2E Tests', () => {
  const baseURL = 'http://localhost:3000';
  let notificationId: string;
  const testUserId = 'user_test_123';

  test.beforeEach(async () => {
    // Note: These tests assume the server is running and authentication is handled
  });

  test.describe('Notifications CRUD Operations', () => {
    test('should create a new notification', async ({ request }) => {
      const notificationData = {
        userId: testUserId,
        message: 'This is a test notification message',
        type: 'info',
        link: '/test-link'
      };

      const response = await request.post(`${baseURL}/api/notifications`, {
        data: notificationData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('id');
      expect(responseData.userId).toBe(notificationData.userId);
      expect(responseData.message).toBe(notificationData.message);
      expect(responseData.type).toBe(notificationData.type);
      expect(responseData.isRead).toBe(false);
      expect(responseData.createdAt).toBeTruthy();
      expect(responseData.updatedAt).toBeTruthy();

      notificationId = responseData.id;
    });

    test('should get all notifications for a user', async ({ request }) => {
      // First create a notification for our test user
      const notificationData = {
        userId: testUserId,
        message: 'Test notification for GET request',
        type: 'success',
        link: '/test-get-link'
      };

      await request.post(`${baseURL}/api/notifications`, { data: notificationData });

      const response = await request.get(`${baseURL}/api/notifications?userId=${testUserId}`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
      
      // Filter for our test notifications
      const testNotifications = responseData.filter((n: any) => n.userId === testUserId);
      expect(testNotifications.length).toBeGreaterThan(0);
      
      if (testNotifications.length > 0) {
        const notification = testNotifications[0];
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('userId');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('isRead');
        expect(notification).toHaveProperty('createdAt');
        expect(notification).toHaveProperty('updatedAt');
      }
    });

    test('should require userId parameter for GET requests', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/notifications`);

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('userId is required');
    });

    test('should return empty array for non-existent user', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/notifications?userId=non_existent_user`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData.length).toBe(0);
    });
  });

  test.describe('Notification Read Operations', () => {
    test('should mark a notification as read', async ({ request }) => {
      // First create a notification
      const notificationData = {
        userId: testUserId,
        message: 'Test notification to mark as read',
        type: 'warning',
        link: '/test-mark-read'
      };

      const createResponse = await request.post(`${baseURL}/api/notifications`, {
        data: notificationData
      });

      const createdNotification = await createResponse.json();
      const testNotificationId = createdNotification.id;

      // Mark as read
      const response = await request.patch(`${baseURL}/api/notifications/${testNotificationId}/read`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.isRead).toBe(true);
      expect(responseData.updatedAt).toBeTruthy();
      expect(responseData.id).toBe(testNotificationId);
    });

    test('should mark all notifications as read for a user', async ({ request }) => {
      // Create multiple notifications for the test user
      const notifications = [
        { userId: testUserId, message: 'Test 1', type: 'info', link: '/test1' },
        { userId: testUserId, message: 'Test 2', type: 'success', link: '/test2' }
      ];

      for (const notif of notifications) {
        await request.post(`${baseURL}/api/notifications`, { data: notif });
      }

      // Mark all as read
      const response = await request.post(`${baseURL}/api/notifications/mark-all-read?userId=${testUserId}`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.message).toContain('Marked');
      expect(responseData.message).toContain(testUserId);
    });

    test('should handle marking non-existent notification as read', async ({ request }) => {
      const response = await request.patch(`${baseURL}/api/notifications/non-existent-id/read`);

      expect(response.status()).toBe(404);
      const responseData = await response.json();
      expect(responseData.message).toContain('not found');
    });

    test('should require userId for mark-all-read', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/notifications/mark-all-read`);

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('userId is required');
    });
  });

  test.describe('Notification Validation', () => {
    test('should reject notification creation with missing required fields', async ({ request }) => {
      const invalidData = {
        message: 'Missing userId and type'
      };

      const response = await request.post(`${baseURL}/api/notifications`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('Missing required fields');
    });

    test('should reject notification creation with missing userId', async ({ request }) => {
      const invalidData = {
        message: 'Test message',
        type: 'info'
        // Missing userId
      };

      const response = await request.post(`${baseURL}/api/notifications`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('userId');
    });

    test('should reject notification creation with missing message', async ({ request }) => {
      const invalidData = {
        userId: testUserId,
        type: 'info'
        // Missing message
      };

      const response = await request.post(`${baseURL}/api/notifications`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('message');
    });

    test('should reject notification creation with missing type', async ({ request }) => {
      const invalidData = {
        userId: testUserId,
        message: 'Test message'
        // Missing type
      };

      const response = await request.post(`${baseURL}/api/notifications`, {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toContain('type');
    });
  });

  test.describe('Notification Business Logic', () => {
    test('should create notification with all fields', async ({ request }) => {
      const notificationData = {
        userId: testUserId,
        message: 'Complete notification with all fields',
        type: 'reminder',
        link: '/complete-test-link'
      };

      const response = await request.post(`${baseURL}/api/notifications`, {
        data: notificationData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData.userId).toBe(notificationData.userId);
      expect(responseData.message).toBe(notificationData.message);
      expect(responseData.type).toBe(notificationData.type);
      expect(responseData.link).toBe(notificationData.link);
      expect(responseData.isRead).toBe(false);
      expect(responseData.createdAt).toBeTruthy();
      expect(responseData.updatedAt).toBeTruthy();
    });

    test('should handle different notification types', async ({ request }) => {
      const types = ['info', 'success', 'warning', 'error', 'reminder'];

      for (const type of types) {
        const notificationData = {
          userId: testUserId,
          message: `Test notification of type ${type}`,
          type: type,
          link: `/test-${type}`
        };

        const response = await request.post(`${baseURL}/api/notifications`, {
          data: notificationData
        });

        expect(response.status()).toBe(201);
        const responseData = await response.json();
        expect(responseData.type).toBe(type);
      }
    });

    test('should create notification without link', async ({ request }) => {
      const notificationData = {
        userId: testUserId,
        message: 'Notification without link',
        type: 'info'
        // No link field
      };

      const response = await request.post(`${baseURL}/api/notifications`, {
        data: notificationData
      });

      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData.userId).toBe(notificationData.userId);
      expect(responseData.message).toBe(notificationData.message);
      expect(responseData.type).toBe(notificationData.type);
    });
  });

  test.describe('Notification Query and Filtering', () => {
    test('should return notifications sorted by creation date (newest first)', async ({ request }) => {
      // Create multiple notifications with different timestamps
      const notifications = [
        { userId: testUserId, message: 'First notification', type: 'info', link: '/first' },
        { userId: testUserId, message: 'Second notification', type: 'success', link: '/second' }
      ];

      for (const notif of notifications) {
        await request.post(`${baseURL}/api/notifications`, { data: notif });
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const response = await request.get(`${baseURL}/api/notifications?userId=${testUserId}`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);

      // Filter for our test notifications and verify sorting
      const testNotifications = responseData.filter((n: any) => n.userId === testUserId);
      if (testNotifications.length > 1) {
        const dates = testNotifications.map((n: any) => new Date(n.createdAt));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
      }
    });

    test('should handle user with mixed read/unread notifications', async ({ request }) => {
      // Create notifications and mark some as read
      const notifications = [
        { userId: testUserId, message: 'Unread notification 1', type: 'info', link: '/unread1' },
        { userId: testUserId, message: 'Unread notification 2', type: 'warning', link: '/unread2' }
      ];

      const createdIds: string[] = [];
      for (const notif of notifications) {
        const createResponse = await request.post(`${baseURL}/api/notifications`, { data: notif });
        const created = await createResponse.json();
        createdIds.push(created.id);
      }

      // Mark the first one as read
      await request.patch(`${baseURL}/api/notifications/${createdIds[0]}/read`);

      // Get all notifications for the user
      const response = await request.get(`${baseURL}/api/notifications?userId=${testUserId}`);

      expect(response.status()).toBe(200);
      const responseData = await response.json();
      const testNotifications = responseData.filter((n: any) => n.userId === testUserId);
      
      // Find our specific notifications
      const readNotification = testNotifications.find((n: any) => n.id === createdIds[0]);
      const unreadNotification = testNotifications.find((n: any) => n.id === createdIds[1]);
      
      if (readNotification) {
        expect(readNotification.isRead).toBe(true);
      }
      if (unreadNotification) {
        expect(unreadNotification.isRead).toBe(false);
      }
    });
  });
});
