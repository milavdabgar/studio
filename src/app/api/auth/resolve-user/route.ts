import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyModel, StudentModel } from '@/lib/models';
import { identifyUser, UserType } from '@/lib/utils/userIdentification';

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

    await connectMongoose();

    if (identification.type === UserType.STUDENT) {
      // For students, email is simply enrollmentNo@gppalanpur.in
      return NextResponse.json({
        success: true,
        userType: 'student',
        identifier: identification.identifier,
        instituteEmail: `${identification.identifier}@gppalanpur.in`,
      });

    } else if (identification.type === UserType.FACULTY) {
      // For faculty, lookup the actual email from database
      const faculty = await FacultyModel.findOne({ 
        staffCode: identification.identifier 
      }).select('staffCode instituteEmail firstName lastName name').lean() as any;
      
      if (!faculty) {
        return NextResponse.json(
          { error: 'Faculty not found in database' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        userType: 'faculty',
        identifier: faculty.staffCode,
        instituteEmail: faculty.instituteEmail,
        name: faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim(),
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