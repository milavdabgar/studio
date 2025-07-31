import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { AcademicTermModel, ProgramModel, CourseOfferingModel } from '@/lib/models';

// GET /api/academic-terms/[id] - Get specific academic term
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoose();

    let academicTerm = await AcademicTermModel.findOne({ id: params.id });
    if (!academicTerm) {
      academicTerm = await AcademicTermModel.findById(params.id);
    }
    
    if (!academicTerm) {
      return NextResponse.json(
        { error: 'Academic term not found' },
        { status: 404 }
      );
    }

    // Get program details
    let program = await ProgramModel.findOne({ id: academicTerm.programId });
    if (!program) {
      program = await ProgramModel.findById(academicTerm.programId);
    }

    // Get course offerings count for this term
    const courseOfferingsCount = await CourseOfferingModel.countDocuments({
      $or: [
        { academicTermId: academicTerm.id },
        { academicTermId: academicTerm._id }
      ]
    });

    const termWithDetails = {
      ...academicTerm.toJSON(),
      program: {
        id: program?.id,
        name: program?.name,
        code: program?.code
      },
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
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoose();

    let academicTerm = await AcademicTermModel.findOne({ id: params.id });
    if (!academicTerm) {
      academicTerm = await AcademicTermModel.findById(params.id);
    }
    
    if (!academicTerm) {
      return NextResponse.json(
        { error: 'Academic term not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      startDate, 
      endDate, 
      maxEnrollmentPerCourse,
      status,
      gtuCalendarUrl,
      notes 
    } = body;

    // Update allowed fields
    if (startDate) academicTerm.startDate = startDate;
    if (endDate) academicTerm.endDate = endDate;
    if (maxEnrollmentPerCourse !== undefined) academicTerm.maxEnrollmentPerCourse = maxEnrollmentPerCourse;
    if (status) academicTerm.status = status;
    if (gtuCalendarUrl !== undefined) academicTerm.gtuCalendarUrl = gtuCalendarUrl;
    if (notes !== undefined) academicTerm.notes = notes;

    // Update the name if program details changed
    if (status) {
      const program = await ProgramModel.findOne({ id: academicTerm.programId });
      if (program) {
        academicTerm.name = `${academicTerm.term} Term ${academicTerm.academicYear} - ${program.name}`;
      }
    }

    await academicTerm.save();

    return NextResponse.json({ 
      success: true, 
      data: academicTerm.toJSON() 
    });

  } catch (error) {
    console.error('Error updating academic term:', error);
    return NextResponse.json(
      { error: 'Failed to update academic term' },
      { status: 500 }
    );
  }
}

// DELETE /api/academic-terms/[id] - Delete academic term
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoose();

    let academicTerm = await AcademicTermModel.findOne({ id: params.id });
    if (!academicTerm) {
      academicTerm = await AcademicTermModel.findById(params.id);
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

    await AcademicTermModel.deleteOne({ id: params.id });

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