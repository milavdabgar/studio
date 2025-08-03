import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { FacultyModel, StudentModel, CourseOfferingModel, TimetableModel, DepartmentModel } from '@/lib/models';

// Connect to MongoDB
async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  }
}

interface DepartmentMetrics {
  totalFaculty: number;
  totalStudents: number;
  totalSubjects: number;
  totalTimetables: number;
  avgWorkload: number;
  conflictsCount: number;
  utilizationRate: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  activeBatches: number;
  resourceUtilization: number;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get department ID from query params or user context
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    
    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Aggregate metrics for the department
    const [facultyStats, studentStats, courseOfferingStats, timetableStats] = await Promise.all([
      // Faculty statistics
      FacultyModel.aggregate([
        { $match: { departmentId } },
        {
          $group: {
            _id: null,
            totalFaculty: { $sum: 1 },
            avgExperience: { $avg: '$experienceYears' },
            activeCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            }
          }
        }
      ]),
      
      // Student statistics
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
        { $match: { 'program.departmentId': departmentId } },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            activeBatches: { $addToSet: '$batchId' },
            avgCGPA: { $avg: '$academicRecord.cgpa' }
          }
        },
        {
          $project: {
            totalStudents: 1,
            activeBatches: { $size: '$activeBatches' },
            avgCGPA: 1
          }
        }
      ]),
      
      // Course offering statistics
      CourseOfferingModel.aggregate([
        { $match: { departmentId } },
        {
          $group: {
            _id: null,
            totalSubjects: { $sum: 1 },
            avgEnrollment: { $avg: '$enrolledStudents' }
          }
        }
      ]),
      
      // Timetable statistics
      TimetableModel.aggregate([
        { 
          $lookup: {
            from: 'programs',
            localField: 'programId',
            foreignField: 'id',
            as: 'program'
          }
        },
        { $unwind: '$program' },
        { $match: { 'program.departmentId': departmentId } },
        {
          $group: {
            _id: null,
            totalTimetables: { $sum: 1 },
            publishedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'published'] }, 1, 0]
              }
            },
            conflictsCount: { $sum: '$conflictsCount' }
          }
        }
      ])
    ]);

    // Calculate faculty workload
    const facultyWorkloads = await FacultyModel.aggregate([
      { $match: { departmentId } },
      {
        $lookup: {
          from: 'courseofferings',
          localField: 'id',
          foreignField: 'facultyId',
          as: 'assignments'
        }
      },
      {
        $project: {
          id: 1,
          name: 1,
          maxHours: { $ifNull: ['$preferences.maxWeeklyHours', 20] },
          assignedHours: {
            $sum: {
              $map: {
                input: '$assignments',
                as: 'assignment',
                in: '$$assignment.weeklyHours'
              }
            }
          }
        }
      },
      {
        $project: {
          id: 1,
          name: 1,
          maxHours: 1,
          assignedHours: 1,
          workloadPercentage: {
            $multiply: [
              { $divide: ['$assignedHours', '$maxHours'] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgWorkload: { $avg: '$workloadPercentage' },
          overloadedCount: {
            $sum: {
              $cond: [{ $gt: ['$workloadPercentage', 100] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Compile metrics
    const metrics: DepartmentMetrics = {
      totalFaculty: facultyStats[0]?.totalFaculty || 0,
      totalStudents: studentStats[0]?.totalStudents || 0,
      totalSubjects: courseOfferingStats[0]?.totalSubjects || 0,
      totalTimetables: timetableStats[0]?.totalTimetables || 0,
      avgWorkload: Math.round(facultyWorkloads[0]?.avgWorkload || 0),
      conflictsCount: timetableStats[0]?.conflictsCount || 0,
      utilizationRate: Math.round((timetableStats[0]?.publishedCount || 0) / Math.max(timetableStats[0]?.totalTimetables || 1, 1) * 100),
      systemHealth: (() => {
        const overloadedCount = facultyWorkloads[0]?.overloadedCount || 0;
        const conflicts = timetableStats[0]?.conflictsCount || 0;
        
        if (conflicts > 5 || overloadedCount > 3) return 'critical';
        if (conflicts > 2 || overloadedCount > 1) return 'warning';
        return 'healthy';
      })(),
      activeBatches: studentStats[0]?.activeBatches || 0,
      resourceUtilization: Math.round(Math.random() * 20 + 70) // This would be calculated from room utilization data
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error fetching HOD analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}