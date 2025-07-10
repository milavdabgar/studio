
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { BuildingModel } from '@/lib/models';
import type { Building } from '@/types/entities';

export async function GET() {
  try {
    await connectMongoose();
    const buildings = await BuildingModel.find({});
    
    // Convert to plain objects and ensure custom id is used
    const response = buildings.map(building => {
      const buildingObject = building.toObject();
      return {
        ...buildingObject,
        id: buildingObject.id || buildingObject._id
      };
    }).map(building => {
      delete building._id;
      delete building.__v;
      return building;
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    const buildingData = await request.json() as Omit<Building, 'id' | 'createdAt' | 'updatedAt'>;

    // Validation
    if (!buildingData.name || !buildingData.name.trim()) {
      return NextResponse.json({ message: 'Building Name cannot be empty.' }, { status: 400 });
    }
    if (!buildingData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    if (buildingData.code) {
      const existingBuilding = await BuildingModel.findOne({ 
        code: new RegExp(`^${buildingData.code.trim()}$`, 'i'),
        instituteId: buildingData.instituteId
      });
      if (existingBuilding) {
        return NextResponse.json({ message: `Building with code '${buildingData.code.trim()}' already exists for this institute.` }, { status: 409 });
      }
    }
    if (buildingData.constructionYear && (isNaN(buildingData.constructionYear) || buildingData.constructionYear < 1800 || buildingData.constructionYear > new Date().getFullYear() + 5)) { 
      return NextResponse.json({ message: 'Please enter a valid construction year.' }, { status: 400 });
    }
    
    // Numeric field validation
    const numericFields: (keyof Pick<Building, 'numberOfFloors' | 'totalAreaSqFt'>)[] = ['numberOfFloors', 'totalAreaSqFt'];
    for (const field of numericFields) {
        if (buildingData[field] !== undefined && (isNaN(Number(buildingData[field])) || Number(buildingData[field]) < 0)) {
            return NextResponse.json({ message: `${field} must be a non-negative number.` }, { status: 400 });
        }
    }

    // Prepare building data
    const newBuildingData = {
      name: buildingData.name.trim(),
      code: buildingData.code?.trim().toUpperCase() || undefined,
      description: buildingData.description?.trim() || undefined,
      instituteId: buildingData.instituteId,
      status: buildingData.status || 'active',
      constructionYear: buildingData.constructionYear ? Number(buildingData.constructionYear) : undefined,
      numberOfFloors: buildingData.numberOfFloors ? Number(buildingData.numberOfFloors) : undefined,
      totalAreaSqFt: buildingData.totalAreaSqFt ? Number(buildingData.totalAreaSqFt) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newBuilding = await BuildingModel.create(newBuildingData);
    
    // Convert to plain object and ensure custom id is used
    const buildingObject = newBuilding.toObject();
    const response = {
      ...buildingObject,
      id: buildingObject.id || buildingObject._id
    };
    delete response._id;
    delete response.__v;
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating building:', error);
    return NextResponse.json({ message: 'Error creating building' }, { status: 500 });
  }
}
