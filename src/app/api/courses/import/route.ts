
import { NextResponse, type NextRequest } from 'next/server';
import type { Course, Department, Program } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { CourseModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `crs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
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
    const requiredHeaders = ['subcode', 'subjectname', 'semester']; 

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of parsedData) {
      const subcode = row.subcode?.toString().trim().toUpperCase();
      const subjectName = row.subjectname?.toString().trim();
      const semesterStr = row.semester?.toString().trim();
      
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
      
      let programId = row.programid?.toString().trim();
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

      const lectureHours = Number(row.lecturehours) || 0;
      const tutorialHours = Number(row.tutorialhours) || 0;
      const practicalHours = Number(row.practicalhours) || 0;
      const theoryEseMarks = Number(row.theoryesemarks) || 0;
      const theoryPaMarks = Number(row.theorypamarks) || 0;
      const practicalEseMarks = Number(row.practicalesemarks) || 0;
      const practicalPaMarks = Number(row.practicalpamarks) || 0;


      const courseData: Omit<Course, 'id'> = {
        subcode, subjectName, semester, departmentId, programId, lectureHours, tutorialHours, practicalHours,
        credits: lectureHours + tutorialHours + practicalHours,
        theoryEseMarks, theoryPaMarks, practicalEseMarks, practicalPaMarks,
        totalMarks: theoryEseMarks + theoryPaMarks + practicalEseMarks + practicalPaMarks,
        branchCode: row.branchcode?.toString().trim() || undefined,
        effFrom: row.efffrom?.toString().trim() || undefined,
        category: row.category?.toString().trim() || undefined,
        isElective: row.iselective?.toString().toLowerCase() === 'true' || row.iselective === '1' || row.iselective === 1,
        isTheory: row.istheory?.toString().toLowerCase() !== 'false' && row.istheory !== '0' && row.istheory !== 0, // Default true
        theoryExamDuration: row.theoryexamduration?.toString().trim() || undefined,
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

    return NextResponse.json({ message: 'Courses imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing courses:', error);
    return NextResponse.json({ message: 'Error importing courses.', error: (error as Error).message }, { status: 500 });
  }
}
