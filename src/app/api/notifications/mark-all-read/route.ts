// src/app/api/notifications/mark-all-read/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Notification } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { NotificationModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'userId is required to mark all notifications as read.' }, { status: 400 });
    }

    const updateResult = await NotificationModel.updateMany(
      { userId, isRead: false },
      { 
        isRead: true,
        updatedAt: new Date().toISOString()
      }
    );

    return NextResponse.json({ 
      message: `Marked ${updateResult.modifiedCount} notifications as read for user ${userId}.`,
      count: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ message: 'Error marking all notifications as read', error: (error as Error).message }, { status: 500 });
  }
}