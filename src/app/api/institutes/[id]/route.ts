
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { InstituteModel } from '@/lib/models';
import type { Institute } from '@/types/entities';
import { Types } from 'mongoose';

declare global {
  var __API_INSTITUTES_STORE__: Institute[] | undefined;
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log('Looking for institute with id:', id);
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let institute;
    if (Types.ObjectId.isValid(id)) {
      console.log('Searching by ObjectId');
      institute = await InstituteModel.findById(id);
    } else {
      console.log('Searching by custom id field');
      institute = await InstituteModel.findOne({ id });
    }

    console.log('Found institute in MongoDB:', institute ? 'YES' : 'NO');
    
    // If not found in MongoDB, check global store as fallback
    if (!institute && global.__API_INSTITUTES_STORE__) {
      console.log('Checking global store for institute');
      const storeInstitute = global.__API_INSTITUTES_STORE__.find(inst => inst.id === id);
      if (storeInstitute) {
        console.log('Found institute in global store');
        return NextResponse.json(storeInstitute);
      }
    }
    
    if (!institute) {
      return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
    }

    // Convert to plain object and ensure custom id is used
    const instituteObject = institute.toObject();
    const response = {
      ...instituteObject,
      id: instituteObject.id || instituteObject._id
    };
    delete response._id;
    delete response.__v;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching institute:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let institute;
    if (Types.ObjectId.isValid(id)) {
      institute = await InstituteModel.findById(id);
    } else {
      institute = await InstituteModel.findOne({ id });
    }

    if (!institute) {
      return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
    }

    const instituteData = await request.json() as Partial<Omit<Institute, 'id'>>;

    // Validation
    if (instituteData.name !== undefined && !instituteData.name.trim()) {
      return NextResponse.json({ message: 'Institute Name cannot be empty.' }, { status: 400 });
    }
    if (instituteData.code !== undefined && !instituteData.code.trim()) {
      return NextResponse.json({ message: 'Institute Code cannot be empty.' }, { status: 400 });
    }
    if (instituteData.establishmentYear && (isNaN(instituteData.establishmentYear) || instituteData.establishmentYear < 1800 || instituteData.establishmentYear > new Date().getFullYear())) {
      return NextResponse.json({ message: 'Please enter a valid establishment year.' }, { status: 400 });
    }
    if (instituteData.contactEmail && !/\S+@\S+\.\S+/.test(instituteData.contactEmail)) {
      return NextResponse.json({ message: 'Please enter a valid contact email address.' }, { status: 400 });
    }

    // Check for duplicate code if code is being updated
    if (instituteData.code && instituteData.code.trim().toUpperCase() !== institute.code?.toUpperCase()) {
      const existingInstitute = await InstituteModel.findOne({ 
        code: new RegExp(`^${instituteData.code.trim()}$`, 'i'),
        _id: { $ne: institute._id }
      });
      if (existingInstitute) {
        return NextResponse.json({ message: `Institute with code '${instituteData.code.trim()}' already exists.` }, { status: 409 });
      }
    }

    // Prepare update data with proper trimming
    const updateData: Partial<Institute> = { ...instituteData };
    if (instituteData.code) updateData.code = instituteData.code.trim().toUpperCase();
    if (instituteData.name) updateData.name = instituteData.name.trim();
    if (instituteData.address !== undefined) updateData.address = instituteData.address.trim() || undefined;
    if (instituteData.contactEmail !== undefined) updateData.contactEmail = instituteData.contactEmail.trim() || undefined;
    if (instituteData.contactPhone !== undefined) updateData.contactPhone = instituteData.contactPhone.trim() || undefined;
    if (instituteData.website !== undefined) updateData.website = instituteData.website.trim() || undefined;

    const updatedInstitute = await InstituteModel.findByIdAndUpdate(
      institute._id,
      { ...updateData, updatedAt: new Date().toISOString() },
      { new: true }
    );

    return NextResponse.json(updatedInstitute);
  } catch (error) {
    console.error('Error updating institute:', error);
    return NextResponse.json({ message: 'Error updating institute', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectMongoose();

    // Try to find by MongoDB ObjectId first, then by custom id field
    let institute;
    if (Types.ObjectId.isValid(id)) {
      institute = await InstituteModel.findById(id);
    } else {
      institute = await InstituteModel.findOne({ id });
    }

    if (!institute) {
      return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
    }

    await InstituteModel.findByIdAndDelete(institute._id);
    return NextResponse.json({ message: 'Institute deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting institute:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}