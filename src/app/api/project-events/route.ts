// src/app/api/project-events/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, ProjectEventStatus } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_PROJECT_EVENTS_STORE__ || global.__API_PROJECT_EVENTS_STORE__.length === 0) {
  global.__API_PROJECT_EVENTS_STORE__ = [
    { 
      id: "event_techfest_2024_gpp", 
      name: "TechFest 2024",
      academicYear: "2024-25",
      description: "Annual technical project fair.",
      eventDate: "2025-03-15T00:00:00.000Z",
      registrationStartDate: "2024-12-01T00:00:00.000Z",
      registrationEndDate: "2025-01-31T00:00:00.000Z",
      status: "upcoming",
      isActive: true,
      departments: ["dept_ce_gpp", "dept_me_gpp"],
      createdBy: "user_admin_gpp",
      updatedBy: "user_admin_gpp",
      createdAt: now,
      updatedAt: now,
      schedule: [
        { time: "09:00 AM - 10:00 AM", activity: "Inauguration", location: "Auditorium", coordinator: { userId: "user_faculty_cs01_gpp", name: "Prof. CS01" }, notes: "Chief Guest to arrive by 8:45 AM" },
        { time: "10:00 AM - 01:00 PM", activity: "Project Expo Round 1", location: "Main Building Stalls", coordinator: { userId: "user_hod_ce_gpp", name: "HOD CE" }, notes: "Judges to visit stalls" }
      ],
      publishResults: false,
    },
  ];
}
let projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

const generateEventId = (): string => `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get('isActive');

  let filteredEvents = [...projectEventsStore];

  if (isActiveParam === 'true') {
    filteredEvents = filteredEvents.filter(event => event.isActive);
  } else if (isActiveParam === 'false') {
    filteredEvents = filteredEvents.filter(event => !event.isActive);
  }
  
  filteredEvents.sort((a, b) => {
    const dateA = a.eventDate ? parseISO(a.eventDate).getTime() : 0;
    const dateB = b.eventDate ? parseISO(b.eventDate).getTime() : 0;
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (a.isActive) return dateA - dateB; // Active events sorted ascending by date
    return dateB - dateA; // Inactive events sorted descending by date (most recent inactive first)
  });

  return NextResponse.json(filteredEvents);
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json() as Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'>;

    if (!eventData.name || !eventData.name.trim()) {
      return NextResponse.json({ message: 'Event Name is required.' }, { status: 400 });
    }
    if (!eventData.academicYear || !eventData.academicYear.trim()) {
      return NextResponse.json({ message: 'Academic Year is required.' }, { status: 400 });
    }
    if (!eventData.eventDate || !isValid(parseISO(eventData.eventDate))) {
      return NextResponse.json({ message: 'Valid Event Date is required.' }, { status: 400 });
    }
    if (!eventData.registrationStartDate || !isValid(parseISO(eventData.registrationStartDate))) {
      return NextResponse.json({ message: 'Valid Registration Start Date is required.' }, { status: 400 });
    }
    if (!eventData.registrationEndDate || !isValid(parseISO(eventData.registrationEndDate))) {
      return NextResponse.json({ message: 'Valid Registration End Date is required.' }, { status: 400 });
    }
    if (parseISO(eventData.registrationStartDate) >= parseISO(eventData.eventDate) || parseISO(eventData.registrationEndDate) >= parseISO(eventData.eventDate) || parseISO(eventData.registrationStartDate) >= parseISO(eventData.registrationEndDate)) {
        return NextResponse.json({ message: 'Event dates are illogical. Please check registration and event dates.' }, { status: 400 });
    }
    if (!eventData.status) {
        return NextResponse.json({ message: 'Event status is required.' }, { status: 400 });
    }


    const currentTimestamp = new Date().toISOString();
    const newEvent: ProjectEvent = {
      id: generateEventId(),
      name: eventData.name.trim(),
      description: eventData.description?.trim() || undefined,
      academicYear: eventData.academicYear.trim(),
      eventDate: eventData.eventDate,
      registrationStartDate: eventData.registrationStartDate,
      registrationEndDate: eventData.registrationEndDate,
      status: eventData.status,
      isActive: eventData.isActive === undefined ? true : eventData.isActive,
      publishResults: eventData.publishResults === undefined ? false : eventData.publishResults,
      schedule: [], 
      departments: eventData.departments || [],
      createdBy: "user_admin_placeholder", 
      updatedBy: "user_admin_placeholder",
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    projectEventsStore.push(newEvent);
    global.__API_PROJECT_EVENTS_STORE__ = projectEventsStore;
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating project event:', error);
    return NextResponse.json({ message: 'Error creating project event', error: (error as Error).message }, { status: 500 });
  }
}