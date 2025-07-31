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
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (status) filter.status = status;
    if (programId) {
      filter['programAssignments.programId'] = programId;
    }

    const academicTerms = await AcademicTermModel.find(filter).sort({ 
      academicYear: -1, 
      term: 1 // Odd before Even 
    });

    // Populate program details for date entries
    const termsWithPrograms = await Promise.all(
      academicTerms.map(async (term) => {
        const dateEntriesWithDetails = await Promise.all(
          (term.dateEntries || []).map(async (entry: any) => {
            const programsWithDetails = await Promise.all(
              entry.programs.map(async (programId: string) => {
                let program = await ProgramModel.findOne({ id: programId });
                if (!program) {
                  program = await ProgramModel.findById(programId);
                }
                return program ? {
                  id: program.id,
                  name: program.name,
                  code: program.code
                } : null;
              })
            );

            return {
              ...entry.toObject(), // Convert Mongoose document to plain object
              programsWithDetails: programsWithDetails.filter(p => p !== null)
            };
          })
        );

        return {
          ...term.toJSON(),
          dateEntries: dateEntriesWithDetails
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
      term, 
      dateEntries, // Array of program-semester-date entries (table-like structure)
      gtuCalendarUrl,
      notes 
    } = body;

    // Validate required fields
    if (!academicYear || !term) {
      return NextResponse.json(
        { error: 'Missing required fields: academicYear, term' },
        { status: 400 }
      );
    }

    if (!dateEntries || dateEntries.length === 0) {
      return NextResponse.json(
        { error: 'dateEntries array is required' },
        { status: 400 }
      );
    }

    // Check for duplicate term (same academic year and term type)
    const existingTerm = await AcademicTermModel.findOne({
      academicYear,
      term
    });

    if (existingTerm) {
      return NextResponse.json(
        { error: `${term} term for ${academicYear} already exists` },
        { status: 409 }
      );
    }

    // Validate date entries
    for (let i = 0; i < dateEntries.length; i++) {
      const entry = dateEntries[i];
      
      if (!entry.programs || entry.programs.length === 0) {
        return NextResponse.json(
          { error: `Date entry ${i + 1}: At least one program must be selected` },
          { status: 400 }
        );
      }
      
      if (!entry.semesters || entry.semesters.length === 0) {
        return NextResponse.json(
          { error: `Date entry ${i + 1}: At least one semester must be selected` },
          { status: 400 }
        );
      }
      
      if (!entry.startDate || !entry.endDate) {
        return NextResponse.json(
          { error: `Date entry ${i + 1}: Start date and end date are required` },
          { status: 400 }
        );
      }

      // Validate date formats and order
      const startDateObj = new Date(entry.startDate);
      const endDateObj = new Date(entry.endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          { error: `Date entry ${i + 1}: Invalid date format` },
          { status: 400 }
        );
      }
      
      if (startDateObj >= endDateObj) {
        return NextResponse.json(
          { error: `Date entry ${i + 1}: Start date must be before end date` },
          { status: 400 }
        );
      }

      // Verify programs exist
      for (const programId of entry.programs) {
        let program = await ProgramModel.findOne({ id: programId });
        if (!program) {
          program = await ProgramModel.findById(programId);
        }
        if (!program) {
          return NextResponse.json(
            { error: `Date entry ${i + 1}: Program not found: ${programId}` },
            { status: 404 }
          );
        }
      }
    }

    // Create new academic term
    const termData = {
      name: `${term} Term ${academicYear}`, // Generate name explicitly
      academicYear,
      term,
      dateEntries,
      status: 'draft',
      gtuCalendarUrl,
      notes
    };

    const newTerm = new AcademicTermModel(termData);
    await newTerm.save();

    return NextResponse.json({ 
      success: true, 
      data: newTerm.toJSON() 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating academic term:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create academic term' },
      { status: 500 }
    );
  }
}