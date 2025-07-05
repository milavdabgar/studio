// src/app/api/project-teams/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, Department, ProjectEvent, User as SystemUser, ProjectTeamMember } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import mongoose from 'mongoose';
import { ProjectTeamModel } from '@/lib/models';

const generateIdForImport = (): string => `team_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const departmentsJson = formData.get('departments') as string | null;
    const eventsJson = formData.get('events') as string | null;
    const usersJson = formData.get('users') as string | null;

    if (!file) return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    if (!departmentsJson || !eventsJson || !usersJson) {
        return NextResponse.json({ message: 'Required mapping data (departments, events, users) is missing.' }, { status: 400 });
    }
    
    const clientDepartments: Department[] = JSON.parse(departmentsJson);
    const clientEvents: ProjectEvent[] = JSON.parse(eventsJson);
    const clientUsers: SystemUser[] = JSON.parse(usersJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, ''),
    });

    if (parseErrors.length > 0) {
      return NextResponse.json({ message: 'Error parsing CSV.', errors: parseErrors.map(e => `Row ${(e.row || 0) + 2}: ${e.message}`) }, { status: 400 });
    }
    if (parsedData.length === 0) return NextResponse.json({ message: 'CSV file is empty or has no data rows.' }, { status: 400 });

    const requiredHeaders = ['teamname', 'departmentname', 'eventname', 'membername', 'memberenrollmentno'];
    const csvHeader = Object.keys(parsedData[0]).map(h => h.toLowerCase());
    if (!requiredHeaders.every(rh => csvHeader.includes(rh))) {
      return NextResponse.json({ message: `CSV header missing required columns. Must include at least: ${requiredHeaders.join(', ')}.` }, { status: 400 });
    }

    let newCount = 0, updatedCount = 0, skippedCount = 0;
    const importErrors: { row: number; message: string; data: unknown }[] = [];
    const now = new Date().toISOString();

    // Group rows by team (teamName + eventName as key)
    const teamsFromCsv: Record<string, { teamData: Omit<ProjectTeam, 'id'|'createdAt'|'updatedAt'|'createdBy'|'updatedBy'|'members'>, membersData: ProjectTeamMember[], csvId?: string }> = {};

    for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const rowIndex = i + 2;

        const teamName = row.teamname?.toString().trim();
        const eventName = row.eventname?.toString().trim();
        const deptIdentifier = row.departmentname?.toString().trim() || row.departmentcode?.toString().trim().toUpperCase();
        
        const memberName = row.membername?.toString().trim();
        const memberEnrollmentNo = row.memberenrollmentno?.toString().trim();
        const memberRole = row.memberrole?.toString().trim() || 'Member';
        const memberIsLeader = String(row.memberisleader).toLowerCase() === 'true' || row.memberisleader === '1';
        const memberUserIdCsv = row.memberuserid?.toString().trim(); // For explicit user ID mapping
        const memberEmailCsv = row.memberemail?.toString().trim().toLowerCase(); // For user lookup

        if (!teamName || !eventName || !deptIdentifier || !memberName || !memberEnrollmentNo) {
            importErrors.push({ row: rowIndex, message: "Missing required fields for team or member.", data: row });
            skippedCount++; continue;
        }

        const department = clientDepartments.find(d => d.name.toLowerCase() === deptIdentifier.toLowerCase() || d.code.toLowerCase() === deptIdentifier.toLowerCase());
        const event = clientEvents.find(e => e.name.toLowerCase() === eventName.toLowerCase());
        
        if (!department) { importErrors.push({row: rowIndex, message: `Department '${deptIdentifier}' not found.`, data: row}); skippedCount++; continue; }
        if (!event) { importErrors.push({row: rowIndex, message: `Event '${eventName}' not found.`, data: row}); skippedCount++; continue; }

        let memberUser: SystemUser | undefined = undefined;
        if (memberUserIdCsv) {
            memberUser = clientUsers.find(u => u.id === memberUserIdCsv);
        } else if (memberEmailCsv) {
            memberUser = clientUsers.find(u => u.email.toLowerCase() === memberEmailCsv || u.instituteEmail?.toLowerCase() === memberEmailCsv);
        }
        // If still not found by ID/email, try by enrollment as part of name/displayName (less reliable)
        if(!memberUser) {
            memberUser = clientUsers.find(u => u.displayName.toLowerCase().includes(memberEnrollmentNo.toLowerCase()));
        }
        if(!memberUser) {
            importErrors.push({row: rowIndex, message: `User for member '${memberName}' (Enroll: ${memberEnrollmentNo}) not found by ID, email, or enrollment in display name. Member not added.`, data: row});
            // Don't skip the whole team, just this member for now.
            // Or, could decide to skip the team if a member cannot be resolved.
        }


        const teamKey = `${teamName.toLowerCase()}-${event.id}`;
        if (!teamsFromCsv[teamKey]) {
            teamsFromCsv[teamKey] = {
                teamData: { name: teamName, department: department.id, eventId: event.id },
                membersData: [],
                csvId: row.teamid?.toString().trim() || undefined
            };
        }
        if (memberUser) { // Only add member if user was found
            teamsFromCsv[teamKey].membersData.push({ name: memberName, enrollmentNo: memberEnrollmentNo, role: memberRole, isLeader: memberIsLeader, userId: memberUser.id });
        }
    }

    for (const key in teamsFromCsv) {
        const { teamData, membersData, csvId } = teamsFromCsv[key];
        
        // Ensure at least one leader if members exist
        if (membersData.length > 0 && !membersData.some(m => m.isLeader)) {
            membersData[0].isLeader = true;
            membersData[0].role = 'Team Leader';
        }
         if (membersData.filter(m => m.isLeader).length > 1) {
            importErrors.push({row: -1, message: `Team '${teamData.name}' has multiple leaders defined. Defaulting to first listed.`, data: teamData});
            let firstLeaderFound = false;
            membersData.forEach(m => {
                if (m.isLeader && !firstLeaderFound) firstLeaderFound = true;
                else if (m.isLeader) m.isLeader = false;
            });
        }

        // Find existing team in MongoDB
        let existingTeam = null;
        if (csvId) {
            existingTeam = await ProjectTeamModel.findOne({ id: csvId });
        } else {
            existingTeam = await ProjectTeamModel.findOne({ 
                name: { $regex: new RegExp(`^${teamData.name}$`, 'i') },
                eventId: teamData.eventId 
            });
        }

        if (existingTeam) {
            // Update existing team
            Object.assign(existingTeam, { ...teamData, members: membersData, updatedAt: now, updatedBy:"user_import_placeholder" });
            await existingTeam.save();
            updatedCount++;
        } else {
            // Check for duplicate before creating
            const duplicateTeam = await ProjectTeamModel.findOne({ 
                name: { $regex: new RegExp(`^${teamData.name}$`, 'i') },
                eventId: teamData.eventId 
            });

            if (duplicateTeam) {
                 importErrors.push({ row: -1, message: `Team '${teamData.name}' for event '${teamData.eventId}' already exists with a different ID. Skipped.`, data: teamData });
                 skippedCount++; 
                 continue;
            }

            // Create new team
            const newTeamData = {
                id: csvId || generateIdForImport(),
                ...teamData,
                members: membersData,
                createdBy: "user_import_placeholder",
                updatedBy: "user_import_placeholder",
                createdAt: now,
                updatedAt: now,
            };
            const newTeam = new ProjectTeamModel(newTeamData);
            await newTeam.save();
            newCount++;
        }
    }

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Project Teams import partially completed. ${importErrors.length} rows/teams had issues.`, 
            newCount, updatedCount, skippedCount, errors: importErrors.slice(0,10)
        }, { status: 207 });
    }
    return NextResponse.json({ message: 'Project Teams imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during project team import:', error);
    return NextResponse.json({ message: 'Critical error during project team import.', error: (error as Error).message }, { status: 500 });
  }
}
