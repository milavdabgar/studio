import { NextResponse, type NextRequest } from 'next/server';
import type { Curriculum, Program, Course } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { isValid, parseISO, format } from 'date-fns';
import mongoose from 'mongoose';
import { CurriculumModel } from '@/lib/models';

const generateIdForImport = (): string => `curr_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const programsJson = formData.get('programs') as string | null;
    const coursesJson = formData.get('courses') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!programsJson || !coursesJson) {
      return NextResponse.json({ message: 'Program or Course data for mapping is missing.' }, { status: 400 });
    }
    
    const clientPrograms: Program[] = JSON.parse(programsJson);
    const clientCourses: Course[] = JSON.parse(coursesJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: 'greedy', // Skips lines that are empty or only whitespace
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: false, 
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Curricula CSV file.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['version', 'effectivedate', 'status', 'semester', 'iselective']; // programId/Code, courseId/Subcode also needed
    if (!requiredHeaders.every(rh => header.includes(rh))) {
      const missing = requiredHeaders.filter(rh => !header.includes(rh));
      return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importErrors: { row: number; message: string; data: unknown }[] = [];
    const now = new Date().toISOString();

    const curriculaFromCsv: Record<string, Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt' | 'courses'> & { courses: Curriculum['courses'], csvId?: string }> = {};

    for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const rowIndex = i + 2;

        const version = row.version?.toString().trim();
        const effectiveDateStr = row.effectivedate?.toString().trim();
        const statusRaw = row.status?.toString().trim().toLowerCase();
        const status = ['draft', 'active', 'archived'].includes(statusRaw) ? statusRaw as Curriculum['status'] : undefined;
        
        const courseIdCsv = row.courseid?.toString().trim();
        const courseSubcodeCsv = row.coursesubcode?.toString().trim().toUpperCase();
        const semesterStr = row.semester?.toString().trim();
        const isElectiveCsv = row.iselective?.toString().trim().toLowerCase();

        if (!version || !effectiveDateStr || !status || !semesterStr || isElectiveCsv === undefined) {
            importErrors.push({ row: rowIndex, message: "Missing required curriculum or course fields: version, effectiveDate, status, semester, isElective.", data: row });
            skippedCount++; continue;
        }
        
        let effectiveDate: string;
        try {
            effectiveDate = format(parseISO(effectiveDateStr), "yyyy-MM-dd");
            if(!isValid(parseISO(effectiveDate))){ throw new Error("Invalid date format"); }
        } catch(e) {
            importErrors.push({ row: rowIndex, message: `Invalid effective date format: ${effectiveDateStr}. Expected YYYY-MM-DD.`, data: row });
            skippedCount++; continue;
        }
        
        const semester = parseInt(semesterStr, 10);
        if (isNaN(semester) || semester < 1 || semester > 12) {
            importErrors.push({ row: rowIndex, message: `Invalid semester: ${semesterStr}.`, data: row });
            skippedCount++; continue;
        }
        const isElective = isElectiveCsv === 'true' || isElectiveCsv === '1';


        let programId = row.programid?.toString().trim();
        if (!programId) {
            const programCodeCsv = row.programcode?.toString().trim().toUpperCase();
            const foundProgram = clientPrograms.find(p => p.code.toUpperCase() === programCodeCsv);
            if (foundProgram) programId = foundProgram.id;
            else {
                importErrors.push({ row: rowIndex, message: `Program not found by code '${programCodeCsv}'.`, data: row });
                skippedCount++; continue;
            }
        } else if (!clientPrograms.some(p => p.id === programId)) {
            importErrors.push({ row: rowIndex, message: `Provided programId '${programId}' does not exist.`, data: row });
            skippedCount++; continue;
        }
        
        let courseId = courseIdCsv;
        if (!courseId) {
            const foundCourse = clientCourses.find(c => c.subcode.toUpperCase() === courseSubcodeCsv && c.programId === programId);
            if (foundCourse) courseId = foundCourse.id;
            else {
                importErrors.push({ row: rowIndex, message: `Course not found by subcode '${courseSubcodeCsv}' for program '${programId}'.`, data: row });
                skippedCount++; continue;
            }
        } else if (!clientCourses.some(c => c.id === courseId)) {
            importErrors.push({ row: rowIndex, message: `Provided courseId '${courseId}' does not exist.`, data: row });
            skippedCount++; continue;
        }

        const curriculumKey = `${programId}-${version}`;
        if (!curriculaFromCsv[curriculumKey]) {
            curriculaFromCsv[curriculumKey] = {
                programId, version, effectiveDate, status, courses: [], csvId: row.id?.toString().trim()
            };
        }
        // Ensure status and effectiveDate are consistent for the same curriculum version from CSV
        if(curriculaFromCsv[curriculumKey].status !== status || curriculaFromCsv[curriculumKey].effectiveDate !== effectiveDate){
            importErrors.push({ row: rowIndex, message: `Inconsistent status or effectiveDate for curriculum version ${version} of program ${programId}. Using first encountered values.`, data: row });
        }

        if(!curriculaFromCsv[curriculumKey].courses.find(c => c.courseId === courseId && c.semester === semester)){
            curriculaFromCsv[curriculumKey].courses.push({ courseId, semester, isElective });
        }
    }

    for (const key in curriculaFromCsv) {
        const {csvId, ...curriculumData} = curriculaFromCsv[key];
        
        // Find existing curriculum in MongoDB
        let existingCurriculum = null;
        if (csvId) {
            existingCurriculum = await CurriculumModel.findOne({ id: csvId });
        } else {
            existingCurriculum = await CurriculumModel.findOne({ 
                programId: curriculumData.programId, 
                version: { $regex: new RegExp(`^${curriculumData.version}$`, 'i') }
            });
        }

        if (existingCurriculum) {
            // Update existing curriculum
            Object.assign(existingCurriculum, { ...curriculumData, courses: curriculumData.courses, updatedAt: now });
            await existingCurriculum.save();
            updatedCount++;
        } else {
            // Check for duplicate before creating
            const duplicateCurriculum = await CurriculumModel.findOne({ 
                programId: curriculumData.programId, 
                version: { $regex: new RegExp(`^${curriculumData.version}$`, 'i') }
            });

            if (duplicateCurriculum) {
                importErrors.push({ row: -1, message: `Curriculum version '${curriculumData.version}' for program '${curriculumData.programId}' already exists with a different ID. Skipped.`, data: curriculumData });
                skippedCount++; 
                continue;
            }

            // Create new curriculum
            const newCurriculumData = {
                id: csvId || generateIdForImport(),
                ...curriculumData,
                createdAt: now,
                updatedAt: now,
            };
            const newCurriculum = new CurriculumModel(newCurriculumData);
            await newCurriculum.save();
            newCount++;
        }
    }

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Curricula import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); 
    }
    return NextResponse.json({ message: 'Curricula imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during curriculum import process:', error);
    return NextResponse.json({ message: 'Critical error during curriculum import process. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}