
import { NextResponse, type NextRequest } from 'next/server';
import type { Building } from '@/types/entities';

// In-memory store for buildings
let buildingsStore: Building[] = (global as any).buildingsStore || [];
if (!(global as any).buildingsStore) {
  (global as any).buildingsStore = buildingsStore;
}

const generateId = (): string => `bldg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  return NextResponse.json(buildingsStore);
}

export async function POST(request: NextRequest) {
  try {
    const buildingData = await request.json() as Omit<Building, 'id'>;

    if (!buildingData.name || !buildingData.name.trim()) {
      return NextResponse.json({ message: 'Building Name cannot be empty.' }, { status: 400 });
    }
    if (!buildingData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
     if (buildingData.code && buildingsStore.some(b => b.instituteId === buildingData.instituteId && b.code?.toLowerCase() === buildingData.code!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Building with code '${buildingData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
    if (buildingData.constructionYear && (isNaN(buildingData.constructionYear) || buildingData.constructionYear < 1800 || buildingData.constructionYear > new Date().getFullYear() + 5)) { // Allow for future construction
      return NextResponse.json({ message: 'Please enter a valid construction year.' }, { status: 400 });
    }
    const numericFields: (keyof Pick<Building, 'numberOfFloors' | 'totalAreaSqFt'>)[] = ['numberOfFloors', 'totalAreaSqFt'];
    for (const field of numericFields) {
        if (buildingData[field] !== undefined && (isNaN(Number(buildingData[field])) || Number(buildingData[field]) < 0)) {
            return NextResponse.json({ message: `${field} must be a non-negative number.` }, { status: 400 });
        }
    }

    const newBuilding: Building = {
      id: generateId(),
      name: buildingData.name.trim(),
      code: buildingData.code?.trim().toUpperCase() || undefined,
      description: buildingData.description?.trim() || undefined,
      instituteId: buildingData.instituteId,
      status: buildingData.status || 'active',
      constructionYear: buildingData.constructionYear ? Number(buildingData.constructionYear) : undefined,
      numberOfFloors: buildingData.numberOfFloors ? Number(buildingData.numberOfFloors) : undefined,
      totalAreaSqFt: buildingData.totalAreaSqFt ? Number(buildingData.totalAreaSqFt) : undefined,
    };
    buildingsStore.push(newBuilding);
    return NextResponse.json(newBuilding, { status: 201 });
  } catch (error) {
    console.error('Error creating building:', error);
    return NextResponse.json({ message: 'Error creating building', error: (error as Error).message }, { status: 500 });
  }
}
