// src/app/api/notifications/mark-all-read/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Notification } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_NOTIFICATIONS_STORE__: Notification[] | undefined;
}
if (!global.__API_NOTIFICATIONS_STORE__) {
  global.__API_NOTIFICATIONS_STORE__ = [];
}
const notificationsStore: Notification[] = global.__API_NOTIFICATIONS_STORE__;

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'userId is required to mark all notifications as read.' }, { status: 400 });
  }

  let updatedCount = 0;
  notificationsStore.forEach(notification => {
    if (notification.userId === userId && !notification.isRead) {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
      updatedCount++;
    }
  });
  global.__API_NOTIFICATIONS_STORE__ = notificationsStore;

  return NextResponse.json({ message: `Marked ${updatedCount} notifications as read for user ${userId}.` });
}