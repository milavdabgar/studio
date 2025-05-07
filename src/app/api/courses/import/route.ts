
import { NextResponse, type NextRequest } from 'next/server';
import type { Course, Department, Program } from '@/types/entities';
import { parse } from 'papaparse';

let coursesStore: Course[] = (global as any).coursesStore || [];
if (!(global as any).coursesStore) {
  (global as any).coursesStore = coursesStore;
}
// Departments and Programs stores should be initialized if not already
let departmentsStore: Department[] = (global as any).departmentsStore || [];
let programsStore: Program[] = (global as any).programsStore || [];


const generateIdForImport = (): string => `crs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
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

    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, ''), // Sanitize header
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors:', parseErrors);
      return NextResponse.json({ message: 'Error parsing CSV file.', errors: parseErrors.map(e => e.message) }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['subcode', 'subjectname', 'semester']; // dept/prog id/name/code checked later

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of parsedData) {
      const subcode = row.subcode?.trim().toUpperCase();
      const subjectName = row.subjectname?.trim();
      const semesterStr = row.semester?.trim();
      
      if (!subcode || !subjectName || !semesterStr) {
        skippedCount++; continue;
      }
      const semester = parseInt(semesterStr, 10);
      if (isNaN(semester) || semester <= 0) {
        skippedCount++; continue;
      }

      let departmentId = row.departmentid?.trim();
      if (!departmentId) {
        const deptName = row.departmentname?.trim();
        const deptCode = row.departmentcode?.trim().toUpperCase();
        const foundDept = clientDepartments.find(d => (deptName && d.name.toLowerCase() === deptName.toLowerCase()) || (deptCode && d.code.toUpperCase() === deptCode));
        if (foundDept) departmentId = foundDept.id;
        else { skippedCount++; continue; }
      } else if (!clientDepartments.some(d => d.id === departmentId)) {
          skippedCount++; continue;
      }
      
      let programId = row.programid?.trim();
      if (!programId) {
        const progName = row.programname?.trim();
        const progCode = row.programcode?.trim().toUpperCase();
        const foundProg = clientPrograms.find(p => p.departmentId === departmentId && ((progName && p.name.toLowerCase() === progName.toLowerCase()) || (progCode && p.code.toUpperCase() === progCode)));
        if (foundProg) programId = foundProg.id;
        else { skippedCount++; continue; }
      } else if (!clientPrograms.some(p => p.id === programId && p.departmentId === departmentId)) {
          skippedCount++; continue;
      }

      const lectureHours = parseInt(row.lecturehours, 10) || 0;
      const tutorialHours = parseInt(row.tutorialhours, 10) || 0;
      const practicalHours = parseInt(row.practicalhours, 10) || 0;
      const theoryEseMarks = parseInt(row.theoryesemarks, 10) || 0;
      const theoryPaMarks = parseInt(row.theorypamarks, 10) || 0;
      const practicalEseMarks = parseInt(row.practicalesemarks, 10) || 0;
      const practicalPaMarks = parseInt(row.practicalpamarks, 10) || 0;


      const courseData: Omit<Course, 'id'> = {
        subcode, subjectName, semester, departmentId, programId, lectureHours, tutorialHours, practicalHours,
        credits: lectureHours + tutorialHours + practicalHours,
        theoryEseMarks, theoryPaMarks, practicalEseMarks, practicalPaMarks,
        totalMarks: theoryEseMarks + theoryPaMarks + practicalEseMarks + practicalPaMarks,
        branchCode: row.branchcode?.trim() || undefined,
        effFrom: row.efffrom?.trim() || undefined,
        category: row.category?.trim() || undefined,
        isElective: row.iselective?.toLowerCase() === 'true' || row.iselective === '1',
        isTheory: row.istheory?.toLowerCase() !== 'false' && row.istheory !== '0', // Default true
        theoryExamDuration: row.theoryexamduration?.trim() || undefined,
        isPractical: row.ispractical?.toLowerCase() === 'true' || row.ispractical === '1',
        practicalExamDuration: row.practicalexamduration?.trim() || undefined,
        isFunctional: row.isfunctional?.toLowerCase() !== 'false' && row.isfunctional !== '0', // Default true
        isSemiPractical: row.issemipractical?.toLowerCase() === 'true' || row.issemipractical === '1',
        remarks: row.remarks?.trim() || undefined,
      };

      const idFromCsv = row.id?.trim();
      let existingCourseIndex = -1;

      if (idFromCsv) {
        existingCourseIndex = coursesStore.findIndex(c => c.id === idFromCsv);
      } else { 
        existingCourseIndex = coursesStore.findIndex(c => c.subcode === subcode && c.programId === programId);
      }

      if (existingCourseIndex !== -1) {
        coursesStore[existingCourseIndex] = { ...coursesStore[existingCourseIndex], ...courseData };
        updatedCount++;
      } else {
        if (coursesStore.some(c => c.subcode === subcode && c.programId === programId)) {
             skippedCount++; continue;
        }
        const newCourse: Course = { id: idFromCsv || generateIdForImport(), ...courseData };
        coursesStore.push(newCourse);
        newCount++;
      }
    }

    return NextResponse.json({ message: 'Courses imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing courses:', error);
    return NextResponse.json({ message: 'Error importing courses.', error: (error as Error).message }, { status: 500 });
  }
}
