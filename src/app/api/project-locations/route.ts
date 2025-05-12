// src/app/api/project-locations/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
}

const initialProjectLocationsData: ProjectLocation[] = [
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: "loc_b12_techfest2024", 
    locationId: "B-12",
    section: "B",
    position: 12,
    department: "dept_me_gpp",
    eventId: "event_techfest_2024_gpp",
    isAssigned: true,
    projectId: "proj_waterpurifier_gpp", 
    createdBy: "user_admin_gpp",
    updatedBy: "user_admin_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ensureProjectLocationsStore = () => {
  if (!global.__API_PROJECT_LOCATIONS_STORE__ || !Array.isArray(global.__API_PROJECT_LOCATIONS_STORE__)) {
    console.warn("Project Locations API Store was not an array or undefined. Initializing with default data.");
    global.__API_PROJECT_LOCATIONS_STORE__ = [...initialProjectLocationsData];
  } else if (global.__API_PROJECT_LOCATIONS_STORE__.length === 0 && process.env.NODE_ENV === 'development') {
    // console.warn("Project Locations API Store was an empty array. Re-initializing with default data for development.");
    // global.__API_PROJECT_LOCATIONS_STORE__ = [...initialProjectLocationsData];
  }
};
ensureProjectLocationsStore(); // Initialize at module load


const generateLocationIdInternal = (): string => `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  ensureProjectLocationsStore();
  const currentProjectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__!;
  
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const department = searchParams.get('department');
    const section = searchParams.get('section');
    const isAssignedParam = searchParams.get('isAssigned');

    let filteredLocations = [...currentProjectLocationsStore];

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
          pages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (error) {
    console.error("Error in GET /api/project-locations:", error);
    return NextResponse.json({ message: 'Internal server error processing project locations request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  ensureProjectLocationsStore();
  const currentProjectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__!;
  try {
    const locationData = await request.json() as Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

    if (!locationData.locationId || !locationData.section || locationData.position === undefined || !locationData.eventId) {
      return NextResponse.json({ message: 'Missing required fields: locationId, section, position, eventId.' }, { status: 400 });
    }
    
    if (currentProjectLocationsStore.some(loc => loc.locationId.toLowerCase() === locationData.locationId.toLowerCase() && loc.eventId === locationData.eventId)) {
        return NextResponse.json({ message: `Location ID '${locationData.locationId}' already exists for this event.` }, { status: 409 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newLocation: ProjectLocation = {
      id: generateLocationIdInternal(),
      ...locationData,
      isAssigned: locationData.isAssigned || false,
      createdBy: "user_admin_placeholder", 
      updatedBy: "user_admin_placeholder", 
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    currentProjectLocationsStore.push(newLocation);
    global.__API_PROJECT_LOCATIONS_STORE__ = currentProjectLocationsStore;

    return NextResponse.json({ status: 'success', data: { location: newLocation } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project location:', error);
    return NextResponse.json({ message: 'Error creating project location', error: (error as Error).message }, { status: 500 });
  }
}