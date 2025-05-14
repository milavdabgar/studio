// src/lib/api/notifications.ts
import type { Notification } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const notificationService = {
  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    const response = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notifications' }));
      throw new Error(errorData.message || 'Failed to fetch notifications');
    }
    return response.json();
  },

  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>): Promise<Notification> {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create notification' }));
      throw new Error(errorData.message || 'Failed to create notification');
    }
    return response.json();
  },

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH', // Using PATCH for partial update (marking as read)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to mark notification as read' }));
      throw new Error(errorData.message || 'Failed to mark notification as read');
    }
    return response.json();
  },
  
  async markAllNotificationsAsRead(userId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read?userId=${userId}`, {
      method: 'POST',
    });
     if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to mark all notifications as read' }));
      throw new Error(errorData.message || 'Failed to mark all notifications as read');
    }
    return response.json();
  },

  // Delete functionality might be useful later
  // async deleteNotification(notificationId: string): Promise<void> {
  //   const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
  //     method: 'DELETE',
  //   });
  //   if (!response.ok) {
  //     const errorData = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
  //     throw new Error(errorData.message || 'Failed to delete notification');
  //   }
  // }
};