import { NextResponse, type NextRequest } from 'next/server';
import type { AssessmentStatus, AssessmentType, Course, Program, Batch } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { isValid, parseISO, format } from 'date-fns';
import { AssessmentModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `asmnt_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const ASSESSMENT_TYPE_OPTIONS: AssessmentType[] = ['Quiz', 'Midterm', 'Final Exam', 'Assignment', 'Project', 'Lab Work', 'Presentation', 'Other'];
const ASSESSMENT_STATUS_OPTIONS: AssessmentStatus[] = ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'];

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const coursesJson = formData.get('courses') as string | null;
    const programsJson = formData.get('programs') as string | null;
    const batchesJson = formData.get('batches') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!coursesJson || !programsJson) {
      return NextResponse.json({ message: 'Course or Program data for mapping is missing.' }, { status: 400 });
    }
    
    const clientCourses: Course[] = JSON.parse(coursesJson);
    const clientPrograms: Program[] = JSON.parse(programsJson);
    const clientBatches: Batch[] = batchesJson ? JSON.parse(batchesJson) : [];

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: false, 
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Assessments CSV file.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['name', 'type', 'maxmarks', 'status']; // course/program/batch mapping needed
    if (!requiredHeaders.every(rh => header.includes(rh))) {
      const missing = requiredHeaders.filter(rh => !header.includes(rh));
      return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importErrors: { row: number; message: string; data: unknown }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2; 

      const name = row.name?.toString().trim();
      const typeRaw = row.type?.toString().trim();
      const type = ASSESSMENT_TYPE_OPTIONS.find(t => t.toLowerCase() === typeRaw?.toLowerCase()) || undefined;
      const maxMarksStr = row.maxmarks?.toString().trim();
      const statusRaw = row.status?.toString().trim();
      const status = ASSESSMENT_STATUS_OPTIONS.find(s => s.toLowerCase() === statusRaw?.toLowerCase()) || undefined;

      if (!name || !type || !maxMarksStr || !status) {
        importErrors.push({ row: rowIndex, message: "Missing or invalid required fields: name, type, maxMarks, or status.", data: row });
        skippedCount++; continue;
      }
      const maxMarks = parseFloat(maxMarksStr);
      if (isNaN(maxMarks) || maxMarks <= 0) {
        importErrors.push({ row: rowIndex, message: `Invalid Max Marks: ${maxMarksStr}. Must be positive.`, data: row });
        skippedCount++; continue;
      }

      let courseId = row.courseid?.toString().trim();
      if (!courseId && row.coursesubcode) {
          const courseSubcode = row.coursesubcode.toString().trim().toUpperCase();
          // If programId is also given, filter by that too
          const progIdForRow = row.programid?.toString().trim();
          const foundCourse = clientCourses.find(c => c.subcode.toUpperCase() === courseSubcode && (!progIdForRow || c.programId === progIdForRow));
          if (foundCourse) courseId = foundCourse.id;
      }
      if (!courseId) {
           importErrors.push({ row: rowIndex, message: `Course ID or valid Course Subcode (with optional Program ID) required.`, data: row });
           skippedCount++; continue;
      }
      const targetCourse = clientCourses.find(c => c.id === courseId);
      if(!targetCourse){
           importErrors.push({ row: rowIndex, message: `Course with ID '${courseId}' not found.`, data: row });
           skippedCount++; continue;
      }

      const programId = row.programid?.toString().trim() || targetCourse.programId; // Prefer CSV, fallback to course's program
      if (!clientPrograms.some(p => p.id === programId)) {
        importErrors.push({ row: rowIndex, message: `Program ID '${programId}' not found.`, data: row });
        skippedCount++; continue;
      }
      
      let batchId = row.batchid?.toString().trim() || undefined;
      if (batchId && !clientBatches.some(b => b.id === batchId && b.programId === programId)) {
          importErrors.push({ row: rowIndex, message: `Batch ID '${batchId}' not found or not associated with Program ID '${programId}'.`, data: row });
          batchId = undefined; // Clear if invalid
      }


      const passingMarksStr = row.passingmarks?.toString().trim();
      const passingMarks = passingMarksStr && !isNaN(parseFloat(passingMarksStr)) ? parseFloat(passingMarksStr) : undefined;
      if (passingMarks !== undefined && (passingMarks < 0 || passingMarks > maxMarks)) {
          importErrors.push({ row: rowIndex, message: `Invalid Passing Marks: ${passingMarksStr}.`, data: row });
          skippedCount++; continue;
      }

      const weightageStr = row.weightage?.toString().trim();
      const weightage = weightageStr && !isNaN(parseFloat(weightageStr)) ? parseFloat(weightageStr) : undefined;
       if (weightage !== undefined && (weightage < 0 || weightage > 1)) {
          importErrors.push({ row: rowIndex, message: `Invalid Weightage: ${weightageStr}. Must be between 0 and 1.`, data: row });
          skippedCount++; continue;
      }
      
      const assessmentDateStr = row.assessmentdate?.toString().trim();
      let assessmentDate: string | undefined = undefined;
      if (assessmentDateStr) {
          try {
              assessmentDate = format(parseISO(assessmentDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              if(!isValid(parseISO(assessmentDate))) throw new Error();
          } catch {
              importErrors.push({ row: rowIndex, message: `Invalid Assessment Date format: ${assessmentDateStr}.`, data: row });
              skippedCount++; continue;
          }
      }
      const dueDateStr = row.duedate?.toString().trim();
      let dueDate: string | undefined = undefined;
      if (dueDateStr) {
          try {
              dueDate = format(parseISO(dueDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              if(!isValid(parseISO(dueDate))) throw new Error();
          } catch {
              importErrors.push({ row: rowIndex, message: `Invalid Due Date format: ${dueDateStr}.`, data: row });
              skippedCount++; continue;
          }
      }


      const assessmentDataFromCsv = {
        name, courseId, programId, batchId, type, maxMarks, status,
        description: row.description?.toString().trim() || undefined,
        passingMarks, weightage,
        assessmentDate, dueDate,
        instructions: row.instructions?.toString().trim() || undefined,
        facultyId: row.facultyid?.toString().trim() || undefined,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingAssessment = null;

      if (idFromCsv) {
        existingAssessment = await AssessmentModel.findOne({ 
          $or: [{ id: idFromCsv }, { _id: idFromCsv }] 
        });
      } else {
        existingAssessment = await AssessmentModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          courseId: courseId,
          programId: programId,
          $or: [
            { batchId: batchId },
            { batchId: { $exists: false }, $expr: { $eq: [batchId, undefined] } }
          ]
        });
      }

      if (existingAssessment) {
        await AssessmentModel.findOneAndUpdate(
          { _id: existingAssessment._id },
          { ...assessmentDataFromCsv, updatedAt: now }
        );
        updatedCount++;
      } else {
        const duplicate = await AssessmentModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          courseId: courseId,
          programId: programId,
          $or: [
            { batchId: batchId },
            { batchId: { $exists: false }, $expr: { $eq: [batchId, undefined] } }
          ]
        });
        
        if (duplicate) {
            importErrors.push({ row: rowIndex, message: `Assessment with name '${name}' already exists for this course/program/batch.`, data: row });
            skippedCount++; continue;
        }
        
        const newAssessment = new AssessmentModel({
          id: idFromCsv || generateIdForImport(),
          ...assessmentDataFromCsv,
          createdAt: now,
          updatedAt: now,
        });
        
        await newAssessment.save();
        newCount++;
      }
    }

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Assessments import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); 
    }
    return NextResponse.json({ message: 'Assessments imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during assessment import process:', error);
    return NextResponse.json({ message: 'Critical error during assessment import process. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
