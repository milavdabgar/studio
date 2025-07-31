import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { AcademicTermModel, ProgramModel } from '@/lib/models';

// GET /api/academic-terms - Get all academic terms with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectMongoose();

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const academicYear = searchParams.get('academicYear');
    const term = searchParams.get('term');
    const status = searchParams.get('status');

    // Build filter object
    const filter: any = {};
    if (programId) filter.programId = programId;
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (status) filter.status = status;

    const academicTerms = await AcademicTermModel.find(filter).sort({ 
      academicYear: -1, 
      term: 1 // Odd before Even 
    });

    // Populate program details
    const termsWithPrograms = await Promise.all(
      academicTerms.map(async (term) => {
        let program = await ProgramModel.findOne({ id: term.programId });
        if (!program) {
          program = await ProgramModel.findById(term.programId);
        }
        return {
          ...term.toJSON(),
          program: {
            id: program?.id,
            name: program?.name,
            code: program?.code
          }
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: termsWithPrograms 
    });

  } catch (error) {
    console.error('Error fetching academic terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic terms' },
      { status: 500 }
    );
  }
}

// POST /api/academic-terms - Create new academic term
export async function POST(request: NextRequest) {
  try {
    await connectMongoose();

    const body = await request.json();
    const { 
      academicYear, 
      programId, 
      term, 
      startDate, 
      endDate, 
      maxEnrollmentPerCourse = 60,
      gtuCalendarUrl,
      notes 
    } = body;

    // Validate required fields
    if (!academicYear || !programId || !term || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify program exists
    let program = await ProgramModel.findOne({ id: programId });
    if (!program) {
      program = await ProgramModel.findById(programId);
    }
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check for duplicate term
    const existingTerm = await AcademicTermModel.findOne({
      academicYear,
      programId,
      term
    });

    if (existingTerm) {
      return NextResponse.json(
        { error: `${term} term for ${academicYear} already exists for this program` },
        { status: 409 }
      );
    }

    // Generate term name and determine semesters
    const name = `${term} Term ${academicYear} - ${program.name}`;
    const semesters = term === 'Odd' ? [1, 3, 5] : [2, 4, 6];

    // Create new academic term
    const newTerm = new AcademicTermModel({
      name,
      academicYear,
      programId,
      term,
      semesters,
      startDate,
      endDate,
      maxEnrollmentPerCourse,
      status: 'draft',
      gtuCalendarUrl,
      notes
    });

    await newTerm.save();

    return NextResponse.json({ 
      success: true, 
      data: newTerm.toJSON() 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating academic term:', error);
    return NextResponse.json(
      { error: 'Failed to create academic term' },
      { status: 500 }
    );
  }
}