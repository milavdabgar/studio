
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, SemesterStatus, User, Program, Institute } from '@/types/entities'; // Updated User import
import { parse, type ParseError } from 'papaparse';
import { userService } from '@/lib/api/users';
import { programService } from '@/lib/api/programs'; // To find program by code
import { departmentService } from '@/lib/api/departments'; // To find department by code to link to program
import { instituteService } from '@/lib/api/institutes'; // To get institute domain


const studentsStore: Student[] = (global as any).__API_STUDENTS_STORE__ || [];
if (!(global as any).__API_STUDENTS_STORE__) {
  (global as any).__API_STUDENTS_STORE__ = studentsStore;
}

const generateIdForImport = (): string => `std_gtu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const parseGtuNameFromString = (gtuName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuName) return {};
    const parts = gtuName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] }; 
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

const mapSemesterCodeToStatusFromString = (code: string | undefined | null): SemesterStatus => {
    if (!code) return 'N/A';
    const codeStr = String(code).trim();
    if (codeStr === '2') return 'Passed';
    if (codeStr === '1') return 'Pending';
    if (codeStr === '') return 'Not Appeared'; 
    return 'N/A'; 
};

const normalizeGenderFromString = (gender: string | undefined): Student['gender'] | undefined => {
    if (!gender) return undefined;
    const lowerGender = String(gender).toLowerCase().trim();
    if (lowerGender.startsWith('m')) return 'Male';
    if (lowerGender.startsWith('f')) return 'Female';
    if (lowerGender.startsWith('o')) return 'Other';
    return undefined;
};
const normalizeShiftFromString = (shift: string | undefined): Student['shift'] | undefined => {
    if (!shift) return undefined;
    const lowerShift = String(shift).toLowerCase().trim();
    if (lowerShift.startsWith('m')) return 'Morning';
    if (lowerShift.startsWith('a')) return 'Afternoon';
    return shift as Student['shift'];
};

const DEPARTMENT_CODE_TO_NAME_MAP: { [key: string]: string } = {
  "CE": "Computer Engineering", "07": "Computer Engineering",
  "ME": "Mechanical Engineering", "19": "Mechanical Engineering",
  "EE": "Electrical Engineering", "09": "Electrical Engineering",
  "CV": "Civil Engineering", "06": "Civil Engineering", // Assuming CV for Civil
  "EC": "Electronics & Communication Engineering", "11": "Electronics & Communication Engineering",
  "IT": "Information Technology", "16": "Information Technology",
  "CH": "Chemical Engineering", "05": "Chemical Engineering",
  "GEN": "General Department", // For subjects like Maths, Physics under General Dept
};


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const programsJson = formData.get('programs') as string | null; // Get client-side programs

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!programsJson) {
        return NextResponse.json({ message: 'Program data for mapping is missing.' }, { status: 400 });
    }
    const clientPrograms: Program[] = JSON.parse(programsJson);


    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''),
      dynamicTyping: false, 
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (GTU Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing GTU CSV file.', errors: errorMessages }, { status: 400 });
    }
    
    let newCount = 0, updatedCount = 0, skippedCount = 0;
    const importErrors: { row: number, message: string, data: unknown }[] = [];


    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2;

      const enrollmentNumber = row.mapnumber?.toString().trim();
      const gtuName = row.name?.toString().trim();
      
      if (!enrollmentNumber || !gtuName) {
        importErrors.push({row: rowIndex, message: `Missing enrollment number or name.`, data: row});
        skippedCount++; continue;
      }

      const { firstName, middleName, lastName } = parseGtuNameFromString(gtuName);
      const branchCode = row.brcode?.toString().trim().toUpperCase();
      // Infer programId and instituteId from branchCode
      const studentProgram = clientPrograms.find(p => p.code === branchCode); // Assuming program code is same as branch code for simplicity
      if (!studentProgram) {
          importErrors.push({row: rowIndex, message: `Program not found for branch code ${branchCode}. Ensure program exists with this code.`, data: row});
          skippedCount++; continue;
      }
      const programId = studentProgram.id;
      const studentInstituteId = studentProgram.instituteId; // Get instituteId from the found program
      const studentDepartment = studentProgram.departmentId; // Department ID from program


      let currentSemester = 1;
      for (let sem = 8; sem >= 1; sem--) {
        const semStatusVal = mapSemesterCodeToStatusFromString(row[`sem${sem}`]?.toString());
        if (semStatusVal === 'Passed') {
            currentSemester = Math.min(sem + 1, 8); break;
        } else if (semStatusVal === 'Pending') {
            currentSemester = sem; break;
        }
      }
      
      const isPassAllStr = String(row.ispassall).toLowerCase();
      const isCompleteStr = String(row.iscomplete).toLowerCase();

      if (isPassAllStr === 'true' || isCompleteStr === 'true'){
        currentSemester = 8; 
      }
      
      const convocationYearStr = String(row.convoyear).trim();
      const convocationYear = convocationYearStr && !isNaN(parseInt(convocationYearStr, 10)) ? parseInt(convocationYearStr, 10) : undefined;
      
      let instituteDomain = "gppalanpur.in"; // Default domain
      if (studentInstituteId) {
          try {
              const inst = await instituteService.getInstituteById(studentInstituteId);
              if (inst.domain) instituteDomain = inst.domain;
          } catch(e) { /* use default */ }
      }
      const instituteEmail = `${enrollmentNumber}@${instituteDomain}`;


      const studentData: Omit<Student, 'id' | 'userId'> = {
        enrollmentNumber, gtuName, firstName, middleName, lastName,
        personalEmail: row.email?.toString().trim() || undefined,
        instituteEmail,
        programId, 
        department: studentDepartment, // This is departmentId
        branchCode, currentSemester,
        status: String(row.iscancel).toLowerCase() === 'true' ? 'dropped' : (isCompleteStr === 'true' || isPassAllStr === 'true' ? 'graduated' : 'active'),
        contactNumber: row.mobile?.toString().trim() || undefined,
        gender: normalizeGenderFromString(row.gender?.toString()),
        convocationYear: convocationYear,
        sem1Status: mapSemesterCodeToStatusFromString(row.sem1?.toString()),
        sem2Status: mapSemesterCodeToStatusFromString(row.sem2?.toString()),
        sem3Status: mapSemesterCodeToStatusFromString(row.sem3?.toString()),
        sem4Status: mapSemesterCodeToStatusFromString(row.sem4?.toString()),
        sem5Status: mapSemesterCodeToStatusFromString(row.sem5?.toString()),
        sem6Status: mapSemesterCodeToStatusFromString(row.sem6?.toString()),
        sem7Status: mapSemesterCodeToStatusFromString(row.sem7?.toString()),
        sem8Status: mapSemesterCodeToStatusFromString(row.sem8?.toString()),
        category: row.category?.toString().trim() || undefined,
        isComplete: isCompleteStr === 'true',
        termClose: String(row.termclose).toLowerCase() === 'true',
        isCancel: String(row.iscancel).toLowerCase() === 'true',
        isPassAll: isPassAllStr === 'true',
        aadharNumber: row.aadhar?.toString().trim() || undefined,
        shift: normalizeShiftFromString(row.shift?.toString()),
      };

      const existingStudentIndex = studentsStore.findIndex(s => s.enrollmentNumber === enrollmentNumber);
      let studentToProcess: Student;

      if (existingStudentIndex !== -1) {
        studentToProcess = { ...studentsStore[existingStudentIndex], ...studentData };
        studentsStore[existingStudentIndex] = studentToProcess;
        updatedCount++;
      } else {
        studentToProcess = { id: generateIdForImport(), ...studentData };
        studentsStore.push(studentToProcess);
        newCount++;
      }

      const userDisplayName = studentToProcess.gtuName || studentToProcess.enrollmentNumber;
      try {
        const existingUserByEmail = await userService.getAllUsers().then(users => users.find(u => u.instituteEmail === studentToProcess.instituteEmail));
        
        const userDataPayload = {
            displayName: userDisplayName,
            email: studentToProcess.personalEmail || studentToProcess.instituteEmail,
            instituteEmail: studentToProcess.instituteEmail,
            isActive: studentToProcess.status === 'active',
            instituteId: studentInstituteId, // Pass student's institute ID
        };

        if (existingUserByEmail) {
            studentToProcess.userId = existingUserByEmail.id;
            const rolesToSet = existingUserByEmail.roles.includes('student') ? existingUserByEmail.roles : [...existingUserByEmail.roles, 'student' as UserRole];
            await userService.updateUser(existingUserByEmail.id, {...userDataPayload, roles: rolesToSet});
        } else {
            const createdUser = await userService.createUser({...userDataPayload, password: studentToProcess.enrollmentNumber, roles: ['student']});
            studentToProcess.userId = createdUser.id;
        }
        const finalStudentIndex = studentsStore.findIndex(s => s.id === studentToProcess.id);
        if (finalStudentIndex !== -1) {
            studentsStore[finalStudentIndex].userId = studentToProcess.userId;
        }

      } catch(userError: unknown) {
        importErrors.push({row: rowIndex, message: `User account linking/creation failed for ${enrollmentNumber}: ${userError.message}`, data: row});
      }
    }
    (global as any).__API_STUDENTS_STORE__ = studentsStore;
    
    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `GTU Students import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 });
    }
    return NextResponse.json({ message: 'GTU Students imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing GTU students:', error);
    return NextResponse.json({ message: 'Error importing GTU students.', error: (error as Error).message }, { status: 500 });
  }
}
