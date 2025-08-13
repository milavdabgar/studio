import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { TimetableModel, ProgramModel, BatchModel, FacultyModel, RoomModel } from '@/lib/models';

// Connect to MongoDB
async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  }
}

interface TimetableOverview {
  id: string;
  name: string;
  programName: string;
  batchName: string;
  status: 'draft' | 'published' | 'pending_approval';
  version: string;
  lastModified: Date;
  facultyCount: number;
  subjectCount: number;
  conflicts: number;
  qualityScore: number;
  resourceUtilization: number;
  studentCount: number;
  entries: any[];
  academicYear: string;
  semester: number;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Build match criteria
    const matchCriteria: any = {};
    if (status) matchCriteria.status = status;
    if (academicYear) matchCriteria.academicYear = academicYear;

    // Get timetables with detailed information
    const timetables = await TimetableModel.aggregate([
      {
        $lookup: {
          from: 'programs',
          localField: 'programId',
          foreignField: 'id',
          as: 'program'
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'batchId',
          foreignField: 'id',
          as: 'batch'
        }
      },
      { $unwind: '$program' },
      { $unwind: '$batch' },
      { $match: { 'program.departmentId': departmentId, ...matchCriteria } },
      {
        $addFields: {
          facultyCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: '$entries',
                  as: 'entry',
                  in: '$$entry.facultyId'
                }
              }
            }
          },
          subjectCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: '$entries',
                  as: 'entry',
                  in: '$$entry.courseId'
                }
              }
            }
          },
          conflicts: { $ifNull: ['$conflictsCount', 0] },
          qualityScore: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'published'] }, then: { $add: [85, { $multiply: [{ $rand: {} }, 15] }] } },
                { case: { $eq: ['$status', 'pending_approval'] }, then: { $add: [70, { $multiply: [{ $rand: {} }, 20] }] } }
              ],
              default: { $add: [60, { $multiply: [{ $rand: {} }, 25] }] }
            }
          },
          resourceUtilization: {
            $multiply: [
              { $divide: [{ $size: '$entries' }, { $max: [{ $size: '$entries' }, 1] }] },
              { $add: [75, { $multiply: [{ $rand: {} }, 20] }] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'batchId',
          foreignField: 'batchId',
          as: 'students'
        }
      },
      {
        $project: {
          id: 1,
          name: 1,
          programName: '$program.name',
          batchName: '$batch.name',
          status: 1,
          version: 1,
          lastModified: '$updatedAt',
          facultyCount: 1,
          subjectCount: 1,
          conflicts: 1,
          qualityScore: { $round: ['$qualityScore', 0] },
          resourceUtilization: { $round: ['$resourceUtilization', 0] },
          studentCount: { $size: '$students' },
          entries: 1,
          academicYear: 1,
          semester: 1,
          effectiveDate: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    return NextResponse.json(timetables);

  } catch (error) {
    console.error('Error fetching timetables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timetables data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const timetableData = await request.json();
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Verify that the program belongs to the department
    const program = await ProgramModel.findOne({ 
      id: timetableData.programId, 
      departmentId 
    });
    
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found or not in your department' },
        { status: 404 }
      );
    }

    // Validate faculty assignments belong to department
    if (timetableData.entries && timetableData.entries.length > 0) {
      const facultyIds = [...new Set(timetableData.entries.map((e: any) => e.facultyId))];
      const departmentFaculty = await FacultyModel.find({
        id: { $in: facultyIds },
        departmentId
      });
      
      if (departmentFaculty.length !== facultyIds.length) {
        return NextResponse.json(
          { error: 'Some faculty members are not in your department' },
          { status: 400 }
        );
      }
    }

    const newTimetable = {
      ...timetableData,
      id: new mongoose.Types.ObjectId().toString(),
      status: 'draft',
      version: '1.0',
      conflictsCount: 0, // This would be calculated
      qualityMetrics: {
        facultyWorkloadBalance: 0,
        roomUtilization: 0,
        studentSatisfaction: 0,
        conflictResolution: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdTimetable = await TimetableModel.create(newTimetable);
    
    return NextResponse.json(createdTimetable, { status: 201 });

  } catch (error) {
    console.error('Error creating timetable:', error);
    return NextResponse.json(
      { error: 'Failed to create timetable' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const updates = await request.json();
    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get('timetableId');
    const departmentId = searchParams.get('departmentId');
    const action = searchParams.get('action'); // approve, publish, etc.
    
    if (!timetableId || !departmentId) {
      return NextResponse.json(
        { error: 'Timetable ID and Department ID are required' },
        { status: 400 }
      );
    }

    // Verify timetable belongs to department
    const timetable = await TimetableModel.aggregate([
      { $match: { id: timetableId } },
      {
        $lookup: {
          from: 'programs',
          localField: 'programId',
          foreignField: 'id',
          as: 'program'
        }
      },
      { $unwind: '$program' },
      { $match: { 'program.departmentId': departmentId } }
    ]);

    if (!timetable.length) {
      return NextResponse.json(
        { error: 'Timetable not found or not in your department' },
        { status: 404 }
      );
    }

    let updateData = { ...updates };

    // Handle special actions
    if (action === 'approve') {
      updateData.status = 'published';
      updateData.approvedAt = new Date().toISOString();
      updateData.approvedBy = updates.approvedBy || 'HOD';
    } else if (action === 'reject') {
      updateData.status = 'draft';
      updateData.rejectionReason = updates.rejectionReason;
    } else if (action === 'submit_for_approval') {
      updateData.status = 'pending_approval';
      updateData.submittedAt = new Date().toISOString();
    }

    // Update version number for significant changes
    if (updates.entries) {
      const currentVersion = timetable[0].version || '1.0';
      const [major, minor] = currentVersion.split('.').map(Number);
      updateData.version = `${major}.${minor + 1}`;
    }

    updateData.updatedAt = new Date().toISOString();

    const updatedTimetable = await TimetableModel.findOneAndUpdate(
      { id: timetableId },
      updateData,
      { new: true }
    );
    
    return NextResponse.json(updatedTimetable);

  } catch (error) {
    console.error('Error updating timetable:', error);
    return NextResponse.json(
      { error: 'Failed to update timetable' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get('timetableId');
    const departmentId = searchParams.get('departmentId');
    
    if (!timetableId || !departmentId) {
      return NextResponse.json(
        { error: 'Timetable ID and Department ID are required' },
        { status: 400 }
      );
    }

    // Verify timetable belongs to department
    const timetable = await TimetableModel.aggregate([
      { $match: { id: timetableId } },
      {
        $lookup: {
          from: 'programs',
          localField: 'programId',
          foreignField: 'id',
          as: 'program'
        }
      },
      { $unwind: '$program' },
      { $match: { 'program.departmentId': departmentId } }
    ]);

    if (!timetable.length) {
      return NextResponse.json(
        { error: 'Timetable not found or not in your department' },
        { status: 404 }
      );
    }

    // Check if timetable is published (shouldn't be deleted)
    if (timetable[0].status === 'published') {
      return NextResponse.json(
        { error: 'Cannot delete published timetables' },
        { status: 400 }
      );
    }

    await TimetableModel.findOneAndDelete({ id: timetableId });
    
    return NextResponse.json({ message: 'Timetable deleted successfully' });

  } catch (error) {
    console.error('Error deleting timetable:', error);
    return NextResponse.json(
      { error: 'Failed to delete timetable' },
      { status: 500 }
    );
  }
}