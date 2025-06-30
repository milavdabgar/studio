
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, CommitteeStatus, Institute, SystemUser as User, UserRole, Role } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { isValid, parseISO, format } from 'date-fns';
import { userService } from '@/lib/api/users';
import { CommitteeModel, RoleModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `cmt_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateRoleIdForImport = (): string => `role_cmt_imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const COMMITTEE_STATUS_OPTIONS: CommitteeStatus[] = ['active', 'inactive', 'dissolved'];

async function updateUserConvenerRoleForImport(userId: string, committeeCode: string, committeeName: string, add: boolean) {
  const roleCode: UserRole = `${committeeCode.toLowerCase()}_convener`;
  // Role name not strictly needed for user update if roles are stored by code, but good for logging
  const roleName = `${committeeName} Convener`; 
  try {
    const user = await userService.getUserById(userId) as User;
    if (!user) {
        console.warn(`User with ID ${userId} not found during convener role update (Import).`);
        return false;
    }

    let newRoles = [...user.roles]; // user.roles stores role codes
    if (add && !newRoles.includes(roleCode)) {
      newRoles.push(roleCode);
    } else if (!add) {
      newRoles = newRoles.filter(r => r !== roleCode);
    }

    if (JSON.stringify(newRoles.sort()) !== JSON.stringify(user.roles.sort())) {
      await userService.updateUser(userId, { roles: newRoles });
    }
    return true;
  } catch (error) {
    console.error(`Failed to update role (Code: '${roleCode}', Name: '${roleName}') for user ${userId} during import:`, error);
    return false;
  }
}

async function createOrUpdateCommitteeRolesForImport(committee: Committee, isUpdate: boolean = false, oldCommitteeDetails?: {name: string, code: string}) {
  const committeeRolesInfo = [
    { type: 'Convener', permissions: ['view_committee_info', 'manage_committee_meetings', 'manage_committee_members'] },
    { type: 'Co-Convener', permissions: ['view_committee_info', 'manage_committee_meetings'] },
    { type: 'Member', permissions: ['view_committee_info'] },
  ];

  for (const roleInfo of committeeRolesInfo) {
    const roleNameSuffix = roleInfo.type;
    const newRoleName = `${committee.name} ${roleNameSuffix}`;
    const newRoleCode = `${committee.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
    
    let oldRoleCodeForSearch: string | undefined = undefined;

    if (isUpdate && oldCommitteeDetails) {
      oldRoleCodeForSearch = `${oldCommitteeDetails.code.toLowerCase()}_${roleNameSuffix.toLowerCase().replace(/\s+/g, '_')}`;
    }

    // Look for existing role
    const searchCode = oldRoleCodeForSearch || newRoleCode;
    const existingRole = await RoleModel.findOne({ 
      code: searchCode,
      committeeId: committee.id 
    });

    if (existingRole) {
      // Update existing role
      await RoleModel.findOneAndUpdate(
        { _id: existingRole._id },
        {
          name: newRoleName,
          code: newRoleCode,
          description: `${roleInfo.type} for the ${committee.name} committee.`,
          committeeCode: committee.code,
          updatedAt: new Date().toISOString(),
        }
      );
      
      // If role code changed, update users with this role
      if (existingRole.code !== newRoleCode) {
        // Note: User role updates would be handled by the userService
        console.log(`Role code changed from ${existingRole.code} to ${newRoleCode} - users may need role updates`);
      }
    } else {
      // Check if role with new code already exists
      const duplicateRole = await RoleModel.findOne({ code: newRoleCode });
      if (duplicateRole) {
        console.warn(`Role with code ${newRoleCode} already exists. Skipping creation for ${committee.name} ${roleInfo.type}.`);
        continue;
      }

      // Create new role
      const newRole = new RoleModel({
        id: generateRoleIdForImport(),
        name: newRoleName,
        code: newRoleCode,
        description: `${roleInfo.type} for the ${committee.name} committee.`,
        permissions: roleInfo.permissions,
        isSystemRole: false,
        isCommitteeRole: true,
        committeeId: committee.id,
        committeeCode: committee.code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await newRole.save();
    }
  }
}


export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const institutesJson = formData.get('institutes') as string | null;
    const facultyUsersJson = formData.get('facultyUsers') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!institutesJson) {
      return NextResponse.json({ message: 'Institute data for mapping is missing.' }, { status: 400 });
    }
    if (!facultyUsersJson) {
        return NextResponse.json({ message: 'Faculty user data for convener mapping is missing.' }, { status: 400 });
    }

    const clientInstitutes: Institute[] = JSON.parse(institutesJson);
    const clientFacultyUsers: User[] = JSON.parse(facultyUsersJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: false, 
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Committees CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['name', 'code', 'purpose', 'formationdate', 'status'];
    if (!requiredHeaders.every(rh => header.includes(rh))) {
      const missing = requiredHeaders.filter(rh => !header.includes(rh));
      return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importErrors: { row: number; message: string; data: unknown }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2; 

      const name = row.name?.toString().trim();
      const code = row.code?.toString().trim().toUpperCase();
      const purpose = row.purpose?.toString().trim();
      const formationDateStr = row.formationdate?.toString().trim();
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = COMMITTEE_STATUS_OPTIONS.includes(statusRaw as CommitteeStatus) ? statusRaw as CommitteeStatus : undefined;

      if (!name || !code || !purpose || !formationDateStr || !status) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: name, code, purpose, formationDate, or status.", data: row });
        skippedCount++; continue;
      }
      
      let formationDate: string;
      try {
          formationDate = format(parseISO(formationDateStr), "yyyy-MM-dd");
          if(!isValid(parseISO(formationDate))){ throw new Error("Invalid date format"); }
      } catch(e) {
          importErrors.push({ row: rowIndex, message: `Invalid formation date format: ${formationDateStr}. Expected YYYY-MM-DD.`, data: row });
          skippedCount++; continue;
      }

      let dissolutionDate: string | undefined = undefined;
      const dissolutionDateStr = row.dissolutiondate?.toString().trim();
      if (dissolutionDateStr) {
        try {
            dissolutionDate = format(parseISO(dissolutionDateStr), "yyyy-MM-dd");
            if(!isValid(parseISO(dissolutionDate))){ throw new Error("Invalid date format"); }
        } catch(e) {
            importErrors.push({ row: rowIndex, message: `Invalid dissolution date format: ${dissolutionDateStr}. Expected YYYY-MM-DD.`, data: row });
            skippedCount++; continue;
        }
      }

      let instituteId = row.instituteid?.toString().trim();
      if (!instituteId) {
        const instituteName = row.institutename?.toString().trim();
        const instituteCodeCsv = row.institutecode?.toString().trim().toUpperCase();
        const foundInstitute = clientInstitutes.find(inst => (instituteName && inst.name.toLowerCase() === instituteName.toLowerCase()) || (instituteCodeCsv && inst.code.toUpperCase() === instituteCodeCsv));
        if (foundInstitute) {
          instituteId = foundInstitute.id;
        } else {
          importErrors.push({ row: rowIndex, message: `Institute not found by name '${instituteName}' or code '${instituteCodeCsv}'.`, data: row });
          skippedCount++; continue;
        }
      } else if (!clientInstitutes.some(inst => inst.id === instituteId)) {
        importErrors.push({ row: rowIndex, message: `Provided instituteId '${instituteId}' does not exist.`, data: row });
        skippedCount++; continue;
      }
      
      let convenerId = row.convenerid?.toString().trim();
      if (!convenerId && row.conveneremail) {
          const convenerEmail = row.conveneremail.toString().trim().toLowerCase();
          const foundUser = clientFacultyUsers.find(u => u.email.toLowerCase() === convenerEmail || u.instituteEmail?.toLowerCase() === convenerEmail);
          if (foundUser) {
              convenerId = foundUser.id;
          } else {
              importErrors.push({ row: rowIndex, message: `Convener not found by email '${convenerEmail}'. Convener will be unassigned.`, data: row });
          }
      } else if (convenerId && !clientFacultyUsers.some(u => u.id === convenerId)) {
          importErrors.push({ row: rowIndex, message: `Provided convenerId '${convenerId}' does not exist or is not a faculty member. Convener will be unassigned.`, data: row });
          convenerId = undefined;
      }

      const committeeDataFromCsv: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'> = {
        name, code, purpose, instituteId, formationDate, status,
        description: row.description?.toString().trim() || undefined,
        dissolutionDate,
        convenerId: convenerId || undefined,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingCommittee: any = null;
      let oldCommitteeSnapshot: Committee | undefined = undefined;

      // Find existing committee
      if (idFromCsv) {
        existingCommittee = await CommitteeModel.findOne({ 
          $or: [{ id: idFromCsv }, { _id: idFromCsv }] 
        }).lean();
      } else {
        existingCommittee = await CommitteeModel.findOne({ 
          code: { $regex: new RegExp(`^${code}$`, 'i') },
          instituteId: instituteId 
        }).lean();
        
        if (!existingCommittee) {
          existingCommittee = await CommitteeModel.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            instituteId: instituteId 
          }).lean();
        }
      }

      if (existingCommittee) {
        // Update existing committee
        oldCommitteeSnapshot = existingCommittee as Committee;
        
        const updatedCommittee = await CommitteeModel.findOneAndUpdate(
          { _id: existingCommittee._id },
          { ...committeeDataFromCsv, updatedAt: now },
          { new: true, lean: true }
        );
        
        if (!updatedCommittee) {
          importErrors.push({ row: rowIndex, message: "Failed to update committee.", data: row });
          skippedCount++; continue;
        }
        
        const committee = updatedCommittee as any as Committee;
        updatedCount++;

        if (oldCommitteeSnapshot && (committee.name !== oldCommitteeSnapshot.name || committee.code !== oldCommitteeSnapshot.code)) {
            await createOrUpdateCommitteeRolesForImport(committee, true, oldCommitteeSnapshot);
        }
        
        if (oldCommitteeSnapshot && oldCommitteeSnapshot.convenerId !== committee.convenerId) {
            if(oldCommitteeSnapshot.convenerId) await updateUserConvenerRoleForImport(oldCommitteeSnapshot.convenerId, oldCommitteeSnapshot.code, oldCommitteeSnapshot.name, false);
            if(committee.convenerId) await updateUserConvenerRoleForImport(committee.convenerId, committee.code, committee.name, true);
        } else if (committee.convenerId && oldCommitteeSnapshot && (committee.name !== oldCommitteeSnapshot.name || committee.code !== oldCommitteeSnapshot.code) ) {
            await updateUserConvenerRoleForImport(committee.convenerId, oldCommitteeSnapshot.code, oldCommitteeSnapshot.name, false);
            await updateUserConvenerRoleForImport(committee.convenerId, committee.code, committee.name, true);
        }

      } else {
        // Check for duplicates before creating
        const duplicateByCode = await CommitteeModel.findOne({ 
          code: { $regex: new RegExp(`^${code}$`, 'i') },
          instituteId: instituteId 
        });
        if (duplicateByCode) {
          importErrors.push({ row: rowIndex, message: `Committee with code '${code}' already exists for this institute.`, data: row });
          skippedCount++; continue;
        }
        
        const duplicateByName = await CommitteeModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          instituteId: instituteId 
        });
        if (duplicateByName) {
          importErrors.push({ row: rowIndex, message: `Committee with name '${name}' already exists for this institute.`, data: row });
          skippedCount++; continue;
        }

        const newCommittee = new CommitteeModel({
          id: idFromCsv || generateIdForImport(),
          ...committeeDataFromCsv,
          createdAt: now,
          updatedAt: now,
        });
        
        const savedCommittee = await newCommittee.save();
        await createOrUpdateCommitteeRolesForImport(savedCommittee.toObject() as Committee, false); 
        newCount++;
        
        if (savedCommittee.convenerId) {
            await updateUserConvenerRoleForImport(savedCommittee.convenerId, savedCommittee.code, savedCommittee.name, true);
        }
      }
    }

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Committees import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); 
    }
    return NextResponse.json({ message: 'Committees imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during committee import process:', error);
    return NextResponse.json({ message: 'Critical error during committee import process. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
