import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation } from '@/types/entities';

declare global {
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
}

const initialProjectLocationsData: ProjectLocation[] = [ /* Default data if needed */ ];

const ensureProjectLocationsStore = () => {
  if (!global.__API_PROJECT_LOCATIONS_STORE__ || !Array.isArray(global.__API_PROJECT_LOCATIONS_STORE__)) {
    console.warn("Project Locations API Store (by ID) was not an array or undefined. Initializing.");
    global.__API_PROJECT_LOCATIONS_STORE__ = [...initialProjectLocationsData];
  }
};


interface RouteParams {
  params: {
    id: string; // This ID can be either the MongoDB _id or the user-friendly locationId string (e.g., A-01)
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  ensureProjectLocationsStore();
  const currentProjectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__!;
  const { id } = params;

  try {
    // Attempt to find by MongoDB _id first, then by locationId string
    const location = currentProjectLocationsStore.find(loc => loc.id === id || loc.locationId === id);
    if (location) {
      return NextResponse.json({ status: 'success', data: { location }});
    }
    return NextResponse.json({ message: 'Project location not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error in GET /api/project-locations/${id}:`, error);
    return NextResponse.json({ message: 'Internal server error.', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) { // Changed to PUT for full update
  ensureProjectLocationsStore();
  const currentProjectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__!;
  const { id } = params;
  
  try {
    const locationDataToUpdate = await request.json() as Partial<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    const locationIndex = currentProjectLocationsStore.findIndex(loc => loc.id === id || loc.locationId === id);

    if (locationIndex === -1) {
      return NextResponse.json({ message: 'Project location not found' }, { status: 404 });
    }

    const existingLocation = currentProjectLocationsStore[locationIndex];

    // Basic validations
    if (locationDataToUpdate.locationId !== undefined && !locationDataToUpdate.locationId.trim()) {
        return NextResponse.json({ message: 'Location ID cannot be empty if provided.' }, { status: 400 });
    }
    if (locationDataToUpdate.section !== undefined && !locationDataToUpdate.section.trim()) {
        return NextResponse.json({ message: 'Section cannot be empty if provided.' }, { status: 400 });
    }
    if (locationDataToUpdate.position !== undefined && (isNaN(Number(locationDataToUpdate.position)) || Number(locationDataToUpdate.position) < 0)) {
        return NextResponse.json({ message: 'Position must be a non-negative number.' }, { status: 400 });
    }
    
    // Uniqueness check for locationId within the same event if it's being changed
    if (locationDataToUpdate.locationId && 
        locationDataToUpdate.locationId.toLowerCase() !== existingLocation.locationId.toLowerCase() &&
        currentProjectLocationsStore.some(loc => 
            loc.id !== existingLocation.id && 
            loc.locationId.toLowerCase() === locationDataToUpdate.locationId!.toLowerCase() && 
            loc.eventId === (locationDataToUpdate.eventId || existingLocation.eventId)
        )
    ) {
        return NextResponse.json({ message: `Location ID '${locationDataToUpdate.locationId}' already exists for this event.` }, { status: 409 });
    }


    const updatedLocation: ProjectLocation = { 
        ...existingLocation, 
        ...locationDataToUpdate,
        updatedBy: "user_admin_placeholder_loc_update", // TODO: Get actual user ID
        updatedAt: new Date().toISOString(),
    };

    currentProjectLocationsStore[locationIndex] = updatedLocation;
    global.__API_PROJECT_LOCATIONS_STORE__ = currentProjectLocationsStore;
    return NextResponse.json({ status: 'success', data: { location: updatedLocation }});
  } catch (error) {
    console.error(`Error updating project location ${id}:`, error);
    return NextResponse.json({ message: `Error updating project location ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  ensureProjectLocationsStore();
  let currentProjectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__!;
  const { id } = params;

  try {
    const initialLength = currentProjectLocationsStore.length;
    // Attempt to delete by MongoDB _id first, then by locationId string
    const newStore = currentProjectLocationsStore.filter(loc => loc.id !== id && loc.locationId !== id);

    if (newStore.length === initialLength) {
      return NextResponse.json({ message: 'Project location not found' }, { status: 404 });
    }
    
    global.__API_PROJECT_LOCATIONS_STORE__ = newStore;
    return NextResponse.json({ status: 'success', message: 'Project location deleted successfully' });
  } catch (error) {
    console.error(`Error deleting project location ${id}:`, error);
    return NextResponse.json({ message: `Error deleting project location ${id}`, error: (error as