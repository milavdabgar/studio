import { NextResponse, type NextRequest } from 'next/server';
import { CourseOfferingModel, CourseModel, BatchModel, FacultyModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'standard';
    
    // Get all course offerings with enriched data
    const courseOfferings = await CourseOfferingModel.find({}).lean();
    const courses = await CourseModel.find({}).lean();
    const batches = await BatchModel.find({}).lean();
    const faculties = await FacultyModel.find({}).lean();
    
    // Enrich course offerings with related data
    const enrichedOfferings = courseOfferings.map(offering => {
      const course = courses.find(c => c.id === (offering as any).courseId);
      const batch = batches.find(b => b.id === (offering as any).batchId);
      const offeringFaculties = faculties.filter(f => (offering as any).facultyIds?.includes(f.id));
      
      return {
        ...(offering as any),
        courseName: course?.subjectName || 'Unknown Course',
        courseSubcode: course?.subcode || 'Unknown',
        batchName: batch?.name || 'Unknown Batch',
        facultyNames: offeringFaculties.map(f => f.displayName || f.fullName || f.firstName).join(', ')
      };
    });
    
    if (format === 'json') {
      return NextResponse.json(enrichedOfferings);
    }
    
    // Generate CSV
    const header = [
      'id', 'courseId', 'courseName', 'courseSubcode', 'batchId', 'batchName', 
      'academicYear', 'semester', 'facultyIds', 'facultyNames', 'roomIds',
      'startDate', 'endDate', 'status', 'maxEnrollments', 'currentEnrollments',
      'createdAt', 'updatedAt'
    ];
    
    const csvRows = [
      header.join(','),
      ...enrichedOfferings.map((offering: any) => [
        offering.id || '',
        offering.courseId || '',
        `"${(offering.courseName || '').replace(/"/g, '""')}"`,
        offering.courseSubcode || '',
        offering.batchId || '',
        `"${(offering.batchName || '').replace(/"/g, '""')}"`,
        offering.academicYear || '',
        offering.semester || '',
        `"${(offering.facultyIds || []).join(',')}"`,
        `"${(offering.facultyNames || '').replace(/"/g, '""')}"`,
        `"${(offering.roomIds || []).join(',')}"`,
        offering.startDate || '',
        offering.endDate || '',
        offering.status || '',
        offering.maxEnrollments || '',
        offering.currentEnrollments || 0,
        offering.createdAt || '',
        offering.updatedAt || ''
      ].join(','))
    ];
    
    const csvString = csvRows.join('\r\n');
    
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="course_offerings_export.csv"'
      }
    });
    
  } catch (error) {
    console.error('Error exporting course offerings:', error);
    return NextResponse.json({ message: 'Error exporting course offerings.' }, { status: 500 });
  }
}