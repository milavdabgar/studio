
import { NextResponse, type NextRequest } from 'next/server';
import type { Course, Department, Program } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { CourseModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `crs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// GTU syllabus URL generator
const generateGTUSyllabusURL = (subcode: string): string => {
  return `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${subcode}.pdf`;
};

// Standardize effFrom values to academic year format (YYYY-YY)
const standardizeEffFrom = (effFrom: string | null | undefined): string => {
  if (!effFrom || effFrom.trim() === '') {
    return '2024-25'; // Default academic year
  }

  const value = effFrom.toString().trim();
  
  // Already in correct format (YYYY-YY)
  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }
  
  // Month-Year format (Aug-11, Sep-12, Jul-23, etc.)
  const monthYearMatch = value.match(/^[A-Za-z]{3}-(\d{2})$/);
  if (monthYearMatch) {
    const yearSuffix = monthYearMatch[1];
    const year = parseInt(yearSuffix);
    // Convert 2-digit year to 4-digit year
    const fullYear = year <= 30 ? 2000 + year : 1900 + year; // Assume 00-30 = 2000s, 31+ = 1900s
    const nextYear = ((fullYear + 1) % 100).toString().padStart(2, '0');
    return `${fullYear}-${nextYear}`;
  }
  
  // Date formats (07/01/13, 07/01/24, etc.)
  const dateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
  if (dateMatch) {
    const yearSuffix = dateMatch[3];
    const year = parseInt(yearSuffix);
    const fullYear = year <= 30 ? 2000 + year : 1900 + year;
    const nextYear = ((fullYear + 1) % 100).toString().padStart(2, '0');
    return `${fullYear}-${nextYear}`;
  }
  
  // Single year (2021, 2011, etc.)
  const singleYearMatch = value.match(/^(\d{4})$/);
  if (singleYearMatch) {
    const year = parseInt(singleYearMatch[1]);
    const nextYear = ((year + 1) % 100).toString().padStart(2, '0');
    return `${year}-${nextYear}`;
  }
  
  // Academic year with different separator (2011-12, 2013-14)
  const academicYearMatch = value.match(/^(\d{4})-(\d{2})$/);
  if (academicYearMatch) {
    return value; // Already correct format
  }
  
  // If no pattern matches, default to current academic year
  console.warn(`Unknown effFrom format: "${value}", using default 2024-25`);
  return '2024-25';
};

// GTU CSV format detection (updated to exclude 'exp' column)
const isGTUCSVFormat = (headers: string[]): boolean => {
  const gtuHeaders = ['subcode', 'branchcode', 'efffrom', 'subjectname', 'category', 'semyear'];
  return gtuHeaders.every(header => headers.includes(header));
};

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
    
    // SECURITY FIX: Validate Content-Type for file uploads
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        message: 'Invalid Content-Type. Expected multipart/form-data for file upload.' 
      }, { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const departmentsJson = formData.get('departments') as string | null;
    const programsJson = formData.get('programs') as string | null;


    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!departmentsJson || !programsJson) {
      return NextResponse.json({ message: 'Department or Program data for mapping is missing.' }, { status: 400 });
    }

    const clientDepartments: Department[] = JSON.parse(departmentsJson);
    const clientPrograms: Program[] = JSON.parse(programsJson);


    const fileText = await file.text();

    const { data: parsedData, errors: parseErrors } = parse<Record<string, unknown>>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, ''), 
      dynamicTyping: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Course Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Courses CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const isGTUFormat = isGTUCSVFormat(header);
    
    // Different required headers based on format
    const requiredHeaders = isGTUFormat 
      ? ['subcode', 'subjectname', 'semyear'] 
      : ['subcode', 'subjectname', 'semester']; 

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    console.log(`Detected ${isGTUFormat ? 'GTU' : 'standard'} CSV format`);

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of parsedData) {
      const subcode = row.subcode?.toString().trim().toUpperCase();
      const subjectName = row.subjectname?.toString().trim();
      
      // Handle different semester field names
      const semesterStr = isGTUFormat 
        ? row.semyear?.toString().trim() 
        : row.semester?.toString().trim();
      
      if (!subcode || !subjectName || !semesterStr) {
        console.warn(`Skipping course row due to missing subcode, subjectname, or semester: ${JSON.stringify(row)}`);
        skippedCount++; continue;
      }
      const semester = parseInt(semesterStr, 10);
      if (isNaN(semester) || semester <= 0) {
        console.warn(`Skipping course row due to invalid semester: ${JSON.stringify(row)}`);
        skippedCount++; continue;
      }

      let departmentId = row.departmentid?.toString().trim();
      let programId = row.programid?.toString().trim();
      
      // Handle GTU format with branch code mapping
      if (isGTUFormat) {
        const branchCode = row.branchcode?.toString().trim();
        
        // GTU branch code mapping - find program by code, then get its department
        // Try both string and number comparison since DB might store codes differently
        const foundProg = branchCode ? clientPrograms.find(p => 
          p.code === branchCode || 
          (typeof p.code === 'number' && p.code === parseInt(branchCode)) || 
          p.code?.toString() === branchCode
        ) : undefined;
        if (foundProg) {
          const foundDept = clientDepartments.find(d => d.id === foundProg.departmentId);
          if (foundDept) {
            departmentId = foundDept.id;
            programId = foundProg.id;
          }
        }
      }
      
      // Standard department mapping fallback
      if (!departmentId) {
        const deptName = row.departmentname?.toString().trim();
        const deptCode = row.departmentcode?.toString().trim().toUpperCase();
        const foundDept = clientDepartments.find(d => (deptName && d.name.toLowerCase() === deptName.toLowerCase()) || (deptCode && d.code.toUpperCase() === deptCode));
        if (foundDept) departmentId = foundDept.id;
        else { 
            console.warn(`Skipping course row: Could not find department by name/code. Row: ${JSON.stringify(row)}`);
            skippedCount++; continue; 
        }
      } else if (!clientDepartments.some(d => d.id === departmentId)) {
          console.warn(`Skipping course row: Department ID ${departmentId} not found. Row: ${JSON.stringify(row)}`);
          skippedCount++; continue;
      }
      
      // Standard program mapping fallback
      if (!programId) {
        const progName = row.programname?.toString().trim();
        const progCode = row.programcode?.toString().trim().toUpperCase();
        const foundProg = clientPrograms.find(p => p.departmentId === departmentId && ((progName && p.name.toLowerCase() === progName.toLowerCase()) || (progCode && p.code.toUpperCase() === progCode)));
        if (foundProg) programId = foundProg.id;
        else { 
            console.warn(`Skipping course row: Could not find program by name/code for department ${departmentId}. Row: ${JSON.stringify(row)}`);
            skippedCount++; continue; 
        }
      } else if (!clientPrograms.some(p => p.id === programId && p.departmentId === departmentId)) {
          console.warn(`Skipping course row: Program ID ${programId} not found or not in department ${departmentId}. Row: ${JSON.stringify(row)}`);
          skippedCount++; continue;
      }

      // Handle different field mappings for GTU vs standard format
      let lectureHours, tutorialHours, practicalHours;
      let theoryEseMarks, theoryPaMarks, practicalEseMarks, practicalPaMarks;
      
      if (isGTUFormat) {
        lectureHours = Number(row.l) || 0;
        tutorialHours = Number(row.t) || 0;
        practicalHours = Number(row.p) || 0;
        theoryEseMarks = Number(row.e) || 0;
        theoryPaMarks = Number(row.m) || 0;
        practicalEseMarks = Number(row.i) || 0;
        practicalPaMarks = Number(row.v) || 0;
      } else {
        lectureHours = Number(row.lecturehours) || 0;
        tutorialHours = Number(row.tutorialhours) || 0;
        practicalHours = Number(row.practicalhours) || 0;
        theoryEseMarks = Number(row.theoryesemarks) || 0;
        theoryPaMarks = Number(row.theorypamarks) || 0;
        practicalEseMarks = Number(row.practicalesemarks) || 0;
        practicalPaMarks = Number(row.practicalpamarks) || 0;
      }

      // Generate syllabus URL (use existing URL or auto-generate for GTU)
      const syllabusUrl = row.gtusyllabusurl?.toString().trim() || 
                         (isGTUFormat ? generateGTUSyllabusURL(subcode) : undefined);

      // Process and standardize effFrom field
      const rawEffFrom = row.efffrom?.toString().trim();
      const standardizedEffFrom = isGTUFormat ? standardizeEffFrom(rawEffFrom) : (rawEffFrom || undefined);
      
      if (isGTUFormat && rawEffFrom) {
        console.log(`Standardized effFrom:`, { 
          rawValue: rawEffFrom, 
          standardized: standardizedEffFrom,
          subcode: subcode 
        });
      }

      const courseData: Omit<Course, 'id'> = {
        subcode, subjectName, semester, departmentId, programId, lectureHours, tutorialHours, practicalHours,
        credits: lectureHours + tutorialHours + practicalHours,
        theoryEseMarks, theoryPaMarks, practicalEseMarks, practicalPaMarks,
        totalMarks: theoryEseMarks + theoryPaMarks + practicalEseMarks + practicalPaMarks,
        effFrom: standardizedEffFrom,
        category: row.category?.toString().trim() || 'Core', // Default to 'Core' if null
        syllabusUrl, // Add syllabus URL
        isElective: row.iselective?.toString().toLowerCase() === 'true' || row.iselective === '1' || row.iselective === 1,
        isTheory: row.istheory?.toString().toLowerCase() !== 'false' && row.istheory !== '0' && row.istheory !== 0, // Default true
        theoryExamDuration: row.theoryexamduration?.toString().trim() || '2.5 Hrs',
        isPractical: row.ispractical?.toString().toLowerCase() === 'true' || row.ispractical === '1' || row.ispractical === 1,
        practicalExamDuration: row.practicalexamduration?.toString().trim() || undefined,
        isFunctional: row.isfunctional?.toString().toLowerCase() !== 'false' && row.isfunctional !== '0' && row.isfunctional !== 0, // Default true
        isSemiPractical: row.issemipractical?.toString().toLowerCase() === 'true' || row.issemipractical === '1' || row.issemipractical === 1,
        remarks: row.remarks?.toString().trim() || undefined,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingCourse = null;

      if (idFromCsv) {
        existingCourse = await CourseModel.findOne({ 
          $or: [{ id: idFromCsv }, { _id: idFromCsv }] 
        });
      } else { 
        existingCourse = await CourseModel.findOne({ 
          subcode: subcode,
          programId: programId
        });
      }

      if (existingCourse) {
        await CourseModel.findOneAndUpdate(
          { _id: existingCourse._id },
          courseData
        );
        updatedCount++;
      } else {
        const duplicate = await CourseModel.findOne({ 
          subcode: subcode,
          programId: programId
        });
        
        if (duplicate) {
             console.warn(`Skipping new course: Subcode ${subcode} already exists for program ${programId}. Row: ${JSON.stringify(row)}`);
             skippedCount++; continue;
        }
        
        const newCourse = new CourseModel({
          id: idFromCsv || generateIdForImport(),
          ...courseData
        });
        
        await newCourse.save();
        newCount++;
      }
    }

    const message = isGTUFormat 
      ? `GTU courses imported successfully with auto-generated syllabus URLs. New: ${newCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`
      : `Courses imported successfully. New: ${newCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`;
      
    return NextResponse.json({ 
      message, 
      newCount, 
      updatedCount, 
      skippedCount, 
      isGTUFormat,
      syllabusUrlsGenerated: isGTUFormat ? newCount + updatedCount : 0
    }, { status: 200 });

  } catch (error) {
    console.error('Error importing courses:', error);
    return NextResponse.json({ message: 'Error importing courses.' }, { status: 500 });
  }
}
