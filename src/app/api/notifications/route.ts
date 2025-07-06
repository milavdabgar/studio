// src/app/api/notifications/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Notification } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { NotificationModel } from '@/lib/models';

// Initialize default notifications if none exist
async function initializeDefaultNotifications() {
  await connectMongoose();
  const notificationCount = await NotificationModel.countDocuments();
  
  if (notificationCount === 0) {
    const defaultNotifications = [
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
    
    await NotificationModel.insertMany(defaultNotifications);
  }
}

const generateId = (): string => `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultNotifications();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ message: 'userId is required to fetch notifications.' }, { status: 400 });
    }

    // Build filter query
    const filter: any = { userId };
    if (isRead !== null) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .lean();
    
    // Format notifications to ensure proper id field
    const notificationsWithId = notifications.map(notification => ({
      ...notification,
      id: notification.id || (notification as any)._id.toString()
    }));

    return NextResponse.json(notificationsWithId);
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ message: 'Internal server error processing notifications request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const notificationData = await request.json() as Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>;

    if (!notificationData.userId || !notificationData.message || !notificationData.type) {
      return NextResponse.json({ message: 'Missing required fields: userId, message, type.' }, { status: 400 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newNotificationData = {
      id: generateId(),
      ...notificationData,
      isRead: false,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    const newNotification = new NotificationModel(newNotificationData);
    await newNotification.save();

    return NextResponse.json(newNotification.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ message: 'Error creating notification', error: (error as Error).message }, { status: 500 });
  }
}