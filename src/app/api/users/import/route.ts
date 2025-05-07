
import { NextResponse, type NextRequest } from 'next/server';
import type { User, UserRole } from '@/types/entities'; // Updated import
import { parse, type ParseError } from 'papaparse';
import { instituteService } from '@/lib/api/institutes'; // To fetch institute domain

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
const USER_ROLE_OPTIONS_VALUES: UserRole[] = ["admin", "student", "faculty", "hod", "jury", "unknown", "super_admin", "dte_admin", "gtu_admin", "institute_admin", "department_admin", "committee_admin", "lab_assistant", "clerical_staff"];

const parseFullName = (fullName: string | undefined): { firstName?: string, middleName?: string, lastName?: string } => {
    if (!fullName) return {};
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
    return { lastName: parts[0], firstName: parts[1], middleName: parts.slice(2).join(' ') };
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
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''), // Allow underscore
      dynamicTyping: false, // Keep all as string initially
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (User Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Users CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['email', 'roles', 'isactive', 'instituteid']; // displayName or fullName, password for new

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
      const rowIndex = i + 2; // CSV row number (1-based, +1 for header)

      const personalEmail = row.email?.toString().trim().toLowerCase();
      const rolesString = row.roles?.toString().trim().replace(/^"|"$/g, '');
      const roles = rolesString ? rolesString.split(';').map((r: string) => r.trim().toLowerCase() as UserRole).filter(r => USER_ROLE_OPTIONS_VALUES.includes(r)) : [];
      const isActiveRaw = row.isactive?.toString().trim().toLowerCase();
      const isActive = isActiveRaw === 'true' || isActiveRaw === '1' || isActiveRaw === 'active';
      const instituteId = row.instituteid?.toString().trim();
      const displayNameFromCSV = row.displayname?.toString().trim();
      const fullNameFromCSV = row.fullname_gtuformat?.toString().trim(); // Or a specific field for GTU name

      if (!personalEmail || roles.length === 0 || !instituteId) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: email, roles, or instituteid.", data: row });
        skippedCount++;
        continue;
      }
      if (!displayNameFromCSV && !fullNameFromCSV) {
         importErrors.push({ row: rowIndex, message: "Missing displayname or fullname_gtuformat.", data: row });
         skippedCount++;
         continue;
      }

      let instituteDomain = 'example.com';
      try {
        const institute = await instituteService.getInstituteById(instituteId);
        if (institute && institute.domain) instituteDomain = institute.domain;
      } catch (e) { /* use default */ }

      const displayName = displayNameFromCSV || fullNameFromCSV || personalEmail;
      const { firstName, lastName } = parseFullName(fullNameFromCSV || displayNameFromCSV);
      
      let instituteEmail = `${(firstName || 'user').toLowerCase()}.${(lastName || `id${generateIdForImport().substring(0,4)}`).toLowerCase()}@${instituteDomain}`;
      if (!firstName && !lastName) instituteEmail = `${personalEmail.split('@')[0]}@${instituteDomain}`;
      
      let emailSuffix = 1;
      const originalInstituteEmailBase = instituteEmail.split('@')[0];
      
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string } = {
        displayName,
        username: row.username?.toString().trim() || undefined,
        email: personalEmail,
        instituteEmail, // Will be checked for uniqueness later
        photoURL: row.photourl?.toString().trim() || undefined,
        phoneNumber: row.phonenumber?.toString().trim() || undefined,
        roles,
        isActive,
        instituteId,
        preferences: { theme: 'system', language: 'en' } // Default preferences
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

      // Ensure instituteEmail is unique before saving
      let tempInstituteEmail = userData.instituteEmail!;
      while (usersStore.some(u => (idFromCsv ? u.id !== idFromCsv : true) && u.instituteEmail?.toLowerCase() === tempInstituteEmail.toLowerCase())) {
          tempInstituteEmail = `${originalInstituteEmailBase}${emailSuffix}@${instituteDomain}`;
          emailSuffix++;
      }
      userData.instituteEmail = tempInstituteEmail;


      if (existingUserIndex !== -1) {
        const existingUser = usersStore[existingUserIndex];
        if (existingUser.email === "admin@gppalanpur.in" || existingUser.instituteEmail === "admin@gppalanpur.in") {
           importErrors.push({row: rowIndex, message: "Cannot modify primary admin user via CSV import.", data: row});
           skippedCount++;
           continue;
        }
        const currentPassword = existingUser.password;
        usersStore[existingUserIndex] = { 
            ...existingUser, 
            ...userData,
            password: userData.password || currentPassword, // Keep existing if not provided
            updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
         if (usersStore.some(u => u.email === personalEmail)) { 
             importErrors.push({row: rowIndex, message: `User with personal email ${personalEmail} already exists with a different ID.`, data: row});
             skippedCount++;
             continue;
        }
        if (!userData.password) { 
            importErrors.push({row: rowIndex, message: `Password is required for new user ${displayName} (${personalEmail}).`, data: row});
            skippedCount++;
            continue;
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
    
    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Users import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); // Multi-Status
    }

    return NextResponse.json({ message: 'Users imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during user import process:', error);
    return NextResponse.json({ message: 'Critical error during user import process. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
