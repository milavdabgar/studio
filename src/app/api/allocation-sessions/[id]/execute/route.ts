import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { 
  AllocationSessionModel, 
  CourseAllocationModel, 
  AllocationConflictModel,
  FacultyModel,
  CourseOfferingModel,
  FacultyPreferenceModel,
  CourseModel,
  ProgramModel
} from '@/lib/models';
import { createAllocationEngine } from '@/lib/algorithms/allocationEngine';
import type { 
  AllocationSession, 
  Faculty, 
  CourseOffering, 
  FacultyPreference,
  Course
} from '@/types/entities';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const session = await AllocationSessionModel.findOne({ id: params.id });
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Update session status to in_progress
    session.status = 'in_progress';
    session.startedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    await session.save();

    try {
      // Fetch required data for allocation
      const [faculties, courseOfferings, facultyPreferences, courses, programs] = await Promise.all([
        FacultyModel.find({}).lean(),
        CourseOfferingModel.find({
          academicYear: session.academicYear,
          semester: { $in: session.semesters }
        }).lean(),
        FacultyPreferenceModel.find({
          academicYear: session.academicYear,
          semester: { $in: session.semesters }
        }).lean(),
        CourseModel.find({}).lean(),
        ProgramModel.find({ id: { $in: session.targetPrograms } }).lean()
      ]);

      if (courseOfferings.length === 0) {
        session.status = 'draft';
        session.startedAt = undefined;
        await session.save();
        
        return NextResponse.json(
          { success: false, error: 'No course offerings found for the specified academic year and semesters' },
          { status: 400 }
        );
      }

      if (faculties.length === 0) {
        session.status = 'draft';
        session.startedAt = undefined;
        await session.save();
        
        return NextResponse.json(
          { success: false, error: 'No faculty found for allocation' },
          { status: 400 }
        );
      }

      // Enrich course offerings with course details
      const enrichedCourseOfferings = courseOfferings.map(offering => {
        const course = courses.find(c => c.id === offering.courseId);
        const program = programs.find(p => p.id === offering.programId);
        
        return {
          ...offering,
          id: (offering as any).id || (offering as unknown as { _id: { toString(): string } })._id.toString(),
          // Add course details
          subjectName: course?.subjectName,
          subcode: course?.subcode,
          category: course?.category,
          lectureHours: course?.lectureHours,
          tutorialHours: course?.tutorialHours,
          practicalHours: course?.practicalHours,
          department: program?.department,
          // Ensure semester is available
          semester: offering.semester || course?.semester
        };
      });

      // Format faculty and preferences data
      const formattedFaculties = faculties.map(f => ({
        ...f,
        id: (f as any).id || (f as unknown as { _id: { toString(): string } })._id.toString()
      }));

      const formattedPreferences = facultyPreferences.map(p => ({
        ...p,
        id: (p as any).id || (p as unknown as { _id: { toString(): string } })._id.toString()
      }));

      // Clear existing allocations for this session
      await CourseAllocationModel.deleteMany({ sessionId: params.id });
      await AllocationConflictModel.deleteMany({ sessionId: params.id });

      // Create allocation engine with session settings
      const engine = createAllocationEngine(session.algorithmSettings);

      // Execute allocation
      const result = await engine.allocateCourses(
        session.toJSON(),
        formattedFaculties as any,
        enrichedCourseOfferings as any,
        formattedPreferences as any
      );

      // Save allocations to database
      if (result.allocations.length > 0) {
        await CourseAllocationModel.insertMany(result.allocations);
      }

      // Save conflicts to database
      if (result.conflicts.length > 0) {
        await AllocationConflictModel.insertMany(result.conflicts);
      }

      // Update session with results
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.statistics = result.statistics;
      session.updatedAt = new Date().toISOString();
      await session.save();

      return NextResponse.json({
        success: true,
        data: {
          sessionId: params.id,
          allocationsCreated: result.allocations.length,
          conflictsDetected: result.conflicts.length,
          statistics: result.statistics,
          completedAt: session.completedAt
        }
      });

    } catch (allocationError) {
      // Revert session status on error
      session.status = 'draft';
      session.startedAt = undefined;
      session.updatedAt = new Date().toISOString();
      await session.save();
      
      console.error('Allocation execution error:', allocationError);
      throw allocationError;
    }

  } catch (error) {
    console.error('Error executing allocation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute allocation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}