// src/app/api/project-events/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent, Department, ProjectEventStatus } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { isValid, parseISO, format } from 'date-fns';
import { ProjectEventModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `evt_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const EVENT_STATUS_OPTIONS_LOWER: string[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];

export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const departmentsJson = formData.get('departments') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!departmentsJson) {
      return NextResponse.json({ message: 'Department data for mapping is missing.' }, { status: 400 });
    }
    const clientDepartments: Department[] = JSON.parse(departmentsJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: false,
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${(e.row || 0) + 2}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Project Events CSV file.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['name', 'academicyear', 'eventdate', 'registrationstartdate', 'registrationenddate', 'status'];
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
      const academicYear = row.academicyear?.toString().trim();
      const eventDateStr = row.eventdate?.toString().trim();
      const regStartDateStr = row.registrationstartdate?.toString().trim();
      const regEndDateStr = row.registrationenddate?.toString().trim();
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = EVENT_STATUS_OPTIONS_LOWER.includes(statusRaw) ? statusRaw as ProjectEventStatus : undefined;

      if (!name || !academicYear || !eventDateStr || !regStartDateStr || !regEndDateStr || !status) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: name, academicYear, eventDate, registrationStartDate, registrationEndDate, or status.", data: row });
        skippedCount++; continue;
      }
      
      let eventDate: string, registrationStartDate: string, registrationEndDate: string;
      try {
        eventDate = format(parseISO(eventDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        registrationStartDate = format(parseISO(regStartDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        registrationEndDate = format(parseISO(regEndDateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        if(!isValid(parseISO(eventDate)) || !isValid(parseISO(registrationStartDate)) || !isValid(parseISO(registrationEndDate))) throw new Error("Invalid date format");
      } catch(e) {
        importErrors.push({ row: rowIndex, message: `Invalid date format. Use YYYY-MM-DD or ISO string. Error: ${(e as Error).message}`, data: row });
        skippedCount++; continue;
      }
      if (parseISO(registrationStartDate) >= parseISO(eventDate) || parseISO(registrationEndDate) >= parseISO(eventDate) || parseISO(registrationStartDate) >= parseISO(registrationEndDate)) {
        importErrors.push({ row: rowIndex, message: 'Event dates are illogical.', data: row });
        skippedCount++; continue;
      }

      const departmentIds: string[] = [];
      const deptNames = row.departmentnames?.toString().split(';').map((n:string) => n.trim()).filter(Boolean);
      const deptCodes = row.departmentcodes?.toString().split(';').map((c:string) => c.trim().toUpperCase()).filter(Boolean);

      if (deptNames && deptNames.length > 0) {
        deptNames.forEach((deptName: string) => {
          const foundDept = clientDepartments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
          if (foundDept && !departmentIds.includes(foundDept.id)) departmentIds.push(foundDept.id);
          else if (!foundDept) importErrors.push({row: rowIndex, message: `Department name '${deptName}' not found.`, data: row});
        });
      } else if (deptCodes && deptCodes.length > 0) {
         deptCodes.forEach((deptCode: string) => {
          const foundDept = clientDepartments.find(d => d.code.toUpperCase() === deptCode);
          if (foundDept && !departmentIds.includes(foundDept.id)) departmentIds.push(foundDept.id);
          else if (!foundDept) importErrors.push({row: rowIndex, message: `Department code '${deptCode}' not found.`, data: row});
        });
      }

      const eventDataFromCsv = {
        name, academicYear, eventDate, registrationStartDate, registrationEndDate, status,
        description: row.description?.toString().trim() || undefined,
        isActive: String(row.isactive).toLowerCase() === 'true' || row.isactive === '1' || row.isactive === 1,
        publishResults: String(row.publishresults).toLowerCase() === 'true' || row.publishresults === '1' || row.publishresults === 1,
        departments: departmentIds.length > 0 ? departmentIds : undefined,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingEvent = null;

      if (idFromCsv) {
        existingEvent = await ProjectEventModel.findOne({ 
          $or: [{ id: idFromCsv }, { _id: idFromCsv }] 
        });
      } else {
        existingEvent = await ProjectEventModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          academicYear: academicYear 
        });
      }

      if (existingEvent) {
        await ProjectEventModel.findOneAndUpdate(
          { _id: existingEvent._id },
          { ...eventDataFromCsv, schedule: existingEvent.schedule || [], updatedAt: now }
        );
        updatedCount++;
      } else {
        // Check for duplicates
        const duplicate = await ProjectEventModel.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          academicYear: academicYear 
        });
        
        if (duplicate) {
            importErrors.push({ row: rowIndex, message: `Event with name '${name}' and academic year '${academicYear}' already exists.`, data: row });
            skippedCount++; continue;
        }
        
        const newEvent = new ProjectEventModel({
          id: idFromCsv || generateIdForImport(),
          ...eventDataFromCsv,
          schedule: [],
          createdBy: 'user_import_placeholder',
          updatedBy: 'user_import_placeholder',
          createdAt: now,
          updatedAt: now,
        });
        
        await newEvent.save();
        newCount++;
      }
    }

    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Project Events import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); 
    }
    return NextResponse.json({ message: 'Project Events imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during project event import process:', error);
    return NextResponse.json({ message: 'Critical error during project event import process.', error: (error as Error).message }, { status: 500 });
  }
}