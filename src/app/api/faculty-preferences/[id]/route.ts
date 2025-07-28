import { NextRequest, NextResponse } from 'next/server';
import type { FacultyPreference } from '@/types/entities';

// Simulated database - replace with actual database calls
let facultyPreferences: FacultyPreference[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const preference = facultyPreferences.find(fp => fp.id === params.id);
    
    if (!preference) {
      return NextResponse.json(
        { error: 'Faculty preference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(preference);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch faculty preference' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: Partial<FacultyPreference> = await request.json();
    
    const index = facultyPreferences.findIndex(fp => fp.id === params.id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Faculty preference not found' },
        { status: 404 }
      );
    }

    facultyPreferences[index] = {
      ...facultyPreferences[index],
      ...body,
      id: params.id, // Ensure ID doesn't change
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const index = facultyPreferences.findIndex(fp => fp.id === params.id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Faculty preference not found' },
        { status: 404 }
      );
    }

    facultyPreferences.splice(index, 1);
    return NextResponse.json({ message: 'Faculty preference deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete faculty preference' },
      { status: 500 }
    );
  }
}