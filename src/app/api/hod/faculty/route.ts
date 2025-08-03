import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { FacultyModel, CourseOfferingModel, TimetableModel } from '@/lib/models';

// Connect to MongoDB
async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  }
}

interface FacultyWithWorkload {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  experienceYears: number;
  qualifications: string[];
  specialization: string[];
  status: string;
  totalHours: number;
  maxHours: number;
  workloadPercentage: number;
  subjects: string[];
  conflicts: number;
  timetables: string[];
  preferences: {
    maxHours: number;
    preferredDays: string[];
    preferredSlots: string[];
  };
  alerts: Array<{
    type: 'overload' | 'underload' | 'conflict';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Get faculty with detailed workload information
    const facultyData = await FacultyModel.aggregate([
      { $match: { departmentId, status: 'active' } },
      {
        $lookup: {
          from: 'courseofferings',
          localField: 'id',
          foreignField: 'facultyId',
          as: 'courseAssignments'
        }
      },
      {
        $lookup: {
          from: 'timetables',
          let: { facultyId: '$id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$facultyId', '$entries.facultyId']
                }
              }
            }
          ],
          as: 'timetableAssignments'
        }
      },
      {
        $project: {
          id: 1,
          name: 1,
          email: 1,
          designation: 1,
          department: 1,
          experienceYears: 1,
          qualifications: 1,
          specialization: 1,
          status: 1,
          preferences: {
            maxHours: { $ifNull: ['$preferences.maxWeeklyHours', 20] },
            preferredDays: { $ifNull: ['$preferences.preferredDays', []] },
            preferredSlots: { $ifNull: ['$preferences.preferredTimeSlots', []] }
          },
          courseAssignments: 1,
          timetableAssignments: 1,
          totalHours: {
            $sum: {
              $map: {
                input: '$courseAssignments',
                as: 'course',
                in: { $ifNull: ['$$course.weeklyHours', 3] }
              }
            }
          },
          subjects: {
            $map: {
              input: '$courseAssignments',
              as: 'course',
              in: '$$course.courseName'
            }
          },
          timetables: {
            $map: {
              input: '$timetableAssignments',
              as: 'tt',
              in: '$$tt.name'
            }
          }
        }
      },
      {
        $addFields: {
          maxHours: '$preferences.maxHours',
          workloadPercentage: {
            $multiply: [
              { $divide: ['$totalHours', '$preferences.maxHours'] },
              100
            ]
          },
          conflicts: 0, // This would be calculated from actual scheduling conflicts
          alerts: {
            $let: {
              vars: {
                workloadPct: {
                  $multiply: [
                    { $divide: ['$totalHours', '$preferences.maxHours'] },
                    100
                  ]
                }
              },
              in: {
                $switch: {
                  branches: [
                    {
                      case: { $gt: ['$$workloadPct', 100] },
                      then: [{
                        type: 'overload',
                        severity: 'high',
                        message: {
                          $concat: [
                            'Exceeding maximum teaching hours by ',
                            { $toString: { $subtract: ['$totalHours', '$preferences.maxHours'] } },
                            ' hours'
                          ]
                        }
                      }]
                    },
                    {
                      case: { $lt: ['$$workloadPct', 60] },
                      then: [{
                        type: 'underload',
                        severity: 'medium',
                        message: {
                          $concat: [
                            'Available for additional ',
                            { $toString: { $subtract: ['$preferences.maxHours', '$totalHours'] } },
                            ' teaching hours'
                          ]
                        }
                      }]
                    }
                  ],
                  default: []
                }
              }
            }
          }
        }
      }
    ]);

    const facultyWithWorkload: FacultyWithWorkload[] = facultyData.map(faculty => ({
      ...faculty,
      alerts: faculty.alerts || []
    }));

    return NextResponse.json(facultyWithWorkload);

  } catch (error) {
    console.error('Error fetching faculty data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const facultyData = await request.json();
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Add department ID to faculty data
    const newFaculty = {
      ...facultyData,
      departmentId,
      id: new mongoose.Types.ObjectId().toString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdFaculty = await FacultyModel.create(newFaculty);
    
    return NextResponse.json(createdFaculty, { status: 201 });

  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json(
      { error: 'Failed to create faculty member' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const updates = await request.json();
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const departmentId = searchParams.get('departmentId');
    
    if (!facultyId || !departmentId) {
      return NextResponse.json(
        { error: 'Faculty ID and Department ID are required' },
        { status: 400 }
      );
    }

    // Ensure faculty belongs to the department
    const updatedFaculty = await FacultyModel.findOneAndUpdate(
      { id: facultyId, departmentId },
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true }
    );

    if (!updatedFaculty) {
      return NextResponse.json(
        { error: 'Faculty member not found or not in your department' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedFaculty);

  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json(
      { error: 'Failed to update faculty member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const departmentId = searchParams.get('departmentId');
    
    if (!facultyId || !departmentId) {
      return NextResponse.json(
        { error: 'Faculty ID and Department ID are required' },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive instead of removing
    const deletedFaculty = await FacultyModel.findOneAndUpdate(
      { id: facultyId, departmentId },
      { 
        status: 'inactive',
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );

    if (!deletedFaculty) {
      return NextResponse.json(
        { error: 'Faculty member not found or not in your department' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Faculty member deactivated successfully' });

  } catch (error) {
    console.error('Error deleting faculty:', error);
    return NextResponse.json(
      { error: 'Failed to delete faculty member' },
      { status: 500 }
    );
  }
}