
import { NextResponse, type NextRequest } from 'next/server';
import type { Role, UserRole } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { allPermissions } from '@/lib/api/roles';
import { RoleModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateClientIdForImport = (): string => `role_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
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
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0)}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Roles CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['name', 'code', 'description', 'permissions'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of parsedData) {
      const name = row.name?.toString().trim();
      const code = row.code?.toString().trim();
      const description = row.description?.toString().trim();
      const permissionsString = row.permissions?.toString().trim().replace(/^"|"$/g, '');
      const permissions = permissionsString 
        ? permissionsString.split(';').map((p: string) => p.trim()).filter((p: string) => allPermissions.includes(p)) 
        : [];

      if (!name || !code || !description) {
        console.warn(`Skipping role row: Missing name, code, or description. Row: ${JSON.stringify(row)}`);
        skippedCount++;
        continue;
      }
      
      const roleData = {
        name,
        code: code as UserRole,
        description,
        permissions,
        isSystemRole: row.issystemrole?.toString().toLowerCase() === 'true',
        isCommitteeRole: row.iscommitteerole?.toString().toLowerCase() === 'true',
        committeeId: row.committeeid?.toString().trim() || undefined,
        committeeCode: row.committeecode?.toString().trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const idFromCsv = row.id?.toString().trim();
      let existingRole = null;
      
      if (idFromCsv) {
        existingRole = await RoleModel.findOne({ 
          $or: [{ id: idFromCsv }, { _id: idFromCsv }] 
        });
      } else { 
        existingRole = await RoleModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
      }

      if (existingRole) {
        // Prevent updating admin role name
        if (existingRole.name.toLowerCase() === 'admin' && name.toLowerCase() !== 'admin') {
            console.warn(`Skipping update for Admin role name. Original name preserved.`);
            await RoleModel.findOneAndUpdate(
              { _id: existingRole._id },
              { ...roleData, name: existingRole.name, updatedAt: new Date().toISOString() }
            );
        } else {
            await RoleModel.findOneAndUpdate(
              { _id: existingRole._id },
              { ...roleData, updatedAt: new Date().toISOString() }
            );
        }
        updatedCount++;
      } else {
        const newRole = new RoleModel({
          id: idFromCsv || generateClientIdForImport(),
          ...roleData,
        });
        await newRole.save();
        newCount++;
      }
    }

    return NextResponse.json({ message: 'Roles imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing roles:', error);
    return NextResponse.json({ message: 'Error importing roles.', error: (error as Error).message }, { status: 500 });
  }
}
