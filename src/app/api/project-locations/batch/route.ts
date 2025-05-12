// src/app/api/project-locations/batch/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
}

if (!global.__API_PROJECT_LOCATIONS_STORE__) {
  global.__API_PROJECT_LOCATIONS_STORE__ = [];
}
let projectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__;

const generateLocationIdInternal = (): string => `loc_batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locationsToCreateData = body.locations as Array<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

    if (!Array.isArray(locationsToCreateData) || locationsToCreateData.length === 0) {
      return NextResponse.json({ message: 'No locations data provided in the batch.' }, { status: 400 });
    }
    
    const createdLocations: ProjectLocation[] = [];
    const errors: { data: any, message: string }[] = [];
    const currentTimestamp = new Date().toISOString();

    for (const locationData of locationsToCreateData) {
      if (!locationData.locationId || !locationData.section || locationData.position === undefined || !locationData.eventId) {
        errors.push({ data: locationData, message: 'Missing required fields: locationId, section, position, eventId.' });
        continue;
      }
      if (projectLocationsStore.some(loc => loc.locationId.toLowerCase() === locationData.locationId.toLowerCase() && loc.eventId === locationData.eventId)) {
        errors.push({ data: locationData, message: `Location ID '${locationData.locationId}' already exists for this event.` });
        continue;
      }

      const newLocation: ProjectLocation = {
        id: generateLocationIdInternal(),
        ...locationData,
        isAssigned: locationData.isAssigned || false,
        createdBy: "user_admin_placeholder_batch", // TODO: Actual user
        updatedBy: "user_admin_placeholder_batch",
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      projectLocationsStore.push(newLocation);
      createdLocations.push(newLocation);
    }
    global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;

    if (errors.length > 0 && createdLocations.length === 0) {
        return NextResponse.json({ message: 'Batch creation failed. No locations were created.', errors}, { status: 400 });
    }
    if (errors.length > 0) {
        return NextResponse.json({ status: 'partial_success', message: 'Some locations created, some failed.', data: { count: createdLocations.length, locations: createdLocations, errors } }, { status: 207 });
    }

    return NextResponse.json({ status: 'success', data: { count: createdLocations.length, locations: createdLocations } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project location batch:', error);
    return NextResponse.json({ message: 'Error creating project location batch', error: (error as Error).message }, { status: 500 });
  }
}