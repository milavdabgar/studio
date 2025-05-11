
import { NextResponse, type NextRequest } from 'next/server';
import type { Role, UserRole } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { allPermissions } from '@/lib/api/roles'; 

// In-memory store for roles (replace with actual DB interaction)
let rolesStore: Role[] = (global as any).__API_ROLES_STORE__ || [
  { id: "1", name: "Admin", description: "Full access to all system features.", permissions: ["manage_users", "manage_roles", "manage_settings", "manage_institutes", "manage_buildings", "manage_rooms", "manage_departments", "manage_programs", "manage_courses"] },
  { id: "2", name: "Student", description: "Access to student-specific features.", permissions: ["view_courses", "submit_assignments"] },
  { id: "3", name: "Faculty", description: "Access to faculty-specific features.", permissions: ["manage_courses", "grade_assignments", "evaluate_projects"] },
  { id: "4", name: "HOD", description: "Head of Department access.", permissions: ["manage_faculty", "view_department_reports", "manage_courses", "evaluate_projects"] },
  { id: "5", name: "Jury", description: "Project fair jury access.", permissions: ["evaluate_projects"] },
];
(global as any).__API_ROLES_STORE__ = rolesStore;

const generateClientIdForImport = (): string => `role_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
      dynamicTyping: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Role Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Roles CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    // const expectedHeaders = ['id', 'name', 'description', 'permissions']; 
    const requiredHeaders = ['name', 'description', 'permissions'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    parsedData.forEach((row: unknown) => {
      const name = row.name?.toString().trim();
      const description = row.description?.toString().trim();
      const permissionsString = row.permissions?.toString().trim().replace(/^"|"$/g, '');
      const permissions = permissionsString 
        ? permissionsString.split(';').map(p => p.trim()).filter(p => allPermissions.includes(p)) 
        : [];

      if (!name || !description) {
        console.warn(`Skipping role row: Missing name or description. Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }
      
      const roleData: Omit<Role, 'id'> = {
        name,
        description,
        permissions,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingRoleIndex = -1;
      if(idFromCsv) {
        existingRoleIndex = rolesStore.findIndex(r => r.id === idFromCsv);
      } else { 
        existingRoleIndex = rolesStore.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
      }

      if (existingRoleIndex !== -1) {
        if (rolesStore[existingRoleIndex].name.toLowerCase() === 'admin' && name.toLowerCase() !== 'admin') {
            console.warn(`Skipping update for Admin role name. Original name preserved.`);
            rolesStore[existingRoleIndex] = { ...rolesStore[existingRoleIndex], ...roleData, name: rolesStore[existingRoleIndex].name };
        } else {
            rolesStore[existingRoleIndex] = { ...rolesStore[existingRoleIndex], ...roleData };
        }
        updatedCount++;
      } else {
        const newRole: Role = {
          id: idFromCsv || generateClientIdForImport(),
          ...roleData,
        };
        rolesStore.push(newRole);
        newCount++;
      }
    });

    (global as any).__API_ROLES_STORE__ = rolesStore; 

    return NextResponse.json({ message: 'Roles imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing roles:', error);
    return NextResponse.json({ message: 'Error importing roles.', error: (error as Error).message }, { status: 500 });
  }
}
