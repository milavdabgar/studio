import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { StudentModel, ProgramModel, BatchModel, EnrollmentModel } from '@/lib/models';

// Connect to MongoDB
async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  }
}

interface StudentWithDetails {
  id: string;
  enrollmentNumber: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: any;
  programId: string;
  programName: string;
  batchId: string;
  batchName: string;
  semester: number;
  academicYear: string;
  status: string;
  academicRecord: {
    cgpa: number;
    sgpa: number[];
    totalCredits: number;
    backlogCount: number;
  };
  attendancePercentage: number;
  placementStatus: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const batchId = searchParams.get('batchId');
    const semester = searchParams.get('semester');
    
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Build match criteria
    const matchCriteria: any = {};
    
    if (search) {
      matchCriteria.$or = [
        { name: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (batchId) {
      matchCriteria.batchId = batchId;
    }
    
    if (semester) {
      matchCriteria.currentSemester = parseInt(semester);
    }

    // Get students with program and batch details
    const pipeline = [
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
        $lookup: {
          from: 'enrollments',
          localField: 'id',
          foreignField: 'studentId',
          as: 'enrollments'
        }
      },
      {
        $project: {
          id: 1,
          enrollmentNumber: 1,
          name: 1,
          email: 1,
          phone: 1,
          dateOfBirth: 1,
          address: 1,
          programId: 1,
          programName: '$program.name',
          batchId: 1,
          batchName: '$batch.name',
          semester: '$currentSemester',
          academicYear: '$batch.academicYear',
          status: 1,
          academicRecord: {
            cgpa: { $ifNull: ['$academicRecord.cgpa', 0] },
            sgpa: { $ifNull: ['$academicRecord.sgpa', []] },
            totalCredits: { $ifNull: ['$academicRecord.totalCredits', 0] },
            backlogCount: { $ifNull: ['$academicRecord.backlogCount', 0] }
          },
          attendancePercentage: { $ifNull: ['$attendanceRecord.overallPercentage', 0] },
          placementStatus: { $ifNull: ['$placementRecord.status', 'not_started'] },
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const [students, totalCount] = await Promise.all([
      StudentModel.aggregate(pipeline as any),
      StudentModel.aggregate([
        {
          $lookup: {
            from: 'programs',
            localField: 'programId',
            foreignField: 'id',
            as: 'program'
          }
        },
        { $unwind: '$program' },
        { $match: { 'program.departmentId': departmentId, ...matchCriteria } },
        { $count: 'total' }
      ] as any)
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const studentData = await request.json();
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
      id: studentData.programId, 
      departmentId 
    });
    
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found or not in your department' },
        { status: 404 }
      );
    }

    // Generate enrollment number if not provided
    if (!studentData.enrollmentNumber) {
      const year = new Date().getFullYear().toString().slice(-2);
      const deptCode = program.code.slice(0, 2);
      const count = await StudentModel.countDocuments({}) + 1;
      studentData.enrollmentNumber = `${year}${deptCode}${count.toString().padStart(4, '0')}`;
    }

    const newStudent = {
      ...studentData,
      id: new mongoose.Types.ObjectId().toString(),
      status: 'active',
      academicRecord: {
        cgpa: 0,
        sgpa: [],
        totalCredits: 0,
        backlogCount: 0,
        ...studentData.academicRecord
      },
      attendanceRecord: {
        overallPercentage: 0,
        ...studentData.attendanceRecord
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdStudent = await StudentModel.create(newStudent);
    
    return NextResponse.json(createdStudent, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const updates = await request.json();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const departmentId = searchParams.get('departmentId');
    
    if (!studentId || !departmentId) {
      return NextResponse.json(
        { error: 'Student ID and Department ID are required' },
        { status: 400 }
      );
    }

    // Verify student belongs to department through program
    const student = await StudentModel.aggregate([
      { $match: { id: studentId } },
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

    if (!student.length) {
      return NextResponse.json(
        { error: 'Student not found or not in your department' },
        { status: 404 }
      );
    }

    const updatedStudent = await StudentModel.findOneAndUpdate(
      { id: studentId },
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true }
    );
    
    return NextResponse.json(updatedStudent);

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const departmentId = searchParams.get('departmentId');
    
    if (!studentId || !departmentId) {
      return NextResponse.json(
        { error: 'Student ID and Department ID are required' },
        { status: 400 }
      );
    }

    // Verify student belongs to department
    const student = await StudentModel.aggregate([
      { $match: { id: studentId } },
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

    if (!student.length) {
      return NextResponse.json(
        { error: 'Student not found or not in your department' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    const deletedStudent = await StudentModel.findOneAndUpdate(
      { id: studentId },
      { 
        status: 'inactive',
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );
    
    return NextResponse.json({ message: 'Student deactivated successfully' });

  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}