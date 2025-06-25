
// src/app/api/project-events/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventStatus, ProjectEventScheduleItem, ProjectTeam } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { notificationService } from '@/lib/api/notifications';


declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
}

if (!global.__API_PROJECT_EVENTS_STORE__) {
  global.__API_PROJECT_EVENTS_STORE__ = [];
}
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];

const projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;
const projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const event = projectEventsStore.find(e => e.id === id);
  if (event) {
    return NextResponse.json(event);
  }
  return NextResponse.json({ message: 'Event not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const eventDataToUpdate = await request.json() as Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    const eventIndex = projectEventsStore.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const existingEvent = projectEventsStore[eventIndex];

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
      updatedBy: "user_admin_placeholder", 
      updatedAt: new Date().toISOString(),
    };

    projectEventsStore[eventIndex] = updatedEvent;
    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;

    // --- Notification Trigger for Results Published ---
    if (eventDataToUpdate.publishResults === true && existingEvent.publishResults !== true) {
        const teamsForEvent = projectTeamsStore.filter(team => team.eventId === id);
        const userIdsToNotify: Set<string> = new Set();
        teamsForEvent.forEach(team => {
            team.members.forEach(member => userIdsToNotify.add(member.userId));
        });

        for (const userId of userIdsToNotify) {
            try {
                await notificationService.createNotification({
                    userId: userId,
                    message: `Results for the event '${updatedEvent.name}' have been published! Check the event page for details.`,
                    type: 'event_results_published',
                    link: `/project-fair/student`, // Or a more specific results page
                });
            } catch (notifError) {
                console.error(`Failed to send results published notification to user ${userId}:`, notifError);
            }
        }
    }
    // --- End Notification Trigger ---

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    return NextResponse.json({ message: `Error updating event ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const eventIndex = projectEventsStore.findIndex(e => e.id === id);

  if (eventIndex === -1) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  // Remove the event from the store
  projectEventsStore.splice(eventIndex, 1);
  global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;
  return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
}
