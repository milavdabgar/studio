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
// This variable will reference the global store.
// IMPORTANT: If this variable is reassigned (e.g., by .filter()), 
// global.__API_PROJECT_EVENTS_STORE__ must also be reassigned to reflect the change.
let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  // Ensure the store is an array before searching
  if (!Array.isArray(global.__API_PROJECT_EVENTS_STORE__)) {
    global.__API_PROJECT_EVENTS_STORE__ = []; // Recover if possible
    return NextResponse.json({ message: 'Project Event data store corrupted.' }, { status: 500 });
  }
  const event = global.__API_PROJECT_EVENTS_STORE__.find(e => e.id === id);
  if (event) {
    return NextResponse.json(event);
  }
  return NextResponse.json({ message: 'Event not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_PROJECT_EVENTS_STORE__)) {
    global.__API_PROJECT_EVENTS_STORE__ = [];
    return NextResponse.json({ message: 'Project Event data store corrupted.' }, { status: 500 });
  }
  try {
    const eventDataToUpdate = await request.json() as Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    const eventIndex = global.__API_PROJECT_EVENTS_STORE__.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const existingEvent = global.__API_PROJECT_EVENTS_STORE__[eventIndex];

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

    global.__API_PROJECT_EVENTS_STORE__[eventIndex] = updatedEvent;
    projectEventsStore = global.__API_PROJECT_EVENTS_STORE__; // Keep local ref in sync
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    return NextResponse.json({ message: `Error updating event ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_PROJECT_EVENTS_STORE__)) {
    global.__API_PROJECT_EVENTS_STORE__ = [];
    return NextResponse.json({ message: 'Project Event data store corrupted during delete.' }, { status: 500 });
  }
  const initialLength = global.__API_PROJECT_EVENTS_STORE__.length;
  const newStore = global.__API_PROJECT_EVENTS_STORE__.filter(e => e.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }
  global.__API_PROJECT_EVENTS_STORE__ = newStore;
  projectEventsStore = global.__API_PROJECT_EVENTS_STORE__;
  return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
}
