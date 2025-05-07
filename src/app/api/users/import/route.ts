
import { NextResponse, type NextRequest } from 'next/server';
import type { SystemUser, UserRole } from '@/types/entities';
import { parse } from 'papaparse';

// Ensure the global store is initialized (copied from main route for consistency)
declare global {
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: SystemUser[] | undefined;
}
if (!global.__API_USERS_STORE__) {
  global.__API_USERS_STORE__ = [
    // Default users or empty if managed by main route for initial seed
     { id: "user1", name: "Alice Admin", email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin"], status: "active", department: "Administration" },
  ]; 
}
const usersStore: SystemUser[] = global.__API_USERS_STORE__;

const generateIdForImport = (): string => `user_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors:', parseErrors);
      return NextResponse.json({ message: 'Error parsing CSV file.', errors: parseErrors.map(e => e.message) }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['name', 'email', 'roles', 'status'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    parsedData.forEach((row: any) => {
      const name = row.name?.trim();
      const email = row.email?.trim().toLowerCase();
      const rolesString = row.roles?.trim().replace(/^"|"$/g, '');
      const roles = rolesString ? rolesString.split(';').map((r: string) => r.trim() as UserRole).filter(Boolean) : [];
      const status = row.status?.trim().toLowerCase() as 'active' | 'inactive';

      if (!name || !email || roles.length === 0 || !['active', 'inactive'].includes(status)) {
        console.warn(`Skipping row: Missing or invalid required data (name, email, roles, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }
      
      const userData: Omit<SystemUser, 'id' | 'password'> & { password?: string } = {
        name,
        email,
        roles,
        status,
        department: row.department?.trim() || undefined,
      };
      if (row.password && row.password.trim().length >= 6) {
        userData.password = row.password.trim();
      }


      const idFromCsv = row.id?.trim();
      let existingUserIndex = -1;

      if (idFromCsv) {
        existingUserIndex = usersStore.findIndex(u => u.id === idFromCsv);
      } else { 
        existingUserIndex = usersStore.findIndex(u => u.email === email);
      }


      if (existingUserIndex !== -1) {
        // If updating, preserve existing password if new one isn't provided or is weak
        const existingPassword = usersStore[existingUserIndex].password;
        usersStore[existingUserIndex] = { 
            ...usersStore[existingUserIndex], 
            ...userData,
            password: userData.password || existingPassword // Prioritize new valid password, else keep old
        };
        updatedCount++;
      } else {
         if (usersStore.some(u => u.email === email)) { // Check email uniqueness for new users
             console.warn(`Skipping new user: Email ${email} (for ${name}) already exists.`);
             skippedCount++;
             return;
        }
        if (!userData.password) { // New users must have a password from CSV
            console.warn(`Skipping new user ${name} (${email}): Password is required for new users in CSV.`);
            skippedCount++;
            return;
        }
        const newUser: SystemUser = {
          id: idFromCsv || generateIdForImport(), 
          ...userData,
          password: userData.password, // Already validated it's present for new user
        };
        usersStore.push(newUser); // This modifies global.__API_USERS_STORE__ because usersStore is a reference
        newCount++;
      }
    });

    // global.__API_USERS_STORE__ is already updated if usersStore is directly modified.

    return NextResponse.json({ message: 'Users imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json({ message: 'Error importing users.', error: (error as Error).message }, { status: 500 });
  }
}

