// src/app/api/project-locations/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
}

const now = new Date().toISOString();

if (!global.__API_PROJECT_LOCATIONS_STORE__ || global.__API_PROJECT_LOCATIONS_STORE__.length === 0) {
  global.__API_PROJECT_LOCATIONS_STORE__ = [
    { 
      id: "loc_a01_techfest2024", 
      locationId: "A-01",
      section: "A",
      position: 1,
      department: "dept_ce_gpp", 
      eventId: "event_techfest_2024_gpp",
      isAssigned: false,
      createdBy: "user_admin_gpp",
      updatedBy: "user_admin_gpp",
      createdAt: now,
      updatedAt: now,
    },
    { 
      id: "loc_b12_techfest2024", 
      locationId: "B-12",
      section: "B",
      position: 12,
      department: "dept_me_gpp",
      eventId: "event_techfest_2024_gpp",
      isAssigned: true,
      projectId: "proj_waterpurifier_gpp", // Example project assignment
      createdBy: "user_admin_gpp",
      updatedBy: "user_admin_gpp",
      createdAt: now,
      updatedAt: now,
    },
  ];
}
// Ensure local variable references the global store
let projectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__;


const generateLocationId = (): string => `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_PROJECT_LOCATIONS_STORE__)) {
    global.__API_PROJECT_LOCATIONS_STORE__ = [];
    projectLocationsStore = global.__API_PROJECT_LOCATIONS_STORE__;
    return NextResponse.json({ message: 'Internal server error: Project Location data store corrupted.' }, { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const department = searchParams.get('department');
  const section = searchParams.get('section');
  const isAssignedParam = searchParams.get('isAssigned');

  let filteredLocations = [...global.__API_PROJECT_LOCATIONS_STORE__];

  if (eventId) {
    filteredLocations = filteredLocations.filter(loc => loc.eventId === eventId);
  }
  if (department) {
    filteredLocations = filteredLocations.filter(loc => loc.department === department);
  }
  if (section) {
    filteredLocations = filteredLocations.filter(loc => loc.section === section);
  }
  if (isAssignedParam !== null) {
    const isAssigned = isAssignedParam === 'true';
    filteredLocations = filteredLocations.filter(loc => loc.isAssigned === isAssigned);
  }
  
  const page = parseInt(searchParams.get('page') as string) || 1;
  const limit = parseInt(searchParams.get('limit') as string) || 50;
  const total = filteredLocations.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

  return NextResponse.json({ 
    status: 'success',
    data: {
      locations: paginatedLocations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!Array.isArray(global.__API_PROJECT_LOCATIONS_STORE__)) {
        global.__API_PROJECT_LOCATIONS_STORE__ = [];
        projectLocationsStore = global.__API_PROJECT_LOCATIONS_STORE__;
    }

    const locationData = await request.json() as Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

    if (!locationData.locationId || !locationData.section || locationData.position === undefined || !locationData.eventId) {
      return NextResponse.json({ message: 'Missing required fields: locationId, section, position, eventId.' }, { status: 400 });
    }
    // Department is optional for a location itself, but might be required for assignment or filtering later.

    // Check for duplicates based on locationId and eventId
    if (global.__API_PROJECT_LOCATIONS_STORE__.some(loc => loc.locationId.toLowerCase() === locationData.locationId.toLowerCase() && loc.eventId === locationData.eventId)) {
        return NextResponse.json({ message: `Location ID '${locationData.locationId}' already exists for this event.` }, { status: 409 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newLocation: ProjectLocation = {
      id: generateLocationId(),
      ...locationData,
      isAssigned: locationData.isAssigned || false,
      createdBy: "user_admin_placeholder", // TODO: Replace with actual user ID
      updatedBy: "user_admin_placeholder", // TODO: Replace with actual user ID
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    global.__API_PROJECT_LOCATIONS_STORE__.push(newLocation);
    projectLocationsStore = global.__API_PROJECT_LOCATIONS_STORE__; // Update local reference

    return NextResponse.json({ status: 'success', data: { location: newLocation } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project location:', error);
    return NextResponse.json({ message: 'Error creating project location', error: (error as Error).message }, { status: 500 });
  }
}
