
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, SemesterStatus, SystemUser } from '@/types/entities';
import { parse } from 'papaparse';
import { userService } from '@/lib/api/users';

// In-memory store (replace with DB)
let studentsStore: Student[] = (global as any).__API_STUDENTS_STORE__ || [];
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
    if (code === '2') return 'Passed';
    if (code === '1') return 'Pending';
    if (code === '' || code === undefined || code === null) return 'Not Appeared';
    return 'N/A';
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

const DEPARTMENT_OPTIONS_MAP: { [key: string]: string } = {
  "CE": "Computer Engineering",
  "ME": "Mechanical Engineering",
  "EE": "Electrical Engineering",
  "CIVIL": "Civil Engineering",
  "EC": "Electronics & Communication Engineering",
  // Add more mappings as needed
};


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
      return NextResponse.json({ message: 'Error parsing GTU CSV file.', errors: parseErrors.map(e => e.message) }, { status: 400 });
    }
    
    let newCount = 0, updatedCount = 0, skippedCount = 0;

    for (const row of parsedData) {
      const enrollmentNumber = row.mapnumber?.trim();
      const gtuName = row.name?.trim();
      
      if (!enrollmentNumber || !gtuName) {
        skippedCount++; continue;
      }

      const { firstName, middleName, lastName } = parseGtuNameFromString(gtuName);
      const branchCode = row.brcode?.trim().toUpperCase();
      const department = DEPARTMENT_OPTIONS_MAP[branchCode || ""] || "General";

      let currentSemester = 1;
      for (let sem = 8; sem >= 1; sem--) {
        if (mapSemesterCodeToStatusFromString(row[`sem${sem}`]) === 'Passed') {
            currentSemester = Math.min(sem + 1, 8); break;
        } else if (mapSemesterCodeToStatusFromString(row[`sem${sem}`]) === 'Pending') {
            currentSemester = sem; break;
        }
      }
      if (row.ispassall?.toLowerCase() === 'true' || row.iscomplete?.toLowerCase() === 'true'){
        currentSemester = 8; 
      }

      const studentData: Omit<Student, 'id'> = {
        enrollmentNumber, gtuName, firstName, middleName, lastName,
        personalEmail: row.email?.trim() || undefined,
        instituteEmail: `${enrollmentNumber}@gppalanpur.in`,
        department, branchCode, currentSemester,
        status: row.iscancel?.toLowerCase() === 'true' ? 'dropped' : (row.iscomplete?.toLowerCase() === 'true' || row.ispassall?.toLowerCase() === 'true' ? 'graduated' : 'active'),
        contactNumber: row.mobile?.trim() || undefined,
        gender: normalizeGenderFromString(row.gender),
        convocationYear: row.convoyear ? parseInt(row.convoyear, 10) : undefined,
        sem1Status: mapSemesterCodeToStatusFromString(row.sem1),
        sem2Status: mapSemesterCodeToStatusFromString(row.sem2),
        sem3Status: mapSemesterCodeToStatusFromString(row.sem3),
        sem4Status: mapSemesterCodeToStatusFromString(row.sem4),
        sem5Status: mapSemesterCodeToStatusFromString(row.sem5),
        sem6Status: mapSemesterCodeToStatusFromString(row.sem6),
        sem7Status: mapSemesterCodeToStatusFromString(row.sem7),
        sem8Status: mapSemesterCodeToStatusFromString(row.sem8),
        category: row.category?.trim() || undefined,
        isComplete: row.iscomplete?.toLowerCase() === 'true',
        termClose: row.termclose?.toLowerCase() === 'true',
        isCancel: row.iscancel?.toLowerCase() === 'true',
        isPassAll: row.ispassall?.toLowerCase() === 'true',
        aadharNumber: row.aadhar?.trim() || undefined,
        shift: normalizeShiftFromString(row.shift),
      };

      const existingStudentIndex = studentsStore.findIndex(s => s.enrollmentNumber === enrollmentNumber);
      if (existingStudentIndex !== -1) {
        studentsStore[existingStudentIndex] = { ...studentsStore[existingStudentIndex], ...studentData };
        updatedCount++;
        // Optionally update linked user
        const linkedUser = await userService.getAllUsers().then(users => users.find(u => u.email === studentsStore[existingStudentIndex].instituteEmail));
        if(linkedUser) {
            await userService.updateUser(linkedUser.id, { name: studentData.name || studentData.enrollmentNumber, department: studentData.department, status: studentData.status === 'active' ? 'active' : 'inactive' });
        }
      } else {
        const newStudent: Student = { id: generateIdForImport(), ...studentData };
        studentsStore.push(newStudent);
        newCount++;
        // Create linked system user
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
    return NextResponse.json({ message: 'GTU Students imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing GTU students:', error);
    return NextResponse.json({ message: 'Error importing GTU students.', error: (error as Error).message }, { status: 500 });
  }
}
