// src/app/api/project-events/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventStatus, ProjectEventScheduleItem } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}

const initialProjectEventsData: ProjectEvent[] = [ /* Default data if needed */ ];

const ensureProjectEventsStore = () => {
  if (!global.__API_PROJECT_EVENTS_STORE__ || !Array.isArray(global.__API_PROJECT_EVENTS_STORE__)) {
    console.warn("Project Events API Store (by ID) was not an array or undefined. Initializing.");
    global.__API_PROJECT_EVENTS_STORE__ = [...initialProjectEventsData]; // Or just [] if no defaults
  }
};

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  ensureProjectEventsStore();
  const currentProjectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__!;
  const { id } = params;
  
  try {
    const event = currentProjectEventsStore.find(e => e.id === id);
    if (event) {
      return NextResponse.json(event);
    }
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error in GET /api/project-events/${id}:`, error);
    return NextResponse.json({ message: 'Internal server error.', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  ensureProjectEventsStore();
  const currentProjectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__!;
  const { id } = params;

  try {
    const eventDataToUpdate = await request.json() as Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    const eventIndex = currentProjectEventsStore.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const existingEvent = currentProjectEventsStore[eventIndex];

    if (eventDataToUpdate.name !== undefined && !eventDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Event Name cannot be empty.' }, { status: 400 });
    }
    // ... other validations from previous commit ...
    const newEventDate = eventDataToUpdate.eventDate ? parseISO(eventDataToUpdate.eventDate) : parseISO(existingEvent.eventDate);
    const newRegStartDate = eventDataToUpdate.registrationStartDate ? parseISO(eventDataToUpdate.registrationStartDate) : parseISO(existingEvent.registrationStartDate);
    const newRegEndDate = eventDataToUpdate.registrationEndDate ? parseISO(eventDataToUpdate.registrationEndDate) : parseISO(existingEvent.registrationEndDate);

    if (!isValid(newEventDate) || !isValid(newRegStartDate) || !isValid(newRegEndDate)) {
         return NextResponse.json({ message: 'Invalid date format provided.' }, { status: 400 });
    }
    if (newRegStartDate >= newEventDate || newRegEndDate >= newEventDate || newRegStartDate >= newRegEndDate) {
        return NextResponse.json({ message: 'Event dates are illogical. Please check registration and event dates.' }, { status: 400 });
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
      updatedBy: "user_admin_placeholder", 
      updatedAt: new Date().toISOString(),
    };

    currentProjectEventsStore[eventIndex] = updatedEvent;
    global.__API_PROJECT_EVENTS_STORE__ = currentProjectEventsStore;
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    return NextResponse.json({ message: `Error updating event ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  ensureProjectEventsStore();
  let currentProjectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__!;
  const { id } = params;

  try {
    const initialLength = currentProjectEventsStore.length;
    const newStore = currentProjectEventsStore.filter(e => e.id !== id);

    if (newStore.length === initialLength) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    global.__API_PROJECT_EVENTS_STORE__ = newStore;
    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    return NextResponse.json({ message: `Error deleting event ${id}`, error: (error as Error).message }, { status: 500 });
  }
}
```
  </change>
  <change>
    <file>src/app/api/project-locations/[id]/route