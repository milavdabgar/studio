// src/app/api/project-events/[id]/schedule/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventScheduleItem } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}

if (!global.__API_PROJECT_EVENTS_STORE__) {
  global.__API_PROJECT_EVENTS_STORE__ = [];
}
let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

interface RouteParams {
  params: {
    id: string; // Event ID
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = params;
  try {
    const { schedule } = await request.json() as { schedule: ProjectEventScheduleItem[] };
    
    if (!Array.isArray(schedule)) {
        return NextResponse.json({ message: 'Invalid schedule data format. Expected an array.'}, { status: 400});
    }

    const eventIndex = projectEventsStore.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found for schedule update' }, { status: 404 });
    }

    projectEventsStore[eventIndex].schedule = schedule;
    projectEventsStore[eventIndex].updatedAt = new Date().toISOString();
    projectEventsStore[eventIndex].updatedBy = "user_admin_placeholder_schedule_patch"; // TODO: Get actual user ID

    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;

    return NextResponse.json(projectEventsStore[eventIndex]);
  } catch (error) {
    console.error(`Error updating schedule for event ${eventId}:`, error);
    return NextResponse.json({ message: `Error updating schedule for event ${eventId}`, error: (error as Error).message }, { status: 500 });
  }
}