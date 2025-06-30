import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectLocationModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string; // This ID can be either the MongoDB _id or the user-friendly locationId string (e.g., A-01)
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;

    // Attempt to find by custom id first, then by locationId string
    const location = await ProjectLocationModel.findOne({
      $or: [
        { id: id },
        { locationId: id }
      ]
    }).lean();
    
    if (!location) {
      return NextResponse.json({ message: 'Project location not found' }, { status: 404 });
    }
    
    // Format location to ensure proper id field
    const locationWithId = {
      ...location,
      id: location.id || (location as any)._id.toString()
    };
    
    return NextResponse.json({ status: 'success', data: { location: locationWithId }});
  } catch (error) {
    console.error(`Error in GET /api/project-locations/${(await params).id}:`, error);
    return NextResponse.json({ message: 'Internal server error.', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    const locationDataToUpdate = await request.json() as Partial<Omit<ProjectLocation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    
    // Find existing location by id or locationId
    const existingLocation = await ProjectLocationModel.findOne({
      $or: [
        { id: id },
        { locationId: id }
      ]
    }).lean();

    if (!existingLocation) {
      return NextResponse.json({ message: 'Project location not found' }, { status: 404 });
    }

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
        locationDataToUpdate.locationId.toLowerCase() !== existingLocation.locationId.toLowerCase()) {
        
        const duplicateLocation = await ProjectLocationModel.findOne({
          locationId: { $regex: new RegExp(`^${locationDataToUpdate.locationId.trim()}$`, 'i') },
          eventId: locationDataToUpdate.eventId || existingLocation.eventId,
          id: { $ne: existingLocation.id }
        });
        
        if (duplicateLocation) {
          return NextResponse.json({ message: `Location ID '${locationDataToUpdate.locationId}' already exists for this event.` }, { status: 409 });
        }
    }

    const updatedLocation = await ProjectLocationModel.findOneAndUpdate(
      {
        $or: [
          { id: id },
          { locationId: id }
        ]
      },
      {
        ...locationDataToUpdate,
        updatedBy: "user_admin_placeholder_loc_update",
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedLocation) {
      return NextResponse.json({ message: 'Project location not found' }, { status: 404 });
    }

    // Format location to ensure proper id field
    const locationWithId = {
      ...updatedLocation,
      id: updatedLocation.id || (updatedLocation as any)._id.toString()
    };

    return NextResponse.json({ status: 'success', data: { location: locationWithId }});
  } catch (error) {
    console.error(`Error updating project location ${(await params).id}:`, error);
    return NextResponse.json({ message: `Error updating project location ${(await params).id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;

    // Attempt to delete by id or locationId
    const deletedLocation = await ProjectLocationModel.findOneAndDelete({
      $or: [
        { id: id },
        { locationId: id }
      ]
    });

    if (!deletedLocation) {
      return NextResponse.json({ message: 'Project location not found' }, { status: 404 });
    }
    
    return NextResponse.json({ status: 'success', message: 'Project location deleted successfully' });
  } catch (error) {
    console.error(`Error deleting project location ${(await params).id}:`, error);
    return NextResponse.json({ message: `Error deleting project location ${(await params).id}`, error: (error as Error).message }, { status: 500 });
  }
}