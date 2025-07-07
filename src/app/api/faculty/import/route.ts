import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, FacultyStatus, JobType, Gender, StaffCategory, UserRole } from '@/types/entities'; 
import { parse, type ParseError } from 'papaparse';
import { instituteService } from '@/lib/api/institutes'; 
import mongoose from 'mongoose';
import { FacultyModel, UserModel } from '@/lib/models';

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

const generateInstituteEmailForFaculty = (firstName?: string, lastName?: string, instituteDomain: string = "gppalanpur.ac.in"): string => {
  const fn = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const ln = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fn && ln) return `${fn}.${ln}@${instituteDomain}`;
  return `staff_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2,5)}@${instituteDomain}`;
};

const JOB_TYPE_OPTIONS: JobType[] = ["Regular", "Adhoc", "Contractual", "Visiting", "Other"];
const FACULTY_STATUS_OPTIONS: FacultyStatus[] = ["active", "inactive", "on_leave", "retired", "resigned"];
const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Other"];
const STAFF_CATEGORY_OPTIONS_LOWER: string[] = ['teaching', 'clerical', 'technical', 'support', 'administrative', 'other'];


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
    const { data: parsedData, errors: parseErrors } = parse<Record<string, string>>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''),
      dynamicTyping: false, 
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Faculty Standard Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Faculty (Standard) CSV file.', errors: errorMessages }, { status: 400 });
    }

    let newCount = 0, updatedCount = 0, skippedCount = 0;
    const importErrors: { row: number, message: string, data: unknown }[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2;

      const staffCode = row.staffcode?.toString().trim();
      const firstName = row.firstname?.toString().trim();
      const lastName = row.lastname?.toString().trim();
      const department = row.department?.toString().trim();
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = FACULTY_STATUS_OPTIONS.includes(statusRaw as FacultyStatus) ? statusRaw as FacultyStatus : undefined;
      const staffCategoryRaw = row.staffcategory?.toString().trim().toLowerCase();
      const staffCategory = STAFF_CATEGORY_OPTIONS_LOWER.includes(staffCategoryRaw) ? staffCategoryRaw as StaffCategory : 'Teaching';

      const personalEmailFromCSV = row.personalemail?.toString().trim() || undefined;
      const instituteEmailFromCSV = row.instituteemail?.toString().trim() || undefined;
      const facultyInstituteId = row.instituteid?.toString().trim() || defaultInstituteIdFromForm || undefined;


      if (!staffCode || !firstName || !lastName || !department || !status || !facultyInstituteId) {
        importErrors.push({row: rowIndex, message: "Missing required fields: staffCode, firstName, lastName, department, status, or instituteId.", data: row});
        skippedCount++; continue;
      }
      
      let instituteDomain = "gppalanpur.ac.in"; // Default
      try {
        const inst = await instituteService.getInstituteById(facultyInstituteId);
        if(inst.domain) instituteDomain = inst.domain;
      } catch { /* use default */ }

      const instituteEmail = instituteEmailFromCSV || generateInstituteEmailForFaculty(firstName, lastName, instituteDomain);

      const gtuName = row.gtuname?.toString().trim();
      const parsedFromName = parseGtuFacultyNameFromString(gtuName);

      const facultyData: Omit<Faculty, 'id' | 'userId'> = {
        staffCode,
        gtuName: gtuName || `${row.title || parsedFromName.title || ''} ${firstName} ${row.middlename?.toString().trim() || parsedFromName.middleName || ''} ${lastName}`.replace(/\s+/g, ' ').trim(),
        title: row.title?.toString().trim() || parsedFromName.title || undefined,
        firstName,
        middleName: row.middlename?.toString().trim() || parsedFromName.middleName || undefined,
        lastName,
        personalEmail: personalEmailFromCSV,
        instituteEmail,
        contactNumber: row.contactnumber?.toString().trim() || undefined,
        department,
        designation: row.designation?.toString().trim() || undefined,
        jobType: JOB_TYPE_OPTIONS.includes(row.jobtype?.toString() as JobType) ? row.jobtype as JobType : 'Other',
        staffCategory,
        instType: row.insttype?.toString().trim() || undefined,
        dateOfBirth: row.dateofbirth?.toString().trim() || undefined,
        gender: GENDER_OPTIONS.includes(row.gender?.toString() as Gender) ? row.gender as Gender : undefined,
        maritalStatus: row.maritalstatus?.toString().trim() || undefined,
        joiningDate: row.joiningdate?.toString().trim() || undefined,
        status,
        aadharNumber: row.aadharnumber?.toString().trim() || undefined,
        panCardNumber: row.pancardnumber?.toString().trim() || undefined,
        gpfNpsNumber: row.gpfnpfnumber?.toString().trim() || row.gpfnpsnumber?.toString().trim() || undefined,
        placeOfBirth: row.placeofbirth?.toString().trim() || undefined,
        nationality: row.nationality?.toString().trim() || undefined,
        knownAs: row.knownas?.toString().trim() || undefined,
        instituteId: facultyInstituteId,
      };

      const idFromCsv = row.id?.toString().trim();
      
      // Find existing faculty in MongoDB
      let existingFaculty = null;
      if (idFromCsv) {
        existingFaculty = await FacultyModel.findOne({ $or: [{ id: idFromCsv }, { staffCode }] });
      } else {
        existingFaculty = await FacultyModel.findOne({ staffCode });
      }

      let facultyToProcess: Faculty;

      if (existingFaculty) {
        // Update existing faculty
        Object.assign(existingFaculty, facultyData);
        existingFaculty.staffCategory = facultyData.staffCategory || existingFaculty.staffCategory || 'Teaching';
        facultyToProcess = (await existingFaculty.save()).toJSON() as Faculty;
        updatedCount++;
      } else {
        // Create new faculty
        const newFacultyData = { 
          id: idFromCsv || generateIdForImport(), 
          ...facultyData, 
          staffCategory: facultyData.staffCategory || 'Teaching' 
        };
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
        
        const userBaseRole: UserRole = facultyToProcess.staffCategory === 'Teaching' ? 'faculty' : (facultyToProcess.staffCategory?.toLowerCase() + '_staff' as UserRole) || 'faculty';
        
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
            Object.assign(existingUserByEmail, {...userDataPayload, roles: rolesToSet });
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
            message: `Faculty import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 });
    }
    return NextResponse.json({ message: 'Faculty imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });
  } catch (error) {
    console.error('Error importing faculty:', error);
    return NextResponse.json({ message: 'Error importing faculty.', error: (error as Error).message }, { status: 500 });
  }
}

