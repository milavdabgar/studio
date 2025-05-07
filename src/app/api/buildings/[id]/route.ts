
import { NextResponse, type NextRequest } from 'next/server';
import type { Building } from '@/types/entities';

let buildingsStore: Building[] = (global as any).buildingsStore || [];
if (!(global as any).buildingsStore) {
  (global as any).buildingsStore = buildingsStore;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const building = buildingsStore.find(b => b.id === id);
  if (building) {
    return NextResponse.json(building);
  }
  return NextResponse.json({ message: 'Building not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const buildingData = await request.json() as Partial<Omit<Building, 'id'>>;
    const buildingIndex = buildingsStore.findIndex(b => b.id === id);

    if (buildingIndex === -1) {
      return NextResponse.json({ message: 'Building not found' }, { status: 404 });
    }
    const existingBuilding = buildingsStore[buildingIndex];

    if (buildingData.name !== undefined && !buildingData.name.trim()) {
        return NextResponse.json({ message: 'Building Name cannot be empty.' }, { status: 400 });
    }
    if (buildingData.instituteId !== undefined && !buildingData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    if (buildingData.code && buildingData.code.trim().toUpperCase() !== existingBuilding.code?.toUpperCase() && buildingsStore.some(b => b.id !== id && b.instituteId === (buildingData.instituteId || existingBuilding.instituteId) && b.code?.toLowerCase() === buildingData.code!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Building with code '${buildingData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
     if (buildingData.constructionYear && (isNaN(buildingData.constructionYear) || buildingData.constructionYear < 1800 || buildingData.constructionYear > new Date().getFullYear() + 5)) {
      return NextResponse.json({ message: 'Please enter a valid construction year.' }, { status: 400 });
    }
    const numericFields: (keyof Pick<Building, 'numberOfFloors' | 'totalAreaSqFt'>)[] = ['numberOfFloors', 'totalAreaSqFt'];
    for (const field of numericFields) {
        if (buildingData[field] !== undefined && (isNaN(Number(buildingData[field])) || Number(buildingData[field]) < 0)) {
            return NextResponse.json({ message: `${field} must be a non-negative number.` }, { status: 400 });
        }
    }

    const updatedBuilding = { ...existingBuilding, ...buildingData };
    if(buildingData.code) updatedBuilding.code = buildingData.code.trim().toUpperCase();
    if(buildingData.name) updatedBuilding.name = buildingData.name.trim();
    if(buildingData.description !== undefined) updatedBuilding.description = buildingData.description.trim() || undefined;


    buildingsStore[buildingIndex] = updatedBuilding;
    return NextResponse.json(updatedBuilding);
  } catch (error) {
    console.error(`Error updating building ${id}:`, error);
    return NextResponse.json({ message: `Error updating building ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const initialLength = buildingsStore.length;
  buildingsStore = buildingsStore.filter(b => b.id !== id);

  if (buildingsStore.length === initialLength) {
    return NextResponse.json({ message: 'Building not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Building deleted successfully' }, { status: 200 });
}
