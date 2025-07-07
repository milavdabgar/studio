// src/app/api/projects/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Department, ProjectTeam, ProjectEvent, User as SystemUser, ProjectStatus, ProjectRequirements, ProjectGuide } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { ProjectModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `proj_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ['draft', 'submitted', 'approved', 'rejected', 'completed', 'evaluated'];

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // These will be JSON strings from the client
    const departmentsJson = formData.get('departments') as string | null;
    const teamsJson = formData.get('teams') as string | null;
    const eventsJson = formData.get('events') as string | null;
    const usersJson = formData.get('users') as string | null; // For guides

    if (!file) return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    if (!departmentsJson || !teamsJson || !eventsJson || !usersJson) {
        return NextResponse.json({ message: 'Required mapping data (departments, teams, events, users) is missing.' }, { status: 400 });
    }
    
    const clientDepartments: Department[] = JSON.parse(departmentsJson);
    const clientTeams: ProjectTeam[] = JSON.parse(teamsJson);
    const clientEvents: ProjectEvent[] = JSON.parse(eventsJson);
    const clientFacultyUsers: SystemUser[] = JSON.parse(usersJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
    });

    if (parseErrors.length > 0) {
      return NextResponse.json({ message: 'Error parsing CSV.', errors: parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message}`) }, { status: 400 });
    }
    if (parsedData.length === 0) return NextResponse.json({ message: 'CSV file is empty or has no data rows.' }, { status: 400 });

    const requiredHeaders = ['title', 'category', 'abstract', 'department', 'teamname', 'eventname', 'guidename'];
    const csvHeader = Object.keys(parsedData[0]).map(h => h.toLowerCase());
    if (!requiredHeaders.every(rh => csvHeader.includes(rh))) {
      return NextResponse.json({ message: `CSV header missing required columns: ${requiredHeaders.filter(h => !csvHeader.includes(h)).join(', ')}.` }, { status: 400 });
    }

    let newCount = 0, updatedCount = 0, skippedCount = 0;
    const importErrors: { row: number; message: string; data: unknown }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2; // CSV rows are 1-indexed, and header is row 1

      const title = row.title?.toString().trim();
      const category = row.category?.toString().trim();
      const abstract = row.abstract?.toString().trim();
      
      const deptIdentifier = row.department?.toString().trim();
      const teamIdentifier = row.teamname?.toString().trim();
      const eventIdentifier = row.eventname?.toString().trim();
      const guideNameIdentifier = row.guidename?.toString().trim();

      if (!title || !category || !abstract || !deptIdentifier || !teamIdentifier || !eventIdentifier || !guideNameIdentifier) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: title, category, abstract, department, teamName, eventName, guideName.", data: row });
        skippedCount++; continue;
      }
      
      const department = clientDepartments.find(d => d.name.toLowerCase() === deptIdentifier.toLowerCase() || d.code.toLowerCase() === deptIdentifier.toLowerCase());
      const team = clientTeams.find(t => t.name.toLowerCase() === teamIdentifier.toLowerCase());
      const event = clientEvents.find(e => e.name.toLowerCase() === eventIdentifier.toLowerCase());
      const guideUser = clientFacultyUsers.find(u => u.displayName.toLowerCase() === guideNameIdentifier.toLowerCase() || u.email.toLowerCase() === guideNameIdentifier.toLowerCase());

      if (!department) { importErrors.push({row: rowIndex, message: `Department '${deptIdentifier}' not found.`, data: row}); skippedCount++; continue; }
      if (!team) { importErrors.push({row: rowIndex, message: `Team '${teamIdentifier}' not found.`, data: row}); skippedCount++; continue; }
      if (!event) { importErrors.push({row: rowIndex, message: `Event '${eventIdentifier}' not found.`, data: row}); skippedCount++; continue; }
      if (!guideUser) { importErrors.push({row: rowIndex, message: `Guide '${guideNameIdentifier}' not found.`, data: row}); skippedCount++; continue; }

      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = PROJECT_STATUS_OPTIONS.includes(statusRaw as ProjectStatus) ? statusRaw as ProjectStatus : 'draft';
      
      const requirements: ProjectRequirements = {
        power: String(row.powerrequired).toLowerCase() === 'yes',
        internet: String(row.internetrequired).toLowerCase() === 'yes',
        specialSpace: String(row.specialspacerequired).toLowerCase() === 'yes',
        otherRequirements: row.otherrequirements?.toString().trim() || undefined,
      };
      const guide: ProjectGuide = {
        userId: guideUser.id,
        name: guideUser.displayName,
        department: guideUser.departmentId || department.id, // Fallback to project's dept
        contactNumber: row.guidecontact?.toString().trim() || guideUser.phoneNumber || undefined,
      };


      const projectData = {
        title, category, abstract, department: department.id, status, requirements, guide, teamId: team.id, eventId: event.id,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingProject = null;
      
      if (idFromCsv) {
        existingProject = await ProjectModel.findOne({ 
          id: idFromCsv 
        });
      } else {
        // Check for duplicate based on title, event, and team
        existingProject = await ProjectModel.findOne({ 
          title: { $regex: new RegExp(`^${title}$`, 'i') },
          eventId: event.id,
          teamId: team.id
        });
      }
      
      if (existingProject) {
        await ProjectModel.findOneAndUpdate(
          { _id: existingProject._id },
          { ...projectData, updatedAt: now }
        );
        updatedCount++;
      } else {
        const duplicate = await ProjectModel.findOne({ 
          title: { $regex: new RegExp(`^${title}$`, 'i') },
          eventId: event.id,
          teamId: team.id
        });
        
        if (duplicate) {
            importErrors.push({ row: rowIndex, message: `Project '${title}' for team '${team.name}' in event '${event.name}' already exists.`, data: row });
            skippedCount++; continue;
        }
        
        const newProject = new ProjectModel({
          id: idFromCsv || generateIdForImport(),
          ...projectData,
          createdAt: now,
          updatedAt: now
        });
        
        await newProject.save();
        newCount++;
      }
    }

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Projects import partially completed. ${importErrors.length} rows had issues.`, 
            newCount, updatedCount, skippedCount, errors: importErrors.slice(0,10) // Send first 10 errors
        }, { status: 207 });
    }
    return NextResponse.json({ message: 'Projects imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during project import:', error);
    return NextResponse.json({ message: 'Critical error during project import.', error: (error as Error).message }, { status: 500 });
  }
}
