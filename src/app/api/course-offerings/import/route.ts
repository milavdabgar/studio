import { NextResponse, type NextRequest } from 'next/server';
import type { CourseOffering, Course, Batch, Faculty } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { CourseOfferingModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';

const generateIdForImport = (): string => `co_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    // SECURITY FIX: Validate Content-Type for file uploads
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        message: 'Invalid Content-Type. Expected multipart/form-data for file upload.' 
      }, { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const coursesJson = formData.get('courses') as string | null;
    const batchesJson = formData.get('batches') as string | null;
    const facultiesJson = formData.get('faculties') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!coursesJson || !batchesJson || !facultiesJson) {
      return NextResponse.json({ message: 'Course, batch, or faculty data for mapping is missing.' }, { status: 400 });
    }

    const clientCourses: Course[] = JSON.parse(coursesJson);
    const clientBatches: Batch[] = JSON.parse(batchesJson);
    const clientFaculties: Faculty[] = JSON.parse(facultiesJson);

    const fileText = await file.text();

    const { data: parsedData, errors: parseErrors } = parse<Record<string, unknown>>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, ''), 
      dynamicTyping: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Course Offerings Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Course Offerings CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['courseid', 'batchid', 'academicyear', 'semester']; 

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    console.log('Processing course offerings CSV import');

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of parsedData) {
      const courseId = row.courseid?.toString().trim();
      const batchId = row.batchid?.toString().trim();
      const academicYear = row.academicyear?.toString().trim();
      const semesterStr = row.semester?.toString().trim();
      
      if (!courseId || !batchId || !academicYear || !semesterStr) {
        console.warn(`Skipping course offering row due to missing required fields: ${JSON.stringify(row)}`);
        skippedCount++; 
        continue;
      }

      const semester = parseInt(semesterStr, 10);
      if (isNaN(semester) || semester <= 0) {
        console.warn(`Skipping course offering row due to invalid semester: ${JSON.stringify(row)}`);
        skippedCount++; 
        continue;
      }

      // Validate that course, batch exist in provided data
      const foundCourse = clientCourses.find(c => c.id === courseId || c.subcode === courseId);
      const foundBatch = clientBatches.find(b => b.id === batchId || b.name === batchId);

      if (!foundCourse) {
        console.warn(`Skipping course offering: Course not found for ID/subcode: ${courseId}`);
        skippedCount++; 
        continue;
      }
      if (!foundBatch) {
        console.warn(`Skipping course offering: Batch not found for ID/name: ${batchId}`);
        skippedCount++; 
        continue;
      }

      // Parse faculty IDs (can be comma-separated or JSON array)
      let facultyIds: string[] = [];
      const facultyField = row.facultyids?.toString().trim();
      if (facultyField) {
        try {
          // Try parsing as JSON array first
          facultyIds = JSON.parse(facultyField);
        } catch {
          // If that fails, split by comma
          facultyIds = facultyField.split(',').map(id => id.trim()).filter(id => id);
        }
        
        // Validate faculty IDs exist
        const validFacultyIds = facultyIds.filter(fid => 
          clientFaculties.some(f => f.id === fid)
        );
        
        if (validFacultyIds.length === 0) {
          console.warn(`Skipping course offering: No valid faculty IDs found: ${facultyField}`);
          skippedCount++; 
          continue;
        }
        facultyIds = validFacultyIds;
      }

      // Parse dates
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (row.startdate) {
        const startDateStr = row.startdate.toString().trim();
        if (startDateStr) {
          startDate = new Date(startDateStr).toISOString();
        }
      }
      
      if (row.enddate) {
        const endDateStr = row.enddate.toString().trim();
        if (endDateStr) {
          endDate = new Date(endDateStr).toISOString();
        }
      }

      const courseOfferingData: Omit<CourseOffering, 'id'> = {
        courseId: foundCourse.id,
        batchId: foundBatch.id,
        academicYear,
        semester,
        facultyIds,
        roomIds: row.roomids ? row.roomids.toString().split(',').map(id => id.trim()).filter(id => id) : [],
        startDate,
        endDate,
        status: (row.status?.toString().trim() as CourseOffering['status']) || 'scheduled',
        maxEnrollments: row.maxenrollments ? parseInt(row.maxenrollments.toString()) : 60,
        currentEnrollments: row.currentenrollments ? parseInt(row.currentenrollments.toString()) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const idFromCsv = row.id?.toString().trim();
      let existingOffering = null;

      if (idFromCsv) {
        existingOffering = await CourseOfferingModel.findOne({ 
          $or: [{ id: idFromCsv }, { _id: idFromCsv }] 
        });
      } else { 
        existingOffering = await CourseOfferingModel.findOne({ 
          courseId: foundCourse.id,
          batchId: foundBatch.id,
          academicYear,
          semester
        });
      }

      if (existingOffering) {
        await CourseOfferingModel.findOneAndUpdate(
          { _id: existingOffering._id },
          { ...courseOfferingData, updatedAt: new Date().toISOString() }
        );
        updatedCount++;
      } else {
        // Check for duplicate before creating
        const duplicate = await CourseOfferingModel.findOne({ 
          courseId: foundCourse.id,
          batchId: foundBatch.id,
          academicYear,
          semester
        });
        
        if (duplicate) {
             console.warn(`Skipping course offering: Already exists for course ${foundCourse.subcode}, batch ${foundBatch.name}, ${academicYear}, semester ${semester}`);
             skippedCount++; 
             continue;
        }
        
        const newOffering = new CourseOfferingModel({
          id: idFromCsv || generateIdForImport(),
          ...courseOfferingData
        });
        
        await newOffering.save();
        newCount++;
      }
    }

    const message = `Course offerings imported successfully. New: ${newCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`;
      
    return NextResponse.json({ 
      message, 
      newCount, 
      updatedCount, 
      skippedCount 
    }, { status: 200 });

  } catch (error) {
    console.error('Error importing course offerings:', error);
    return NextResponse.json({ message: 'Error importing course offerings.' }, { status: 500 });
  }
}