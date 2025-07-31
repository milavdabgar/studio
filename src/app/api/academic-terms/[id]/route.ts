import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { AcademicTermModel, ProgramModel, CourseOfferingModel } from '@/lib/models';

// GET /api/academic-terms/[id] - Get specific academic term
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    const { id } = await params;

    let academicTerm = await AcademicTermModel.findOne({ id });
    if (!academicTerm) {
      academicTerm = await AcademicTermModel.findById(id);
    }
    
    if (!academicTerm) {
      return NextResponse.json(
        { error: 'Academic term not found' },
        { status: 404 }
      );
    }

    // Populate program details for date entries
    const dateEntriesWithDetails = await Promise.all(
      (academicTerm.dateEntries || []).map(async (entry: any) => {
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
          ...entry,
          programsWithDetails: programsWithDetails.filter(p => p !== null)
        };
      })
    );

    // Get course offerings count for this term
    const courseOfferingsCount = await CourseOfferingModel.countDocuments({
      $or: [
        { academicTermId: academicTerm.id },
        { academicTermId: academicTerm._id }
      ]
    });

    const termWithDetails = {
      ...academicTerm.toJSON(),
      dateEntries: dateEntriesWithDetails,
      courseOfferingsCount
    };

    return NextResponse.json({ 
      success: true, 
      data: termWithDetails 
    });

  } catch (error) {
    console.error('Error fetching academic term:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic term' },
      { status: 500 }
    );
  }
}

// PUT /api/academic-terms/[id] - Update academic term
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    const { id } = await params;

    let academicTerm = await AcademicTermModel.findOne({ id });
    if (!academicTerm) {
      academicTerm = await AcademicTermModel.findById(id);
    }
    
    if (!academicTerm) {
      return NextResponse.json(
        { error: 'Academic term not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      dateEntries,
      status,
      gtuCalendarUrl,
      notes 
    } = body;

    // Validate date entries if provided
    if (dateEntries) {
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
      }
    }

    // Update allowed fields
    if (dateEntries !== undefined) academicTerm.dateEntries = dateEntries;
    if (status) academicTerm.status = status;
    if (gtuCalendarUrl !== undefined) academicTerm.gtuCalendarUrl = gtuCalendarUrl;
    if (notes !== undefined) academicTerm.notes = notes;

    await academicTerm.save();

    return NextResponse.json({ 
      success: true, 
      data: academicTerm.toJSON() 
    });

  } catch (error) {
    console.error('Error updating academic term:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update academic term' },
      { status: 500 }
    );
  }
}

// DELETE /api/academic-terms/[id] - Delete academic term
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    const { id } = await params;

    let academicTerm = await AcademicTermModel.findOne({ id });
    if (!academicTerm) {
      academicTerm = await AcademicTermModel.findById(id);
    }
    
    if (!academicTerm) {
      return NextResponse.json(
        { error: 'Academic term not found' },
        { status: 404 }
      );
    }

    // Check if there are any course offerings using this term
    const courseOfferingsCount = await CourseOfferingModel.countDocuments({
      $or: [
        { academicTermId: academicTerm.id },
        { academicTermId: academicTerm._id }
      ]
    });

    if (courseOfferingsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete academic term. ${courseOfferingsCount} course offerings are using this term.` },
        { status: 409 }
      );
    }

    await AcademicTermModel.deleteOne({ id });

    return NextResponse.json({ 
      success: true, 
      message: 'Academic term deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting academic term:', error);
    return NextResponse.json(
      { error: 'Failed to delete academic term' },
      { status: 500 }
    );
  }
}