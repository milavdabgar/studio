// src/app/api/notifications/[notificationId]/read/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { NotificationModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { notificationId } = await params;
  
  try {
    await connectMongoose();
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let notification;
    if (notificationId.match(/^[0-9a-fA-F]{24}$/)) {
      notification = await NotificationModel.findById(notificationId);
    } else {
      notification = await NotificationModel.findOne({ id: notificationId });
    }

    if (!notification) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }

    const updatedNotification = await NotificationModel.findByIdAndUpdate(
      notification._id,
      { 
        isRead: true,
        updatedAt: new Date().toISOString()
      },
      { new: true }
    );

    return NextResponse.json(updatedNotification.toJSON());
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return NextResponse.json({ message: `Error marking notification ${notificationId} as read`, error: (error as Error).message }, { status: 500 });
  }
}