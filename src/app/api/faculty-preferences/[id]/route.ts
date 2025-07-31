import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyPreferenceModel } from '@/lib/models';
import type { FacultyPreference } from '@/types/entities';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const preference = await FacultyPreferenceModel.findOne({ id: params.id }).lean();
    
    if (!preference) {
      return NextResponse.json(
        { success: false, error: 'Faculty preference not found' },
        { status: 404 }
      );
    }

    // Format preference to ensure proper id field
    const preferenceWithId = {
      ...preference,
      id: (preference as any).id || (preference as unknown as { _id: { toString(): string } })._id.toString()
    };

    return NextResponse.json({
      success: true,
      data: preferenceWithId
    });
  } catch (error) {
    console.error('Error fetching faculty preference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty preference' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const body: Partial<FacultyPreference> = await request.json();
    
    const updatedPreference = await FacultyPreferenceModel.findOneAndUpdate(
      { id: params.id },
      { 
        ...body,
        id: params.id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      },
      { new: true, lean: true }
    );

    if (!updatedPreference) {
      return NextResponse.json(
        { success: false, error: 'Faculty preference not found' },
        { status: 404 }
      );
    }

    // Format preference to ensure proper id field
    const preferenceWithId = {
      ...updatedPreference,
      id: (updatedPreference as unknown as { id?: string; _id: { toString(): string } }).id || (updatedPreference as unknown as { id?: string; _id: { toString(): string } })._id.toString()
    };

    return NextResponse.json({
      success: true,
      data: preferenceWithId
    });
  } catch (error) {
    console.error('Error updating faculty preference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update faculty preference' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const deletedPreference = await FacultyPreferenceModel.findOneAndDelete({ id: params.id });

    if (!deletedPreference) {
      return NextResponse.json(
        { success: false, error: 'Faculty preference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Faculty preference deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting faculty preference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete faculty preference' },
      { status: 500 }
    );
  }
}