import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, FacultyStatus, JobType, Gender, User, Institute, StaffCategory, UserRole } from '@/types/entities'; 
import { parse, type ParseError } from 'papaparse';
import { userService } from '@/lib/api/users';
import { instituteService } from '@/lib/api/institutes';
import mongoose from 'mongoose';
import { FacultyModel, UserModel } from '@/lib/models';

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
  return `staff_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2,5)}@${instituteDomain}`;
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
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const defaultInstituteIdFromForm = formData.get('instituteId') as string | null; 

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
    const importErrors: { row: number, message: string, data: unknown }[] = [];

    for (let i=0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2;

      const staffCode = row.staffcode?.toString().trim();
      const gtuName = row.name?.toString().trim();
      const facultyInstituteId = defaultInstituteIdFromForm || "inst1"; // GTU CSV might not have instituteId, use default or one from form

      if (!staffCode || !gtuName ) { // facultyInstituteId is now defaulted
        importErrors.push({row: rowIndex, message: `Skipping GTU faculty row due to missing staff code or name: ${JSON.stringify(row)}`, data: row});
        skippedCount++; continue;
      }
      
      let instituteDomain = "gppalanpur.ac.in"; // Default
      try {
        const inst = await instituteService.getInstituteById(facultyInstituteId);
        if(inst.domain) instituteDomain = inst.domain;
      } catch { /* use default */ }

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
        staffCategory: 'Teaching', // Assume GTU data is for teaching staff
        instType: row.insttype?.toString().trim() || undefined,
        status: 'active', 
        instituteId: facultyInstituteId,
      };

      // Find existing faculty in MongoDB
      const existingFaculty = await FacultyModel.findOne({ staffCode });
      let facultyToProcess: Faculty;

      if (existingFaculty) {
        // Update existing faculty
        Object.assign(existingFaculty, facultyData);
        facultyToProcess = (await existingFaculty.save()).toJSON() as Faculty;
        updatedCount++;
      } else {
        // Create new faculty
        const newFacultyData = { id: generateIdForImport(), ...facultyData };
        const newFaculty = new FacultyModel(newFacultyData);
        facultyToProcess = (await newFaculty.save()).toJSON() as Faculty;
        newCount++;
      }

      const userDisplayName = facultyToProcess.gtuName || facultyToProcess.staffCode;
      try {
        const existingUserByEmail = await UserModel.findOne({
          $or: [
            { instituteEmail: facultyToProcess.instituteEmail },
            ...(facultyToProcess.personalEmail ? [{ email: facultyToProcess.personalEmail }] : [])
          ]
        });
        
        const userBaseRole: UserRole = 'faculty'; // GTU import always for faculty
        
        const userDataPayload = {
            displayName: userDisplayName,
            email: facultyToProcess.personalEmail || facultyToProcess.instituteEmail,
            instituteEmail: facultyToProcess.instituteEmail,
            isActive: facultyToProcess.status === 'active',
            instituteId: facultyInstituteId,
            currentRole: userBaseRole,
        };

        if (existingUserByEmail) {
            facultyToProcess.userId = existingUserByEmail.id;
            const rolesToSet = existingUserByEmail.roles.includes(userBaseRole) ? existingUserByEmail.roles : [...existingUserByEmail.roles, userBaseRole];
            Object.assign(existingUserByEmail, {...userDataPayload, roles: rolesToSet});
            await existingUserByEmail.save();
        } else {
            const newUser = new UserModel({...userDataPayload, password: facultyToProcess.staffCode, roles: [userBaseRole]});
            const createdUser = await newUser.save();
            facultyToProcess.userId = createdUser.id;
        }
        
        // Update faculty with userId
        await FacultyModel.findByIdAndUpdate(facultyToProcess.id, { userId: facultyToProcess.userId });

      } catch(userError: unknown) {
        const error = userError as Error;
         importErrors.push({row: rowIndex, message: `User account linking/creation failed for ${staffCode}: ${error.message}`, data: row});
      }
    }

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

