
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { InstituteModel } from '@/lib/models';
import type { Institute } from '@/types/entities';
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
    let institute;
    if (Types.ObjectId.isValid(id)) {
      institute = await InstituteModel.findById(id);
    } else {
      institute = await InstituteModel.findOne({ id });
    }
    
    if (!institute) {
      return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
    }

    // Return institute with properly formatted id
    const instituteToReturn = institute.toJSON();

    return NextResponse.json(instituteToReturn);
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

    // Validate principalId if provided
    if (instituteData.principalId !== undefined) {
      if (instituteData.principalId && typeof instituteData.principalId !== 'string') {
        return NextResponse.json({ message: 'Principal ID must be a string.' }, { status: 400 });
      }
      // TODO: Add validation to check if the principalId exists and is a faculty member
      // This would require importing UserModel and checking user role
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
    if (instituteData.principalId !== undefined) updateData.principalId = instituteData.principalId || undefined;

    const updatedInstitute = await InstituteModel.findByIdAndUpdate(
      institute._id,
      { ...updateData, updatedAt: new Date().toISOString() },
      { new: true }
    );

    return NextResponse.json(updatedInstitute);
  } catch (error) {
    console.error('Error updating institute:', error);
    return NextResponse.json({ message: 'Error updating institute' }, { status: 500 });
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