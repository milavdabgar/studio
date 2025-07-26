import { NextRequest, NextResponse } from 'next/server';
import { identifyUser, UserType } from '@/lib/utils/userIdentification';

// Mock data for testing - in production this would query the database
const mockFacultyMappings: { [staffCode: string]: string } = {
  '45174': 'jignaben.modi@gppalanpur.in',
  '71396': 'narendrarajgor@yahoo.com', 
  '5595': 'maheshftank@gmail.com',
  '12725': 'chiragpandya23@gmail.com',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      );
    }

    // Identify user type
    const identification = identifyUser(identifier.trim());
    if (!identification.isValid) {
      return NextResponse.json(
        { error: 'Invalid identifier format' },
        { status: 400 }
      );
    }

    if (identification.type === UserType.STUDENT) {
      // For students, email is simply enrollmentNo@gppalanpur.in
      return NextResponse.json({
        success: true,
        userType: 'student',
        identifier: identification.identifier,
        instituteEmail: `${identification.identifier}@gppalanpur.in`,
      });

    } else if (identification.type === UserType.FACULTY) {
      // For faculty, lookup the actual email mapping
      const actualEmail = mockFacultyMappings[identification.identifier];
      
      if (!actualEmail) {
        return NextResponse.json(
          { error: 'Faculty not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        userType: 'faculty',
        identifier: identification.identifier,
        instituteEmail: actualEmail,
      });
    }

    return NextResponse.json(
      { error: 'Unknown user type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('User resolution error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}