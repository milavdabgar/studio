// src/app/api/project-events/[id]/schedule/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventScheduleItem, ProjectTeam } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
}

if (!global.__API_PROJECT_EVENTS_STORE__) global.__API_PROJECT_EVENTS_STORE__ = [];
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];

let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;
const projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;


interface RouteParams {
  params: Promise<{
    id: string; // Event ID
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  try {
    const { schedule } = await request.json() as { schedule: ProjectEventScheduleItem[] };
    
    if (!Array.isArray(schedule)) {
        return NextResponse.json({ message: 'Invalid schedule data format. Expected an array.'}, { status: 400});
    }

    const eventIndex = projectEventsStore.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found for schedule update' }, { status: 404 });
    }
    
    const eventToUpdate = projectEventsStore[eventIndex];

    eventToUpdate.schedule = schedule;
    eventToUpdate.updatedAt = new Date().toISOString();
    eventToUpdate.updatedBy = "user_admin_placeholder_schedule_patch"; 
    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;

    // --- Notification Trigger ---
    const teamsForEvent = projectTeamsStore.filter(team => team.eventId === eventId);
    const userIdsToNotify: Set<string> = new Set();
    teamsForEvent.forEach(team => {
        team.members.forEach(member => userIdsToNotify.add(member.userId));
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
