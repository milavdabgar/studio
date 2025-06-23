// src/app/api/notifications/[notificationId]/read/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Notification } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_NOTIFICATIONS_STORE__: Notification[] | undefined;
}
if (!global.__API_NOTIFICATIONS_STORE__) {
  global.__API_NOTIFICATIONS_STORE__ = [];
}
let notificationsStore: Notification[] = global.__API_NOTIFICATIONS_STORE__;

interface RouteParams {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { notificationId } = await params;
  const notificationIndex = notificationsStore.findIndex(n => n.id === notificationId);

  if (notificationIndex === -1) {
    return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
  }

  notificationsStore[notificationIndex].isRead = true;
  notificationsStore[notificationIndex].updatedAt = new Date().toISOString();
  global.__API_NOTIFICATIONS_STORE__ = notificationsStore;

  return NextResponse.json(notificationsStore[notificationIndex]);
}