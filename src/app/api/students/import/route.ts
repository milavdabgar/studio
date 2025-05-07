
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, SemesterStatus, StudentStatus, SystemUser } from '@/types/entities';
import { parse } from 'papaparse';
import { userService } from '@/lib/api/users';

// In-memory store (replace with DB)
let studentsStore: Student[] = (global as any).__API_STUDENTS_STORE__ || [];
if (!(global as any).__API_STUDENTS_STORE__) {
  (global as any).__API_STUDENTS_STORE__ = studentsStore;
}

const generateIdForImport = (): string => `std_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
    return shift; 
};
const SEMESTER_STATUS_OPTIONS: SemesterStatus[] = ["Passed", "Pending", "Not Appeared", "N/A"];
const STUDENT_STATUS_OPTIONS: StudentStatus[] = ["active", "inactive", "graduated", "dropped"];


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, ''),
    });

    if (parseErrors.length > 0) {
      return NextResponse.json({ message: 'Error parsing CSV file.', errors: parseErrors.map(e => e.message) }, { status: 400 });
    }

    let newCount = 0, updatedCount = 0, skippedCount = 0;

    for (const row of parsedData) {
      const enrollmentNumber = row.enrollmentnumber?.trim();
      const department = row.department?.trim();
      const currentSemesterStr = row.currentsemester?.trim();
      const statusRaw = row.status?.trim().toLowerCase();
      const status = STUDENT_STATUS_OPTIONS.includes(statusRaw as StudentStatus) ? statusRaw as StudentStatus : undefined;
      
      if (!enrollmentNumber || !department || !currentSemesterStr || !status) {
        skippedCount++; continue;
      }
      const currentSemester = parseInt(currentSemesterStr, 10);
      if (isNaN(currentSemester) || currentSemester < 1 || currentSemester > 8) {
        skippedCount++; continue;
      }
      
      const gtuName = row.gtuname?.trim();
      const parsedFromName = parseGtuNameFromString(gtuName);

      const studentData: Omit<Student, 'id'> = {
        enrollmentNumber,
        gtuName: gtuName || undefined,
        firstName: row.firstname?.trim() || parsedFromName.firstName || undefined,
        middleName: row.middlename?.trim() || parsedFromName.middleName || undefined,
        lastName: row.lastname?.trim() || parsedFromName.lastName || undefined,
        personalEmail: row.personalemail?.trim() || undefined,
        instituteEmail: row.instituteemail?.trim() || `${enrollmentNumber}@gppalanpur.in`,
        department,
        branchCode: row.branchcode?.trim() || undefined,
        currentSemester, status,
        contactNumber: row.contactnumber?.trim() || undefined,
        address: row.address?.trim() || undefined,
        dateOfBirth: row.dateofbirth?.trim() || undefined,
        admissionDate: row.admissiondate?.trim() || undefined,
        gender: normalizeGenderFromString(row.gender),
        convocationYear: row.convocationyear ? parseInt(row.convocationyear, 10) : undefined,
        shift: normalizeShiftFromString(row.shift),
        sem1Status: SEMESTER_STATUS_OPTIONS.includes(row.sem1status as SemesterStatus) ? row.sem1status as SemesterStatus : 'N/A',
        sem2Status: SEMESTER_STATUS_OPTIONS.includes(row.sem2status as SemesterStatus) ? row.sem2status as SemesterStatus : 'N/A',
        sem3Status: SEMESTER_STATUS_OPTIONS.includes(row.sem3status as SemesterStatus) ? row.sem3status as SemesterStatus : 'N/A',
        sem4Status: SEMESTER_STATUS_OPTIONS.includes(row.sem4status as SemesterStatus) ? row.sem4status as SemesterStatus : 'N/A',
        sem5Status: SEMESTER_STATUS_OPTIONS.includes(row.sem5status as SemesterStatus) ? row.sem5status as SemesterStatus : 'N/A',
        sem6Status: SEMESTER_STATUS_OPTIONS.includes(row.sem6status as SemesterStatus) ? row.sem6status as SemesterStatus : 'N/A',
        sem7Status: SEMESTER_STATUS_OPTIONS.includes(row.sem7status as SemesterStatus) ? row.sem7status as SemesterStatus : 'N/A',
        sem8Status: SEMESTER_STATUS_OPTIONS.includes(row.sem8status as SemesterStatus) ? row.sem8status as SemesterStatus : 'N/A',
        category: row.category?.trim() || undefined,
        isComplete: row.iscomplete?.toLowerCase() === 'true',
        termClose: row.termclose?.toLowerCase() === 'true',
        isCancel: row.iscancel?.toLowerCase() === 'true',
        isPassAll: row.ispassall?.toLowerCase() === 'true',
        aadharNumber: row.aadharnumber?.trim() || undefined,
      };
      
      const idFromCsv = row.id?.trim();
      let existingStudentIndex = -1;
      if (idFromCsv) {
        existingStudentIndex = studentsStore.findIndex(s => s.id === idFromCsv);
      } else {
        existingStudentIndex = studentsStore.findIndex(s => s.enrollmentNumber === enrollmentNumber);
      }

      if (existingStudentIndex !== -1) {
        studentsStore[existingStudentIndex] = { ...studentsStore[existingStudentIndex], ...studentData };
        updatedCount++;
        const linkedUser = await userService.getAllUsers().then(users => users.find(u => u.email === studentsStore[existingStudentIndex].instituteEmail));
        if(linkedUser) {
            await userService.updateUser(linkedUser.id, { name: studentData.name || studentData.enrollmentNumber, department: studentData.department, status: studentData.status === 'active' ? 'active' : 'inactive' });
        }
      } else {
        const newStudent: Student = { id: idFromCsv || generateIdForImport(), ...studentData };
        studentsStore.push(newStudent);
        newCount++;
        const systemUserName = newStudent.gtuName || `${newStudent.firstName || ''} ${newStudent.lastName || ''}`.trim() || newStudent.enrollmentNumber;
        try {
            await userService.createUser({
                name: systemUserName,
                email: newStudent.instituteEmail,
                password: newStudent.enrollmentNumber, // Default password
                roles: ['student'],
                status: 'active',
                department: newStudent.department
            });
        } catch(userCreationError: any) {
             if (userCreationError.message?.includes("already exists")) {
                console.warn(`System user with email ${newStudent.instituteEmail} already exists. Linking student ${newStudent.enrollmentNumber} to existing user.`);
             } else {
                console.error(`Failed to create system user for student ${newStudent.enrollmentNumber}:`, userCreationError);
             }
        }
      }
    }
    (global as any).__API_STUDENTS_STORE__ = studentsStore;
    return NextResponse.json({ message: 'Students imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing students:', error);
    return NextResponse.json({ message: 'Error importing students.', error: (error as Error).message }, { status: 500 });
  }
}
