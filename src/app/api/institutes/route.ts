
import { NextResponse, type NextRequest } from 'next/server';
import type { Institute } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { InstituteModel } from '@/lib/models';

const generateInstituteId = (): string => `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


export async function GET() {
  try {
    await connectMongoose();
    
    const institutes = await InstituteModel.find({}).lean();
    
    // Format institutes to ensure proper id field
    const institutesWithId = institutes.map(institute => ({
      ...institute,
      id: institute.id || (institute as { _id: { toString(): string } })._id.toString()
    }));
    
    return NextResponse.json(institutesWithId);
  } catch (error) {
    console.error("Error in GET /api/institutes:", error);
    return NextResponse.json({ message: 'Internal server error processing institutes request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const instituteData = await request.json() as Omit<Institute, 'id' | 'createdAt' | 'updatedAt'>;

    if (!instituteData.name || !instituteData.name.trim() || !instituteData.code || !instituteData.code.trim()) {
      return NextResponse.json({ message: 'Institute Name and Code are required.' }, { status: 400 });
    }
    if (instituteData.establishmentYear && (isNaN(instituteData.establishmentYear) || instituteData.establishmentYear < 1800 || instituteData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    if (instituteData.contactEmail && !/\S+@\S+\.\S+/.test(instituteData.contactEmail)) {
        return NextResponse.json({ message: 'Please enter a valid contact email address.' }, { status: 400 });
    }
    
    // Check for existing institute with same code
    const existingInstitute = await InstituteModel.findOne({
      code: { $regex: new RegExp(`^${instituteData.code.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    if (existingInstitute) {
        return NextResponse.json({ message: `Institute with code '${instituteData.code.trim()}' already exists.` }, { status: 409 });
    }
    
    const currentTimestamp = new Date().toISOString();
    
    const newInstituteData = {
      id: generateInstituteId(),
      name: instituteData.name.trim(),
      code: instituteData.code.trim().toUpperCase(),
      address: instituteData.address?.trim() || undefined,
      contactEmail: instituteData.contactEmail?.trim() || undefined,
      contactPhone: instituteData.contactPhone?.trim() || undefined,
      website: instituteData.website?.trim() || undefined,
      domain: instituteData.domain?.trim().toLowerCase() || `${instituteData.code.trim().toLowerCase()}.ac.in`,
      status: instituteData.status || 'active',
      establishmentYear: instituteData.establishmentYear ? Number(instituteData.establishmentYear) : undefined,
      administrators: instituteData.administrators || [],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newInstitute = new InstituteModel(newInstituteData);
    await newInstitute.save();
    
    // Return institute with properly formatted id
    const instituteToReturn = newInstitute.toJSON();
    
    return NextResponse.json(instituteToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating institute:', error);
    return NextResponse.json({ message: 'Error creating institute' }, { status: 500 });
  }
}
