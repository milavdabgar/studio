// src/app/api/project-events/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectEventModel } from '@/lib/models';

const generateEventId = (): string => `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Initialize default event if none exist
async function initializeDefaultEvents() {
  await connectMongoose();
  const eventCount = await ProjectEventModel.countDocuments();
  
  if (eventCount === 0) {
    const now = new Date().toISOString();
    const defaultEvent = {
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
    };
    
    const newEvent = new ProjectEventModel(defaultEvent);
    await newEvent.save();
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultEvents();
    
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');

    // Build filter query
    let filter = {};
    if (isActiveParam === 'true') {
      filter = { isActive: true };
    } else if (isActiveParam === 'false') {
      filter = { isActive: false };
    }

    const events = await ProjectEventModel.find(filter).lean();
    
    // Format events to ensure proper id field
    const eventsWithId = events.map(event => ({
      ...event,
      id: event.id || (event as { _id: { toString(): string } })._id.toString()
    }));
    
    // Sort events
    eventsWithId.sort((a, b) => {
      const eventA = a as { eventDate?: string | Date; isActive?: boolean };
      const eventB = b as { eventDate?: string | Date; isActive?: boolean };
      
      // Handle both string and Date types for eventDate
      const getTimestamp = (date: string | Date | undefined): number => {
        if (!date) return 0;
        if (typeof date === 'string') {
          try {
            return parseISO(date).getTime();
          } catch {
            return new Date(date).getTime() || 0;
          }
        }
        return date instanceof Date ? date.getTime() : 0;
      };
      
      const dateA = getTimestamp(eventA.eventDate);
      const dateB = getTimestamp(eventB.eventDate);
      
      if (eventA.isActive && !eventB.isActive) return -1;
      if (!eventA.isActive && eventB.isActive) return 1;
      if (eventA.isActive) return dateA - dateB; 
      return dateB - dateA; 
    });

    return NextResponse.json(eventsWithId);
  } catch (error) {
    console.error('Error in GET /api/project-events:', error);
    return NextResponse.json({ message: 'Internal server error processing project events request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
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
    const newEventData = {
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
    
    const newEvent = new ProjectEventModel(newEventData);
    await newEvent.save();
    
    return NextResponse.json(newEvent.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating project event:', error);
    return NextResponse.json({ message: 'Error creating project event' }, { status: 500 });
  }
}
