
// src/app/api/project-events/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventStatus, ProjectEventScheduleItem } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

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
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const event = projectEventsStore.find(e => e.id === id);
  if (event) {
    return NextResponse.json(event);
  }
  return NextResponse.json({ message: 'Event not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const eventDataToUpdate = await request.json() as Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    const eventIndex = projectEventsStore.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const existingEvent = projectEventsStore[eventIndex];

    // Validations
    if (eventDataToUpdate.name !== undefined && !eventDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Event Name cannot be empty.' }, { status: 400 });
    }
    if (eventDataToUpdate.academicYear !== undefined && !eventDataToUpdate.academicYear.trim()) {
        return NextResponse.json({ message: 'Academic Year cannot be empty.' }, { status: 400 });
    }
    
    const newEventDate = eventDataToUpdate.eventDate ? parseISO(eventDataToUpdate.eventDate) : parseISO(existingEvent.eventDate);
    const newRegStartDate = eventDataToUpdate.registrationStartDate ? parseISO(eventDataToUpdate.registrationStartDate) : parseISO(existingEvent.registrationStartDate);
    const newRegEndDate = eventDataToUpdate.registrationEndDate ? parseISO(eventDataToUpdate.registrationEndDate) : parseISO(existingEvent.registrationEndDate);

    if (!isValid(newEventDate) || !isValid(newRegStartDate) || !isValid(newRegEndDate)) {
         return NextResponse.json({ message: 'Invalid date format provided.' }, { status: 400 });
    }
    if (newRegStartDate >= newEventDate || newRegEndDate >= newEventDate || newRegStartDate >= newRegEndDate) {
        return NextResponse.json({ message: 'Event dates are illogical. Please check registration and event dates.' }, { status: 400 });
    }
     if (eventDataToUpdate.status && !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(eventDataToUpdate.status)) {
        return NextResponse.json({ message: 'Invalid event status.' }, { status: 400 });
    }


    const updatedEvent: ProjectEvent = {
      ...existingEvent,
      ...eventDataToUpdate,
      name: eventDataToUpdate.name?.trim() || existingEvent.name,
      description: eventDataToUpdate.description !== undefined ? eventDataToUpdate.description.trim() || undefined : existingEvent.description,
      academicYear: eventDataToUpdate.academicYear?.trim() || existingEvent.academicYear,
      eventDate: eventDataToUpdate.eventDate || existingEvent.eventDate,
      registrationStartDate: eventDataToUpdate.registrationStartDate || existingEvent.registrationStartDate,
      registrationEndDate: eventDataToUpdate.registrationEndDate || existingEvent.registrationEndDate,
      updatedBy: "user_admin_placeholder", // TODO: Get actual user ID
      updatedAt: new Date().toISOString(),
    };

    projectEventsStore[eventIndex] = updatedEvent;
    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    return NextResponse.json({ message: `Error updating event ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = projectEventsStore.length;
  projectEventsStore = projectEventsStore.filter(e => e.id !== id);

  if (projectEventsStore.length === initialLength) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }
  global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;
  return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
}

// Specific route for updating schedule, though it can be part of PUT
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { id } = params; // This is the event ID
    // Check if the request is specifically for the schedule sub-resource based on URL or payload.
    // For a dedicated route like /api/project-events/[id]/schedule, this check might not be needed
    // if this PATCH handler is ONLY for schedule.
    // However, if PATCH on /api/project-events/[id] can update other fields too, a check is good.

    // Assuming this handler is now at /api/project-events/[id]/schedule/route.ts
    // then the path check is implicitly handled by the file system routing.
    
    try {
        const { schedule } = await request.json() as { schedule: ProjectEventScheduleItem[] };
        const eventIndex = projectEventsStore.findIndex(e => e.id === id);

        if (eventIndex === -1) {
            return NextResponse.json({ message: 'Event not found for schedule update' }, { status: 404 });
        }

        projectEventsStore[eventIndex].schedule = schedule;
        projectEventsStore[eventIndex].updatedAt = new Date().toISOString();
        projectEventsStore[eventIndex].updatedBy = "user_admin_placeholder_schedule_patch"; // Placeholder
        global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;

        return NextResponse.json(projectEventsStore[eventIndex]);
    } catch (error) {
        console.error(`Error updating schedule for event ${id}:`, error);
        return NextResponse.json({ message: `Error updating schedule for event ${id}`, error: (error as Error).message }, { status: 500 });
    }
}
