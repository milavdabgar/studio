
import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, FacultyStatus, JobType, Gender, SystemUser } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { userService } from '@/lib/api/users';

// In-memory store (replace with DB)
let facultyStore: Faculty[] = (global as any).__API_FACULTY_STORE__ || [];
if (!(global as any).__API_FACULTY_STORE__) {
  (global as any).__API_FACULTY_STORE__ = facultyStore;
}

const generateIdForImport = (): string => `fac_gtu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const parseGtuFacultyNameFromString = (gtuNameInput: string | undefined): { title?: string, firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuNameInput) return {};
    let gtuName = gtuNameInput.trim();
    let title: string | undefined;
    const titles = ["Dr. Prof.", "Dr.", "Prof.", "Mr.", "Ms.", "Mrs."];
    for (const t of titles) {
      const tLower = t.toLowerCase();
      if (gtuName.toLowerCase().startsWith(tLower + " ") || (t.endsWith(".") && gtuName.toLowerCase().startsWith(tLower))) {
        title = gtuName.substring(0, t.length);
        gtuName = gtuName.substring(t.length).trim();
        if (gtuName.startsWith(".")) gtuName = gtuName.substring(1).trim();
        break;
      }
    }
    const parts = gtuName.split(/\s+/).filter(p => p);
    if (parts.length === 0) return { title };
    if (parts.length === 1) return { title, firstName: parts[0], lastName: 'SURNAME' };
    if (parts.length === 2) return { title, lastName: parts[0], firstName: parts[1] };
    return { title, lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
};

const generateInstituteEmailForFaculty = (firstName?: string, lastName?: string, staffCode?: string): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) return `${fn}.${ln}@gppalanpur.ac.in`;
  if (staffCode) return `${staffCode.toLowerCase()}@gppalanpur.ac.in`;
  return `faculty_${Date.now()}@gppalanpur.ac.in`;
};

const DEPARTMENT_MAP: { [key: string]: string } = {
    "CIVIL ENGINEERING": "Civil Engineering",
    "GENERAL DEPARTMENT": "General Department",
    "ELECTRONICS AND COMMUNICATION ENGINEERING": "Electronics & Communication Engineering",
    "COMPUTER ENGINEERING": "Computer Engineering",
    "MECHANICAL ENGINEERING": "Mechanical Engineering",
    "ELECTRICAL ENGINEERING": "Electrical Engineering",
    "APPLIED MECHANICS": "Applied Mechanics",
};

const JOB_TYPE_OPTIONS: JobType[] = ["Regular", "Adhoc", "Contractual", "Visiting", "Other"];

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
      dynamicTyping: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Faculty GTU Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Faculty (GTU) CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }

    let newCount = 0, updatedCount = 0, skippedCount = 0;

    for (const row of parsedData) {
      const staffCode = row.staffcode?.toString().trim();
      const gtuName = row.name?.toString().trim();
      
      if (!staffCode || !gtuName) {
        console.warn(`Skipping GTU faculty row due to missing staff code or name: ${JSON.stringify(row)}`);
        skippedCount++; continue;
      }

      const { title, firstName, middleName, lastName } = parseGtuFacultyNameFromString(gtuName);
      const departmentGTU = row.department?.toString().trim().toUpperCase();
      const department = DEPARTMENT_MAP[departmentGTU || ""] || "Other";
      const designation = row.designation?.toString().trim() || "Lecturer"; 
      
      const jobTypeRaw = row.jobtype?.toString().trim();
      const jobType = JOB_TYPE_OPTIONS.includes(jobTypeRaw as JobType) ? jobTypeRaw as JobType : 'Other';


      const facultyData: Omit<Faculty, 'id'> = {
        staffCode,
        gtuName,
        title, firstName, middleName, lastName,
        personalEmail: row.emailaddress?.toString().trim() || undefined,
        instituteEmail: generateInstituteEmailForFaculty(firstName, lastName, staffCode),
        contactNumber: row.mobileno?.toString().trim() || undefined,
        department,
        designation,
        jobType,
        instType: row.insttype?.toString().trim() || undefined,
        status: 'active', 
      };

      const existingFacultyIndex = facultyStore.findIndex(f => f.staffCode === staffCode);
      if (existingFacultyIndex !== -1) {
        facultyStore[existingFacultyIndex] = { ...facultyStore[existingFacultyIndex], ...facultyData };
        updatedCount++;
        const linkedUser = await userService.getAllUsers().then(users => users.find(u => u.email === facultyStore[existingFacultyIndex].instituteEmail));
        if(linkedUser) {
            await userService.updateUser(linkedUser.id, { name: facultyData.gtuName || facultyData.staffCode, department: facultyData.department, status: facultyData.status === 'active' ? 'active' : 'inactive' });
        }

      } else {
        const newFaculty: Faculty = { id: generateIdForImport(), ...facultyData };
        facultyStore.push(newFaculty);
        newCount++;
        const systemUserName = newFaculty.gtuName || `${newFaculty.firstName || ''} ${newFaculty.lastName || ''}`.trim() || newFaculty.staffCode;
        try {
            await userService.createUser({
                name: systemUserName,
                email: newFaculty.instituteEmail,
                password: newFaculty.staffCode, 
                roles: ['faculty'],
                status: 'active',
                department: newFaculty.department
            });
        } catch(userCreationError: any) {
             if (userCreationError.message?.includes("already exists")) {
                console.warn(`System user with email ${newFaculty.instituteEmail} already exists. Linking faculty ${newFaculty.staffCode} to existing user.`);
             } else {
                console.error(`Failed to create system user for faculty ${newFaculty.staffCode}:`, userCreationError);
             }
        }
      }
    }
    (global as any).__API_FACULTY_STORE__ = facultyStore;
    return NextResponse.json({ message: 'GTU Faculty imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing GTU faculty:', error);
    return NextResponse.json({ message: 'Error importing GTU faculty.', error: (error as Error).message }, { status: 500 });
  }
}
