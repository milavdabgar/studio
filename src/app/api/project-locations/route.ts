import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectLocationModel } from '@/lib/models';

// Initialize default project locations if none exist
async function initializeDefaultProjectLocations() {
  await connectMongoose();
  const locationCount = await ProjectLocationModel.countDocuments();
  
  if (locationCount === 0) {
    const now = new Date().toISOString();
    const defaultProjectLocations = [
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
        projectId: "proj_waterpurifier_gpp", 
        createdBy: "user_admin_gpp",
        updatedBy: "user_admin_gpp",
        createdAt: now,
        updatedAt: now,
      },
    ];
    
    await ProjectLocationModel.insertMany(defaultProjectLocations);
  }
}

const generateLocationIdInternal = (): string => `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultProjectLocations();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const department = searchParams.get('department');
    const section = searchParams.get('section');
    const isAssignedParam = searchParams.get('isAssigned');

    // Build filter query
    let filter: any = {};
    if (eventId) filter.eventId = eventId;
    if (department) filter.department = department;
    if (section) filter.section = section;
    if (isAssignedParam !== null) {
      filter.isAssigned = isAssignedParam === 'true';
    }
    
    const page = parseInt(searchParams.get('page') as string) || 1;
    const limit = parseInt(searchParams.get('limit') as string) || 50;
    const skip = (page - 1) * limit;
    
    const [locations, total] = await Promise.all([
      ProjectLocationModel.find(filter).skip(skip).limit(limit).lean(),
      ProjectLocationModel.countDocuments(filter)
    ]);
    
    // Format locations to ensure proper id field
    const locationsWithId = locations.map(location => ({
      ...location,
      id: location.id || (location as any)._id.toString()
    }));

    return NextResponse.json({ 
      status: 'success',
      data: {
        locations: locationsWithId,
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
  try {
    await connectMongoose();
    
    const locationData = await request.json() as Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

    if (!locationData.locationId || !locationData.locationId.trim()) {
      return NextResponse.json({ message: 'Location ID is required.' }, { status: 400 });
    }
    if (!locationData.section || !locationData.section.trim()) {
      return NextResponse.json({ message: 'Section is required.' }, { status: 400 });
    }
    if (locationData.position === undefined || locationData.position < 1) {
      return NextResponse.json({ message: 'Valid position (>= 1) is required.' }, { status: 400 });
    }
    if (!locationData.eventId || !locationData.eventId.trim()) {
      return NextResponse.json({ message: 'Event ID is required.' }, { status: 400 });
    }
    
    // Check for duplicate locationId within the same event
    const existingLocation = await ProjectLocationModel.findOne({
      locationId: { $regex: new RegExp(`^${locationData.locationId.trim()}$`, 'i') },
      eventId: locationData.eventId
    });
    
    if (existingLocation) {
      return NextResponse.json({ message: `Location ID '${locationData.locationId}' already exists for this event.` }, { status: 409 });
    }
    
    const currentTimestamp = new Date().toISOString();
    const newLocationData = {
      id: generateLocationIdInternal(),
      locationId: locationData.locationId.trim(),
      section: locationData.section.trim(),
      position: locationData.position,
      department: locationData.department || undefined,
      eventId: locationData.eventId,
      projectId: locationData.projectId || undefined,
      isAssigned: locationData.isAssigned || false,
      notes: locationData.notes || undefined,
      createdBy: "user_admin_placeholder", 
      updatedBy: "user_admin_placeholder", 
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newLocation = new ProjectLocationModel(newLocationData);
    await newLocation.save();

    return NextResponse.json({ status: 'success', data: { location: newLocation.toJSON() } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project location:', error);
    return NextResponse.json({ message: 'Error creating project location', error: (error as Error).message }, { status: 500 });
  }
}