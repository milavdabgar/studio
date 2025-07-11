// src/app/api/project-locations/batch/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { ProjectLocationModel } from '@/lib/models';
import type { ProjectLocation } from '@/types/entities';

const generateLocationIdInternal = (): string => `loc_batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const body = await request.json();
    const locationsToCreateData = body.locations as Array<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

    if (!Array.isArray(locationsToCreateData) || locationsToCreateData.length === 0) {
      return NextResponse.json({ message: 'No locations data provided in the batch.' }, { status: 400 });
    }
    
    const createdLocations: ProjectLocation[] = [];
    const errors: { data: unknown, message: string }[] = [];
    const currentTimestamp = new Date().toISOString();

    for (const locationData of locationsToCreateData) {
      if (!locationData.locationId || !locationData.section || locationData.position === undefined || !locationData.eventId) {
        errors.push({ data: locationData, message: 'Missing required fields: locationId, section, position, eventId.' });
        continue;
      }
      
      const existingLocation = await ProjectLocationModel.findOne({ 
        locationId: { $regex: new RegExp(`^${locationData.locationId}$`, 'i') }, 
        eventId: locationData.eventId 
      });
      
      if (existingLocation) {
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
      
      const savedLocation = await ProjectLocationModel.create(newLocation);
      createdLocations.push(savedLocation.toObject());
    }

    if (errors.length > 0 && createdLocations.length === 0) {
        return NextResponse.json({ message: 'Batch creation failed. No locations were created.', errors}, { status: 400 });
    }
    if (errors.length > 0) {
        return NextResponse.json({ status: 'partial_success', message: 'Some locations created, some failed.', data: { count: createdLocations.length, locations: createdLocations, errors } }, { status: 207 });
    }

    return NextResponse.json({ status: 'success', data: { count: createdLocations.length, locations: createdLocations } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project location batch:', error);
    return NextResponse.json({ message: 'Error creating project location batch' }, { status: 500 });
  }
}