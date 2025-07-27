
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, SemesterStatus, Program, UserRole } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { instituteService } from '@/lib/api/institutes';
import mongoose from 'mongoose';
import { StudentModel, UserModel } from '@/lib/models';


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
    if (lowerShift.startsWith('e')) return 'Evening';
    // Handle numeric codes: 1 = Morning, 2 = Afternoon, 3 = Evening
    if (lowerShift === '1') return 'Morning';
    if (lowerShift === '2') return 'Afternoon';
    if (lowerShift === '3') return 'Evening';
    // Return undefined for invalid values instead of forcing cast
    return undefined;
};



export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');

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
    const { data: parsedData, errors: parseErrors } = parse<Record<string, unknown>>(fileText, {
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

      const enrollmentNumber = (row.mapnumber || row.map_number)?.toString().trim();
      const gtuName = row.name?.toString().trim();
      
      if (!enrollmentNumber || !gtuName) {
        importErrors.push({row: rowIndex, message: `Missing enrollment number or name.`, data: row});
        skippedCount++; continue;
      }

      const { firstName, middleName, lastName } = parseGtuNameFromString(gtuName);
      const branchCode = (row.brcode || row.br_code)?.toString().trim().toUpperCase();
      // Infer programId and instituteId from branchCode
      const studentProgram = clientPrograms.find(p => p.code === branchCode); // Assuming program code is same as branch code for simplicity
      if (!studentProgram) {
          importErrors.push({row: rowIndex, message: `Program not found for branch code ${branchCode}. Ensure program exists with this code.`, data: row});
          skippedCount++; continue;
      }
      const programId = studentProgram.id;
      const studentInstituteId = studentProgram.instituteId; // Get instituteId from the found program


      let currentSemester = 1;
      // Check semesters 6 to 1 for diploma programs (diploma only has 6 semesters)
      for (let sem = 6; sem >= 1; sem--) {
        const semStatusVal = mapSemesterCodeToStatusFromString(row[`sem${sem}`]?.toString());
        if (semStatusVal === 'Passed') {
            currentSemester = Math.min(sem + 1, 6); break;
        } else if (semStatusVal === 'Pending') {
            currentSemester = sem; break;
        }
      }
      
      const isPassAllStr = String(row.ispassall).toLowerCase();
      const isCompleteStr = String(row.iscomplete).toLowerCase();

      if (isPassAllStr === 'true' || isCompleteStr === 'true'){
        currentSemester = 6; // Diploma programs only have 6 semesters
      }
      
      const convocationYearStr = String(row.convoyear).trim();
      const convocationYear = convocationYearStr && !isNaN(parseInt(convocationYearStr, 10)) ? parseInt(convocationYearStr, 10) : undefined;
      
      let instituteDomain = "gppalanpur.in"; // Default domain
      if (studentInstituteId) {
          try {
              const inst = await instituteService.getInstituteById(studentInstituteId);
              if (inst.domain) instituteDomain = inst.domain;
          } catch {
            /* use default */
          }
      }
      const instituteEmail = `${enrollmentNumber}@${instituteDomain}`;


      const studentData: Omit<Student, 'id' | 'userId'> = {
        enrollmentNumber, fullNameGtuFormat: gtuName, firstName, middleName, lastName,
        personalEmail: row.email?.toString().trim() || undefined,
        instituteEmail,
        programId, 
        currentSemester,
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
        // Diploma programs only have semesters 1-6, ignoring sem7 and sem8
        category: row.category?.toString().trim() || undefined,
        isComplete: isCompleteStr === 'true',
        termClose: String(row.termclose).toLowerCase() === 'true',
        isCancel: String(row.iscancel).toLowerCase() === 'true',
        isPassAll: isPassAllStr === 'true',
        aadharNumber: row.aadhar?.toString().trim() || undefined,
        shift: normalizeShiftFromString(row.shift?.toString()),
      };

      // Find existing student in MongoDB
      const existingStudent = await StudentModel.findOne({ enrollmentNumber });
      let studentToProcess: Student;
      let savedStudentDoc: any; // Keep reference to the actual Mongoose document

      if (existingStudent) {
        // Update existing student
        Object.assign(existingStudent, studentData);
        savedStudentDoc = await existingStudent.save();
        studentToProcess = savedStudentDoc.toJSON() as Student;
        updatedCount++;
      } else {
        // Create new student
        const newStudentData = { id: generateIdForImport(), ...studentData };
        const newStudent = new StudentModel(newStudentData);
        savedStudentDoc = await newStudent.save();
        studentToProcess = savedStudentDoc.toJSON() as Student;
        newCount++;
      }

      const userDisplayName = studentToProcess.fullNameGtuFormat || studentToProcess.enrollmentNumber;
      try {
        const existingUserByEmail = await UserModel.findOne({ instituteEmail: studentToProcess.instituteEmail });
        
        const userDataPayload = {
            displayName: userDisplayName,
            fullName: studentToProcess.fullNameGtuFormat,
            firstName: studentToProcess.firstName,
            middleName: studentToProcess.middleName,
            lastName: studentToProcess.lastName,
            email: studentToProcess.instituteEmail, // Use institute email as primary login email
            instituteEmail: studentToProcess.instituteEmail,
            isActive: studentToProcess.status === 'active',
            instituteId: studentInstituteId, // Pass student's institute ID
            currentRole: 'student' as UserRole,
        };

        let userId: string;
        
        if (existingUserByEmail) {
            userId = existingUserByEmail._id.toString(); // Use _id and convert to string
            const rolesToSet = existingUserByEmail.roles.includes('student') ? existingUserByEmail.roles : [...existingUserByEmail.roles, 'student' as UserRole];
            Object.assign(existingUserByEmail, {...userDataPayload, roles: rolesToSet});
            await existingUserByEmail.save();
            console.log(`Updated existing user ${userId} for student ${enrollmentNumber}`);
        } else {
            const newUser = new UserModel({...userDataPayload, password: studentToProcess.enrollmentNumber, roles: ['student']});
            const createdUser = await newUser.save();
            userId = createdUser._id.toString(); // Use _id and convert to string
            console.log(`Created new user ${userId} for student ${enrollmentNumber}`);
        }
        
        // Update student with userId in database using the saved document reference
        if (savedStudentDoc && savedStudentDoc._id) {
            const updateResult = await StudentModel.findByIdAndUpdate(
                savedStudentDoc._id, 
                { userId }, 
                { new: true }
            );
            if (updateResult) {
                studentToProcess.userId = userId;
                console.log(`Successfully linked student ${enrollmentNumber} with userId ${userId}`);
            } else {
                console.error(`Failed to update student ${enrollmentNumber} with userId ${userId}`);
                throw new Error(`Failed to link student ${enrollmentNumber} to user account`);
            }
        } else {
            console.error(`Could not find MongoDB _id for student ${enrollmentNumber}`);
            throw new Error(`Could not find student document for ${enrollmentNumber}`);
        }

      } catch(userError: unknown) {
        const error = userError as Error;
        importErrors.push({row: rowIndex, message: `User account linking/creation failed for ${enrollmentNumber}: ${error.message}`, data: row});
      }
    }
    
    // Post-import repair: Fix any missing userId links
    console.log('Running post-import repair for userId links...');
    try {
        const studentsWithoutUserId = await StudentModel.find({
            $or: [
                { userId: null },
                { userId: undefined },
                { userId: { $exists: false } }
            ]
        });

        console.log(`Found ${studentsWithoutUserId.length} students without userId after import`);

        let repairCount = 0;
        for (const student of studentsWithoutUserId) {
            try {
                const user = await UserModel.findOne({
                    instituteEmail: student.instituteEmail
                });

                if (user) {
                    await StudentModel.findByIdAndUpdate(
                        student._id,
                        { userId: user._id.toString() },
                        { new: true }
                    );
                    console.log(`Repaired link for student ${student.enrollmentNumber} -> user ${user._id}`);
                    repairCount++;
                }
            } catch (error) {
                console.error(`Error repairing student ${student.enrollmentNumber}:`, error);
            }
        }

        console.log(`Post-import repair completed: ${repairCount} links fixed`);
    } catch (error) {
        console.error('Error in post-import repair:', error);
    }

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
    return NextResponse.json({ message: 'Error importing GTU students.' }, { status: 500 });
  }
}
