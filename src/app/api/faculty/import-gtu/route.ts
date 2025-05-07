
import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, FacultyStatus, JobType, Gender, User, Institute } from '@/types/entities'; // Updated User import
import { parse, type ParseError } from 'papaparse';
import { userService } from '@/lib/api/users';
import { instituteService } from '@/lib/api/institutes';

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

const generateInstituteEmailForFaculty = (firstName?: string, lastName?: string, instituteDomain: string = "gppalanpur.ac.in"): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) return `${fn}.${ln}@${instituteDomain}`;
  return `faculty_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2,5)}@${instituteDomain}`;
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
    const defaultInstituteId = formData.get('instituteId') as string | null; // For new users if institute not in CSV

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''),
      dynamicTyping: false,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Faculty GTU Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Faculty (GTU) CSV file.', errors: errorMessages }, { status: 400 });
    }

    let newCount = 0, updatedCount = 0, skippedCount = 0;
    const importErrors: { row: number, message: string, data: any }[] = [];


    for (let i=0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2;

      const staffCode = row.staffcode?.toString().trim();
      const gtuName = row.name?.toString().trim();
      const facultyInstituteId = row.instituteid?.toString().trim() || defaultInstituteId; // GTU CSV might not have instituteId

      if (!staffCode || !gtuName || !facultyInstituteId) {
        importErrors.push({row: rowIndex, message: `Skipping GTU faculty row due to missing staff code, name, or instituteId: ${JSON.stringify(row)}`, data: row});
        skippedCount++; continue;
      }
      
      let instituteDomain = "gppalanpur.ac.in"; // Default
      try {
        const inst = await instituteService.getInstituteById(facultyInstituteId);
        if(inst.domain) instituteDomain = inst.domain;
      } catch (e) { /* use default */ }


      const { title, firstName, middleName, lastName } = parseGtuFacultyNameFromString(gtuName);
      const departmentGTU = row.department?.toString().trim().toUpperCase();
      const department = DEPARTMENT_MAP[departmentGTU || ""] || "Other";
      const designation = row.designation?.toString().trim() || "Lecturer"; 
      
      const jobTypeRaw = row.jobtype?.toString().trim();
      const jobType = JOB_TYPE_OPTIONS.includes(jobTypeRaw as JobType) ? jobTypeRaw as JobType : 'Other';

      const instituteEmail = generateInstituteEmailForFaculty(firstName, lastName, instituteDomain);


      const facultyData: Omit<Faculty, 'id' | 'userId'> = {
        staffCode, gtuName, title, firstName, middleName, lastName,
        personalEmail: row.emailaddress?.toString().trim() || undefined,
        instituteEmail,
        contactNumber: row.mobileno?.toString().trim() || undefined,
        department, designation, jobType,
        instType: row.insttype?.toString().trim() || undefined,
        status: 'active', // Default for GTU import unless specified
      };

      const existingFacultyIndex = facultyStore.findIndex(f => f.staffCode === staffCode);
      let facultyToProcess: Faculty;

      if (existingFacultyIndex !== -1) {
        facultyToProcess = { ...facultyStore[existingFacultyIndex], ...facultyData };
        facultyStore[existingFacultyIndex] = facultyToProcess;
        updatedCount++;
      } else {
        facultyToProcess = { id: generateIdForImport(), ...facultyData };
        facultyStore.push(facultyToProcess);
        newCount++;
      }

      const userDisplayName = facultyToProcess.gtuName || facultyToProcess.staffCode;
      try {
         const existingUserByEmail = await userService.getAllUsers().then(users => users.find(u => u.instituteEmail === facultyToProcess.instituteEmail || (facultyToProcess.personalEmail && u.email === facultyToProcess.personalEmail)));
        
        const userDataPayload = {
            displayName: userDisplayName,
            email: facultyToProcess.personalEmail || facultyToProcess.instituteEmail,
            instituteEmail: facultyToProcess.instituteEmail,
            isActive: facultyToProcess.status === 'active',
            instituteId: facultyInstituteId,
        };

        if (existingUserByEmail) {
            facultyToProcess.userId = existingUserByEmail.id;
            let rolesToSet = existingUserByEmail.roles.includes('faculty') ? existingUserByEmail.roles : [...existingUserByEmail.roles, 'faculty' as UserRole];
            await userService.updateUser(existingUserByEmail.id, {...userDataPayload, roles: rolesToSet});
        } else {
            const createdUser = await userService.createUser({...userDataPayload, password: facultyToProcess.staffCode, roles: ['faculty']});
            facultyToProcess.userId = createdUser.id;
        }
        const finalFacultyIndex = facultyStore.findIndex(f => f.id === facultyToProcess.id);
        if (finalFacultyIndex !== -1) {
            facultyStore[finalFacultyIndex].userId = facultyToProcess.userId;
        }

      } catch(userError: any) {
         importErrors.push({row: rowIndex, message: `User account linking/creation failed for ${staffCode}: ${userError.message}`, data: row});
      }
    }
    (global as any).__API_FACULTY_STORE__ = facultyStore;

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `GTU Faculty import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 });
    }

    return NextResponse.json({ message: 'GTU Faculty imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing GTU faculty:', error);
    return NextResponse.json({ message: 'Error importing GTU faculty.', error: (error as Error).message }, { status: 500 });
  }
}
