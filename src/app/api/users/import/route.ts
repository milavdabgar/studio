
import { NextResponse, type NextRequest } from 'next/server';
import type { User, UserRole, Institute } from '@/types/entities'; 
import { parse, type ParseError } from 'papaparse';
// Removed instituteService import as clientInstitutes are passed in

declare global {
  var __API_USERS_STORE__: User[] | undefined;
}
if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [
     { 
      id: "user1", 
      displayName: "Alice Admin", 
      username: "admin",
      email: "admin@example.com", 
      instituteEmail: "admin@gppalanpur.in",
      password: "Admin@123", 
      roles: ["admin", "super_admin"], 
      isActive: true, 
      instituteId: "inst1",
      authProviders: ['password'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: true,
      preferences: { theme: 'system', language: 'en' }
    },
  ]; 
}
const usersStore: User[] = global.__API_USERS_STORE__;

const generateIdForImport = (): string => `user_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const USER_ROLE_OPTIONS_VALUES: UserRole[] = ["admin", "student", "faculty", "hod", "jury", "unknown", "super_admin", "dte_admin", "gtu_admin", "institute_admin", "department_admin", "committee_admin", "committee_convener", "committee_co_convener", "committee_member", "lab_assistant", "clerical_staff"];


const parseGtuNameToComponents = (gtuName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!gtuName) return {};
    const parts = gtuName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: "SURNAME_PLACEHOLDER" };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] }; 
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
  };


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const institutesJson = formData.get('institutes') as string | null;


    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    // Institutes data is now optional for import, will use default domain if not provided
    const clientInstitutes: Institute[] = institutesJson ? JSON.parse(institutesJson) : [];


    const fileText = await file.text();

    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''),
      dynamicTyping: false, 
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Users CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['email', 'roles', 'isactive']; 

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importErrors: { row: number, message: string, data: any }[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2; 

      const personalEmail = row.email?.toString().trim().toLowerCase();
      const rolesString = row.roles?.toString().trim().replace(/^"|"$/g, '');
      const roles = rolesString ? rolesString.split(';').map((r: string) => r.trim().toLowerCase() as UserRole).filter(r => USER_ROLE_OPTIONS_VALUES.includes(r)) : [];
      const isActiveRaw = row.isactive?.toString().trim().toLowerCase();
      const isActive = isActiveRaw === 'true' || isActiveRaw === '1' || isActiveRaw === 'active';
      
      const fullNameFromCSV = row.fullname_gtuformat?.toString().trim();
      const firstNameFromCSV = row.firstname?.toString().trim();
      const lastNameFromCSV = row.lastname?.toString().trim();
      const displayNameFromCSV = row.displayname?.toString().trim();

      let instituteId = row.instituteid?.toString().trim();
      let currentInstitute: Institute | undefined;

      if (instituteId) {
        currentInstitute = clientInstitutes.find(inst => inst.id === instituteId);
        if (!currentInstitute) {
            importErrors.push({ row: rowIndex, message: `Provided instituteId '${instituteId}' does not exist. Cannot determine institute domain.`, data: row });
            skippedCount++; continue;
        }
      } else if (row.institutename || row.institutecode) {
          const instName = row.institutename?.toString().trim();
          const instCode = row.institutecode?.toString().trim().toUpperCase();
          currentInstitute = clientInstitutes.find(inst => (instName && inst.name.toLowerCase() === instName.toLowerCase()) || (instCode && inst.code.toUpperCase() === instCode));
          if (currentInstitute) {
            instituteId = currentInstitute.id;
          } else {
            // Institute not found by name/code, but instituteId is optional, proceed with default domain
          }
      }


      if (!personalEmail || roles.length === 0 ) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: email, roles.", data: row });
        skippedCount++; continue;
      }
      if (!displayNameFromCSV && !fullNameFromCSV && (!firstNameFromCSV || !lastNameFromCSV)) {
         importErrors.push({ row: rowIndex, message: "Missing name fields: provide displayName, or fullName_GTUFormat, or both firstName and lastName.", data: row });
         skippedCount++; continue;
      }
      
      let { firstName, middleName, lastName } = parseGtuNameToComponents(fullNameFromCSV);
      firstName = firstNameFromCSV || firstName;
      lastName = lastNameFromCSV || lastName;
      middleName = row.middlename?.toString().trim() || middleName;
      const displayName = displayNameFromCSV || `${firstName || ''} ${lastName || ''}`.trim() || personalEmail;


      let instituteDomain = 'gpp.ac.in'; // Default domain
      if (currentInstitute && currentInstitute.domain) {
          instituteDomain = currentInstitute.domain;
      } else if (currentInstitute) {
          console.warn(`Institute ${currentInstitute.name} found but no domain specified, using default ${instituteDomain}.`);
      } else {
           console.warn(`No institute specified or found for user ${personalEmail}, using default domain '${instituteDomain}' for institute email.`);
      }
      
      const firstNameForEmail = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
      const lastNameForEmail = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
      let baseInstituteEmail = `${firstNameForEmail}.${lastNameForEmail}`;
      if (!firstNameForEmail || !lastNameForEmail) { 
          baseInstituteEmail = personalEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
          if (!baseInstituteEmail) baseInstituteEmail = `user${generateIdForImport().substring(9,14)}`; // Shorter random string
      }
      
      let tempInstituteEmail = `${baseInstituteEmail}@${instituteDomain}`;
      let emailSuffix = 1;
      const originalBase = baseInstituteEmail;


      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string } = {
        displayName,
        fullName: fullNameFromCSV || `${lastName || ''} ${firstName || ''} ${middleName || ''}`.trim(),
        firstName, middleName, lastName,
        username: row.username?.toString().trim() || undefined,
        email: personalEmail,
        instituteEmail: tempInstituteEmail, 
        photoURL: row.photourl?.toString().trim() || undefined,
        phoneNumber: row.phonenumber?.toString().trim() || undefined,
        roles, isActive, instituteId: instituteId || undefined,
        preferences: { theme: 'system', language: 'en' }
      };

      const passwordFromCSV = row.password?.toString().trim();
      if (passwordFromCSV && passwordFromCSV.length >= 6) {
        userData.password = passwordFromCSV;
      }

      const idFromCsv = row.id?.toString().trim();
      let existingUserIndex = -1;

      if (idFromCsv) {
        existingUserIndex = usersStore.findIndex(u => u.id === idFromCsv);
      } else { 
        existingUserIndex = usersStore.findIndex(u => u.email === personalEmail);
      }

      // Check and resolve institute email conflict before assigning to userData
      const isEmailConflict = (emailToCheck: string) => usersStore.some(u => 
          (existingUserIndex !== -1 ? u.id !== usersStore[existingUserIndex].id : true) && 
          u.instituteEmail?.toLowerCase() === emailToCheck.toLowerCase()
      );

      while (isEmailConflict(tempInstituteEmail)) {
          tempInstituteEmail = `${originalBase}${emailSuffix}@${instituteDomain}`;
          emailSuffix++;
      }
      userData.instituteEmail = tempInstituteEmail;


      if (existingUserIndex !== -1) {
        const existingUser = usersStore[existingUserIndex];
        if (existingUser.email === "admin@gppalanpur.in" || existingUser.instituteEmail === "admin@gppalanpur.in") {
           importErrors.push({row: rowIndex, message: "Cannot modify primary admin user via CSV import.", data: row});
           skippedCount++; continue;
        }
        const currentPassword = existingUser.password;
        usersStore[existingUserIndex] = { 
            ...existingUser, 
            ...userData,
            password: userData.password || currentPassword, 
            updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
         if (usersStore.some(u => u.email === personalEmail)) { 
             importErrors.push({row: rowIndex, message: `User with personal email ${personalEmail} already exists with a different ID.`, data: row});
             skippedCount++; continue;
        }
        if (!userData.password) { 
            // Generate a default password if not provided for new users
            userData.password = `${(firstName || 'user').toLowerCase()}${new Date().getFullYear()}!`;
            console.warn(`Password not provided for new user ${displayName} (${personalEmail}). Generated default: ${userData.password}`);
        }
        const newUser: User = {
          id: idFromCsv || generateIdForImport(), 
          ...userData,
          password: userData.password!, 
          authProviders: ['password'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEmailVerified: false, 
        };
        usersStore.push(newUser); 
        newCount++;
      }
    }
    
    (global as any).__API_USERS_STORE__ = usersStore;
    
    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Users import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); 
    }

    return NextResponse.json({ message: 'Users imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during user import process:', error);
    const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Critical error during user import process. Please check server logs.', error: errorMessage }, { status: 500 });
  }
}
