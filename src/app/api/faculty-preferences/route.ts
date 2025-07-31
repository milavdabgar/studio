import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyPreferenceModel } from '@/lib/models';
import type { FacultyPreference } from '@/types/entities';

const generateId = (): string => `fp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (facultyId) filter.facultyId = facultyId;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester, 10);

    const preferences = await FacultyPreferenceModel.find(filter).lean();
    
    // Format preferences to ensure proper id field
    const preferencesWithId = preferences.map(pref => ({
      ...pref,
      id: pref.id || (pref as unknown as { _id: { toString(): string } })._id.toString()
    }));

    return NextResponse.json({
      success: true,
      data: preferencesWithId
    });
  } catch (error) {
    console.error('Error in GET /api/faculty-preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error fetching faculty preferences.' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const preferenceData = await request.json() as Omit<FacultyPreference, 'id' | 'createdAt' | 'updatedAt'>;

    // Validation
    if (!preferenceData.facultyId || !preferenceData.academicYear || !preferenceData.semester) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: facultyId, academicYear, semester.' }, 
        { status: 400 }
      );
    }

    // Check for duplicate preference (one per faculty per academic term)
    const existingPreference = await FacultyPreferenceModel.findOne({
      facultyId: preferenceData.facultyId,
      academicYear: preferenceData.academicYear,
      semester: preferenceData.semester
    });
    
    if (existingPreference) {
      return NextResponse.json(
        { success: false, error: 'Faculty preference already exists for this academic term and semester.' }, 
        { status: 409 }
      );
    }

    const currentTimestamp = new Date().toISOString();
    const newPreferenceData = {
      id: generateId(),
      ...preferenceData,
      preferredCourses: preferenceData.preferredCourses || [],
      timePreferences: preferenceData.timePreferences || [],
      roomPreferences: preferenceData.roomPreferences || [],
      unavailableSlots: preferenceData.unavailableSlots || [],
      workingDays: preferenceData.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      maxHoursPerWeek: preferenceData.maxHoursPerWeek || 18,
      maxConsecutiveHours: preferenceData.maxConsecutiveHours || 4,
      priority: preferenceData.priority || 5, // Default to medium priority
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newPreference = new FacultyPreferenceModel(newPreferenceData);
    await newPreference.save();
    
    return NextResponse.json({
      success: true,
      data: newPreference.toJSON()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating faculty preference:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation failed. Please check your input data.', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Error creating faculty preference' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoose();
    
    const body: Partial<FacultyPreference> & { id: string } = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Preference ID is required' },
        { status: 400 }
      );
    }

    const updatedPreference = await FacultyPreferenceModel.findOneAndUpdate(
      { id: body.id },
      { 
        ...body,
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