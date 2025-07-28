import { NextRequest, NextResponse } from 'next/server';
import type { FacultyPreference } from '@/types/entities';

// Simulated database - replace with actual database calls
let facultyPreferences: FacultyPreference[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const facultyId = searchParams.get('facultyId');
  const academicYear = searchParams.get('academicYear');
  const semester = searchParams.get('semester');

  try {
    let filteredPreferences = facultyPreferences;

    if (facultyId) {
      filteredPreferences = filteredPreferences.filter(fp => fp.facultyId === facultyId);
    }

    if (academicYear) {
      filteredPreferences = filteredPreferences.filter(fp => fp.academicYear === academicYear);
    }

    if (semester) {
      filteredPreferences = filteredPreferences.filter(fp => fp.semester === parseInt(semester));
    }

    return NextResponse.json(filteredPreferences);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch faculty preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Omit<FacultyPreference, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    // Validation
    if (!body.facultyId || !body.academicYear || !body.semester) {
      return NextResponse.json(
        { error: 'Faculty ID, academic year, and semester are required' },
        { status: 400 }
      );
    }

    // Check for existing preference for same faculty/term
    const existingPreference = facultyPreferences.find(fp => 
      fp.facultyId === body.facultyId && 
      fp.academicYear === body.academicYear && 
      fp.semester === body.semester
    );

    if (existingPreference) {
      return NextResponse.json(
        { error: 'Faculty preference already exists for this term' },
        { status: 409 }
      );
    }

    const newPreference: FacultyPreference = {
      ...body,
      id: `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    facultyPreferences.push(newPreference);
    return NextResponse.json(newPreference, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create faculty preference' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: Partial<FacultyPreference> & { id: string } = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Preference ID is required' },
        { status: 400 }
      );
    }

    const index = facultyPreferences.findIndex(fp => fp.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Faculty preference not found' },
        { status: 404 }
      );
    }

    facultyPreferences[index] = {
      ...facultyPreferences[index],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(facultyPreferences[index]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update faculty preference' },
      { status: 500 }
    );
  }
}