
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, SemesterStatus, StudentStatus, Program } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import mongoose from 'mongoose';
import { StudentModel, UserModel } from '@/lib/models';



const parseGtuNameFromString = (gtuName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuName) return {};
    const parts = gtuName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

const normalizeGenderFromString = (gender: string | undefined): Student['gender'] | undefined => {
    if (!gender) return undefined;
    const lowerGender = gender.toLowerCase();
    if (lowerGender.startsWith('m')) return 'Male';
    if (lowerGender.startsWith('f')) return 'Female';
    if (lowerGender.startsWith('o')) return 'Other';
    return undefined;
};
const normalizeShiftFromString = (shift: string | undefined): Student['shift'] | undefined => {
    if (!shift) return undefined;
    const lowerShift = shift.toLowerCase();
    if (lowerShift.startsWith('m')) return 'Morning';
    if (lowerShift.startsWith('a')) return 'Afternoon';
    return shift as Student['shift']; 
};
const SEMESTER_STATUS_OPTIONS: SemesterStatus[] = ["Passed", "Pending", "Not Appeared", "N/A"];
const STUDENT_STATUS_OPTIONS: StudentStatus[] = ["active", "inactive", "graduated", "dropped"];


export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    // SECURITY FIX: Validate Content-Type for file uploads
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        message: 'Invalid Content-Type. Expected multipart/form-data for file upload.' 
      }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const programsJson = formData.get('programs') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!programsJson) {
        return NextResponse.json({ message: 'Program data for mapping is missing.' }, { status: 400 });
    }
    const clientPrograms: Program[] = JSON.parse(programsJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<Record<string, unknown>>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''),
      dynamicTyping: false,
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing CSV file.', errors: errorMessages }, { status: 400 });
    }

    let newCount = 0, updatedCount = 0, skippedCount = 0;
    const importErrors: { row: number, message: string, data: unknown }[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2;

      const enrollmentNumber = row.enrollmentnumber?.toString().trim();
      // department is now derived from program. programId is needed.
      const programIdFromCsv = row.programid?.toString().trim();
      const programCodeFromCsv = row.programcode?.toString().trim().toUpperCase();

      const currentSemesterStr = row.currentsemester?.toString().trim();
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = STUDENT_STATUS_OPTIONS.includes(statusRaw as StudentStatus) ? statusRaw as StudentStatus : undefined;
      
      if (!enrollmentNumber || (!programIdFromCsv && !programCodeFromCsv) || !currentSemesterStr || !status) {
        importErrors.push({row: rowIndex, message: "Missing required fields: enrollmentNumber, programId/programCode, currentSemester, or status.", data: row});
        skippedCount++; continue;
      }
      const currentSemester = parseInt(currentSemesterStr, 10);
      if (isNaN(currentSemester) || currentSemester < 1 || currentSemester > 8) { // Assuming max 8 semesters
        importErrors.push({row: rowIndex, message: "Invalid current semester value.", data: row});
        skippedCount++; continue;
      }

      let programId = programIdFromCsv;
      let studentProgram: Program | undefined;

      if (programId) {
        studentProgram = clientPrograms.find(p => p.id === programId);
      } else if (programCodeFromCsv) {
        studentProgram = clientPrograms.find(p => p.code.toUpperCase() === programCodeFromCsv);
      }

      if (!studentProgram) {
        importErrors.push({row: rowIndex, message: `Program not found for ID '${programIdFromCsv}' or Code '${programCodeFromCsv}'.`, data: row});
        skippedCount++; continue;
      }
      programId = studentProgram.id;
      const studentDepartmentId = studentProgram.departmentId; // For User model, if needed, or department can be derived.
      // The Student model now has programId, department is derived via program.

      const gtuName = row.gtuname?.toString().trim();
      const parsedFromName = parseGtuNameFromString(gtuName);

      const studentData: Omit<Student, 'id' | 'userId'> = {
        enrollmentNumber,
        fullNameGtuFormat: gtuName || undefined,
        firstName: row.firstname?.toString().trim() || parsedFromName.firstName || undefined,
        middleName: row.middlename?.toString().trim() || parsedFromName.middleName || undefined,
        lastName: row.lastname?.toString().trim() || parsedFromName.lastName || undefined,
        personalEmail: row.personalemail?.toString().trim() || undefined,
        instituteEmail: row.instituteemail?.toString().trim() || `${enrollmentNumber}@gppalanpur.in`, // Default, should be derived based on institute
        programId: programId!, // studentProgram is checked
        department: studentDepartmentId, // Derived from program
        currentSemester, status,
        contactNumber: row.contactnumber?.toString().trim() || undefined,
        address: row.address?.toString().trim() || undefined,
        dateOfBirth: row.dateofbirth?.toString().trim() || undefined,
        admissionDate: row.admissiondate?.toString().trim() || undefined,
        gender: normalizeGenderFromString(row.gender?.toString()),
        convocationYear: row.convocationyear ? parseInt(row.convocationyear.toString(), 10) : undefined,
        shift: normalizeShiftFromString(row.shift?.toString()),
        sem1Status: SEMESTER_STATUS_OPTIONS.includes(row.sem1status as SemesterStatus) ? row.sem1status as SemesterStatus : 'N/A',
        sem2Status: SEMESTER_STATUS_OPTIONS.includes(row.sem2status as SemesterStatus) ? row.sem2status as SemesterStatus : 'N/A',
        sem3Status: SEMESTER_STATUS_OPTIONS.includes(row.sem3status as SemesterStatus) ? row.sem3status as SemesterStatus : 'N/A',
        sem4Status: SEMESTER_STATUS_OPTIONS.includes(row.sem4status as SemesterStatus) ? row.sem4status as SemesterStatus : 'N/A',
        sem5Status: SEMESTER_STATUS_OPTIONS.includes(row.sem5status as SemesterStatus) ? row.sem5status as SemesterStatus : 'N/A',
        sem6Status: SEMESTER_STATUS_OPTIONS.includes(row.sem6status as SemesterStatus) ? row.sem6status as SemesterStatus : 'N/A',
        sem7Status: SEMESTER_STATUS_OPTIONS.includes(row.sem7status as SemesterStatus) ? row.sem7status as SemesterStatus : 'N/A',
        sem8Status: SEMESTER_STATUS_OPTIONS.includes(row.sem8status as SemesterStatus) ? row.sem8status as SemesterStatus : 'N/A',
        category: row.category?.toString().trim() || undefined,
        isComplete: String(row.iscomplete).toLowerCase() === 'true',
        termClose: String(row.termclose).toLowerCase() === 'true',
        isCancel: String(row.iscancel).toLowerCase() === 'true',
        isPassAll: String(row.ispassall).toLowerCase() === 'true',
        aadharNumber: row.aadharnumber?.toString().trim() || undefined,
      };
      
      const idFromCsv = row.id?.toString().trim();
      let existingStudent: Record<string, unknown> | null = null;
      
      // Check for existing student by ID or enrollment number
      if (idFromCsv) {
        existingStudent = await StudentModel.findOne({ 
          $or: [
            { id: idFromCsv },
            { enrollmentNumber }
          ]
        });
      } else {
        existingStudent = await StudentModel.findOne({ enrollmentNumber });
      }

      let studentToProcess: Student;

      if (existingStudent) {
        // Update existing student
        Object.assign(existingStudent, studentData);
        studentToProcess = await (existingStudent as {save: () => Promise<Student>}).save();
        updatedCount++;
      } else {
        // Create new student
        const newStudentData = idFromCsv 
          ? { id: idFromCsv, ...studentData }
          : studentData;
        studentToProcess = await StudentModel.create(newStudentData);
        newCount++;
      }

      // Create or update linked User account
      const userDisplayName = studentToProcess.fullNameGtuFormat || studentToProcess.enrollmentNumber;
      try {
        const existingUser = await UserModel.findOne({ 
          $or: [
            { instituteEmail: studentToProcess.instituteEmail },
            { email: studentToProcess.personalEmail }
          ]
        });
        
        const userDataPayload = {
            displayName: userDisplayName,
            email: studentToProcess.personalEmail || studentToProcess.instituteEmail, // Primary email for User
            instituteEmail: studentToProcess.instituteEmail,
            isActive: studentToProcess.status === 'active',
            instituteId: studentProgram.instituteId, // From program -> department -> institute
            currentRole: 'student' as const,
        };

        if (existingUser) {
            studentToProcess.userId = existingUser.id || existingUser._id.toString();
            const rolesToSet = existingUser.roles.includes('student') ? existingUser.roles : [...existingUser.roles, 'student'];
            Object.assign(existingUser, {...userDataPayload, roles: rolesToSet});
            await existingUser.save();
        } else {
            const createdUser = await UserModel.create({
              ...userDataPayload, 
              password: studentToProcess.enrollmentNumber, 
              roles: ['student']
            });
            studentToProcess.userId = createdUser.id || createdUser._id.toString();
        }
        
        // Update student with userId
        await StudentModel.findOneAndUpdate(
          { $or: [{ id: studentToProcess.id }, { _id: (studentToProcess as unknown as Record<string, unknown>)._id }] },
          { userId: studentToProcess.userId }
        );

      } catch(userError: unknown) {
        const error = userError as Error;
        importErrors.push({row:rowIndex, message: `User account linking/creation failed for ${enrollmentNumber}: ${error.message}`, data: row});
      }
    }
    
    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Students import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 });
    }
    return NextResponse.json({ message: 'Students imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing students:', error);
    return NextResponse.json({ message: 'Error importing students.' }, { status: 500 });
  }
}
