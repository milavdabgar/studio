
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { BuildingModel } from '@/lib/models';
import type { Building } from '@/types/entities';
import { Types } from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let building;
    if (Types.ObjectId.isValid(id)) {
      building = await BuildingModel.findById(id);
    } else {
      building = await BuildingModel.findOne({ id });
    }

    if (!building) {
      return NextResponse.json({ message: 'Building not found' }, { status: 404 });
    }

    // Convert to plain object and ensure custom id is used
    const buildingObject = building.toObject();
    const response = {
      ...buildingObject,
      id: buildingObject.id || buildingObject._id
    };
    delete response._id;
    delete response.__v;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching building:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let building;
    if (Types.ObjectId.isValid(id)) {
      building = await BuildingModel.findById(id);
    } else {
      building = await BuildingModel.findOne({ id });
    }

    if (!building) {
      return NextResponse.json({ message: 'Building not found' }, { status: 404 });
    }

    const buildingData = await request.json() as Partial<Omit<Building, 'id'>>;

    // Validation
    if (buildingData.name !== undefined && !buildingData.name.trim()) {
      return NextResponse.json({ message: 'Building Name cannot be empty.' }, { status: 400 });
    }
    if (buildingData.instituteId !== undefined && !buildingData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    if (buildingData.constructionYear && (isNaN(buildingData.constructionYear) || buildingData.constructionYear < 1800 || buildingData.constructionYear > new Date().getFullYear() + 5)) {
      return NextResponse.json({ message: 'Please enter a valid construction year.' }, { status: 400 });
    }
    if (buildingData.numberOfFloors !== undefined && (isNaN(Number(buildingData.numberOfFloors)) || Number(buildingData.numberOfFloors) < 0)) {
      return NextResponse.json({ message: 'numberOfFloors must be a non-negative number.' }, { status: 400 });
    }
    if (buildingData.totalAreaSqFt !== undefined && (isNaN(Number(buildingData.totalAreaSqFt)) || Number(buildingData.totalAreaSqFt) < 0)) {
      return NextResponse.json({ message: 'totalAreaSqFt must be a non-negative number.' }, { status: 400 });
    }

    // Check for duplicate code within the same institute if code is being updated
    if (buildingData.code && buildingData.code.trim().toUpperCase() !== building.code?.toUpperCase()) {
      const instituteId = buildingData.instituteId || building.instituteId;
      const existingBuilding = await BuildingModel.findOne({ 
        code: new RegExp(`^${buildingData.code.trim()}$`, 'i'),
        instituteId,
        _id: { $ne: building._id }
      });
      if (existingBuilding) {
        return NextResponse.json({ message: `Building with code '${buildingData.code.trim()}' already exists for this institute.` }, { status: 409 });
      }
    }

    // Prepare update data with proper trimming
    const updateData: Partial<Building> = { ...buildingData };
    if (buildingData.code) updateData.code = buildingData.code.trim().toUpperCase();
    if (buildingData.name) updateData.name = buildingData.name.trim();
    if (buildingData.description !== undefined) updateData.description = buildingData.description.trim() || undefined;

    const updatedBuilding = await BuildingModel.findByIdAndUpdate(
      building._id,
      { ...updateData, updatedAt: new Date().toISOString() },
      { new: true }
    );

    return NextResponse.json(updatedBuilding);
  } catch (error) {
    console.error('Error updating building:', error);
    return NextResponse.json({ message: 'Error updating building', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let building;
    if (Types.ObjectId.isValid(id)) {
      building = await BuildingModel.findById(id);
    } else {
      building = await BuildingModel.findOne({ id });
    }

    if (!building) {
      return NextResponse.json({ message: 'Building not found' }, { status: 404 });
    }

    await BuildingModel.findByIdAndDelete(building._id);
    return NextResponse.json({ message: 'Building deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting building:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
