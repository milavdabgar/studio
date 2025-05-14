// src/app/api/notifications/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Notification } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_NOTIFICATIONS_STORE__: Notification[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_NOTIFICATIONS_STORE__) {
  global.__API_NOTIFICATIONS_STORE__ = [
    {
      id: "notif_1",
      userId: "user_student_ce001_gpp", // Example student user ID
      message: "Your assignment 'CS101 Midterm Project' has been graded.",
      type: "success",
      isRead: false,
      link: "/student/assignments/asmnt_quiz1_cs101_gpp", // Link to a specific assignment
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif_2",
      userId: "user_student_ce001_gpp",
      message: "Reminder: Class 'Advanced Algorithms' starts in 30 minutes.",
      type: "reminder",
      isRead: true,
      link: "/student/timetable",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
     {
      id: "notif_3",
      userId: "user_admin_gpp", 
      message: "New enrollment request for 'Data Structures' in 'DCE 2022-2025'.",
      type: "info",
      isRead: false,
      link: "/admin/enrollments",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
let notificationsStore: Notification[] = global.__API_NOTIFICATIONS_STORE__;

const generateId = (): string => `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'userId is required to fetch notifications.' }, { status: 400 });
  }

  const userNotifications = notificationsStore
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
  
  return NextResponse.json(userNotifications);
}

export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json() as Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>;

    if (!notificationData.userId || !notificationData.message || !notificationData.type) {
      return NextResponse.json({ message: 'Missing required fields: userId, message, type.' }, { status: 400 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newNotification: Notification = {
      id: generateId(),
      ...notificationData,
      isRead: false,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    notificationsStore.unshift(newNotification); // Add to the beginning for newest first
    global.__API_NOTIFICATIONS_STORE__ = notificationsStore;

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ message: 'Error creating notification', error: (error as Error).message }, { status: 500 });
  }
}