
import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, FacultyStatus, JobType, Gender, SystemUser } from '@/types/entities';
import { parse } from 'papaparse';
import { userService } from '@/lib/api/users';

// In-memory store (replace with DB)
let facultyStore: Faculty[] = (global as any).__API_FACULTY_STORE__ || [];
if (!(global as any).__API_FACULTY_STORE__) {
  (global as any).__API_FACULTY_STORE__ = facultyStore;
}

const generateIdForImport = (): string => `fac_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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

const JOB_TYPE_OPTIONS: JobType[] = ["Regular", "Adhoc", "Contractual", "Visiting", "Other"];
const FACULTY_STATUS_OPTIONS: FacultyStatus[] = ["active", "inactive", "on_leave", "retired", "resigned"];

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
      const staffCode = row.staffcode?.trim();
      const firstName = row.firstname?.trim();
      const lastName = row.lastname?.trim();
      const department = row.department?.trim();
      const statusRaw = row.status?.trim().toLowerCase();
      const status = FACULTY_STATUS_OPTIONS.includes(statusRaw as FacultyStatus) ? statusRaw as FacultyStatus : undefined;

      if (!staffCode || !firstName || !lastName || !department || !status) {
        skippedCount++; continue;
      }
      
      const gtuName = row.gtuname?.trim();
      const parsedFromName = parseGtuFacultyNameFromString(gtuName);

      const facultyData: Omit<Faculty, 'id'> = {
        staffCode,
        gtuName: gtuName || `${row.title || parsedFromName.title || ''} ${firstName} ${row.middlename || parsedFromName.middleName || ''} ${lastName}`.replace(/\s+/g, ' ').trim(),
        title: row.title?.trim() || parsedFromName.title || undefined,
        firstName,
        middleName: row.middlename?.trim() || parsedFromName.middleName || undefined,
        lastName,
        personalEmail: row.personalemail?.trim() || undefined,
        instituteEmail: row.instituteemail?.trim() || generateInstituteEmailForFaculty(firstName, lastName, staffCode),
        contactNumber: row.contactnumber?.trim() || undefined,
        department,
        designation: row.designation?.trim() || undefined,
        jobType: JOB_TYPE_OPTIONS.includes(row.jobtype as JobType) ? row.jobtype as JobType : 'Other',
        instType: row.insttype?.trim() || undefined,
        dateOfBirth: row.dateofbirth?.trim() || undefined,
        gender: row.gender?.trim() as Gender || undefined,
        maritalStatus: row.maritalstatus?.trim() || undefined,
        joiningDate: row.joiningdate?.trim() || undefined,
        status,
        aadharNumber: row.aadharnumber?.trim() || undefined,
        panCardNumber: row.pancardnumber?.trim() || undefined,
        gpfNpsNumber: row.gpfnpfnumber?.trim() || undefined,
        placeOfBirth: row.placeofbirth?.trim() || undefined,
        nationality: row.nationality?.trim() || undefined,
        knownAs: row.knownas?.trim() || undefined,
      };

      const idFromCsv = row.id?.trim();
      let existingFacultyIndex = -1;
      if (idFromCsv) {
        existingFacultyIndex = facultyStore.findIndex(f => f.id === idFromCsv);
      } else {
        existingFacultyIndex = facultyStore.findIndex(f => f.staffCode === staffCode);
      }

      if (existingFacultyIndex !== -1) {
        facultyStore[existingFacultyIndex] = { ...facultyStore[existingFacultyIndex], ...facultyData };
        updatedCount++;
         const linkedUser = await userService.getAllUsers().then(users => users.find(u => u.email === facultyStore[existingFacultyIndex].instituteEmail));
        if(linkedUser) {
            await userService.updateUser(linkedUser.id, { name: facultyData.name || facultyData.staffCode, department: facultyData.department, status: facultyData.status === 'active' ? 'active' : 'inactive' });
        }
      } else {
        const newFaculty: Faculty = { id: idFromCsv || generateIdForImport(), ...facultyData };
        facultyStore.push(newFaculty);
        newCount++;
        const systemUserName = newFaculty.gtuName || `${newFaculty.firstName || ''} ${newFaculty.lastName || ''}`.trim() || newFaculty.staffCode;
        try {
            await userService.createUser({
                name: systemUserName,
                email: newFaculty.instituteEmail,
                password: newFaculty.staffCode, // Default password
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
    return NextResponse.json({ message: 'Faculty imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing faculty:', error);
    return NextResponse.json({ message: 'Error importing faculty.', error: (error as Error).message }, { status: 500 });
  }
}
