// src/app/api/project-events/[id]/schedule/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventScheduleItem, ProjectTeam } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';
import { ProjectEventModel, ProjectTeamModel } from '@/lib/models';
import mongoose from 'mongoose';

type ProjectEventLean = Omit<ProjectEvent, 'id'> & { 
  _id: string; 
  id?: string; 
  __v?: number; 
};

type ProjectTeamLean = Omit<ProjectTeam, 'id'> & { 
  _id: string; 
  id?: string; 
  __v?: number; 
};

interface RouteParams {
  params: Promise<{
    id: string; // Event ID
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const { schedule } = await request.json() as { schedule: ProjectEventScheduleItem[] };
    
    if (!Array.isArray(schedule)) {
        return NextResponse.json({ message: 'Invalid schedule data format. Expected an array.'}, { status: 400});
    }

    const eventToUpdate = await ProjectEventModel.findOneAndUpdate(
      { id: eventId },
      {
        schedule: schedule,
        updatedAt: new Date().toISOString(),
        updatedBy: "user_admin_placeholder_schedule_patch"
      },
      { new: true, lean: true }
    ) as ProjectEventLean | null;

    if (!eventToUpdate) {
      return NextResponse.json({ message: 'Event not found for schedule update' }, { status: 404 });
    }

    // --- Notification Trigger ---
    const teamsForEvent = await ProjectTeamModel.find({ eventId: eventId }).lean() as ProjectTeamLean[];
    const userIdsToNotify: Set<string> = new Set();
    
    teamsForEvent.forEach(team => {
        team.members?.forEach((member: { userId: string }) => userIdsToNotify.add(member.userId));
    });

    for (const userId of userIdsToNotify) {
        try {
            await notificationService.createNotification({
                userId: userId,
                message: `The schedule for event '${eventToUpdate.name}' has been updated. Please check the portal.`,
                type: 'event_schedule_update',
                link: `/project-fair/student`, // Or a more specific event schedule page
            });
        } catch (notifError) {
            console.error(`Failed to send schedule update notification to user ${userId}:`, notifError);
        }
    }
    // --- End Notification Trigger ---

    return NextResponse.json(eventToUpdate);
  } catch (error) {
    console.error(`Error updating schedule for event ${eventId}:`, error);
    return NextResponse.json({ message: `Error updating schedule for event ${eventId}`, error: (error as Error).message }, { status: 500 });
  }
}
