
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, CommitteeStatus, Institute } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { isValid, parseISO, format } from 'date-fns';

declare global {
  var __API_COMMITTEES_STORE__: Committee[] | undefined;
}

if (!global.__API_COMMITTEES_STORE__) {
  global.__API_COMMITTEES_STORE__ = [];
}
let committeesStore: Committee[] = global.__API_COMMITTEES_STORE__;

const generateIdForImport = (): string => `cmt_imp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const COMMITTEE_STATUS_OPTIONS: CommitteeStatus[] = ['active', 'inactive', 'dissolved'];


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const institutesJson = formData.get('institutes') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!institutesJson) {
      return NextResponse.json({ message: 'Institute data for mapping is missing.' }, { status: 400 });
    }
    const clientInstitutes: Institute[] = JSON.parse(institutesJson);

    const fileText = await file.text();
    const { data: parsedData, errors: parseErrors } = parse<any>(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ''),
      dynamicTyping: false, // Keep all as string initially
    });

    if (parseErrors.length > 0) {
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row + 2}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Committees CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {}).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const requiredHeaders = ['name', 'purpose', 'formationdate', 'status'];
    if (!requiredHeaders.every(rh => header.includes(rh))) {
      const missing = requiredHeaders.filter(rh => !header.includes(rh));
      return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importErrors: { row: number; message: string; data: any }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowIndex = i + 2; // CSV row number (1-based, +1 for header)

      const name = row.name?.toString().trim();
      const purpose = row.purpose?.toString().trim();
      const formationDateStr = row.formationdate?.toString().trim();
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = COMMITTEE_STATUS_OPTIONS.includes(statusRaw as CommitteeStatus) ? statusRaw as CommitteeStatus : undefined;

      if (!name || !purpose || !formationDateStr || !status) {
        importErrors.push({ row: rowIndex, message: "Missing required fields: name, purpose, formationDate, or status.", data: row });
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
        const instituteCode = row.institutecode?.toString().trim().toUpperCase();
        const foundInstitute = clientInstitutes.find(inst => (instituteName && inst.name.toLowerCase() === instituteName.toLowerCase()) || (instituteCode && inst.code.toUpperCase() === instituteCode));
        if (foundInstitute) {
          instituteId = foundInstitute.id;
        } else {
          importErrors.push({ row: rowIndex, message: `Institute not found by name '${instituteName}' or code '${instituteCode}'.`, data: row });
          skippedCount++; continue;
        }
      } else if (!clientInstitutes.some(inst => inst.id === instituteId)) {
        importErrors.push({ row: rowIndex, message: `Provided instituteId '${instituteId}' does not exist.`, data: row });
        skippedCount++; continue;
      }

      const committeeData: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'> = {
        name, purpose, instituteId, formationDate, status,
        description: row.description?.toString().trim() || undefined,
        dissolutionDate,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingCommitteeIndex = -1;

      if (idFromCsv) {
        existingCommitteeIndex = committeesStore.findIndex(c => c.id === idFromCsv);
      } else {
        existingCommitteeIndex = committeesStore.findIndex(c => c.name.toLowerCase() === name.toLowerCase() && c.instituteId === instituteId);
      }

      if (existingCommitteeIndex !== -1) {
        committeesStore[existingCommitteeIndex] = { ...committeesStore[existingCommitteeIndex], ...committeeData, updatedAt: now };
        updatedCount++;
      } else {
        if (committeesStore.some(c => c.name.toLowerCase() === name.toLowerCase() && c.instituteId === instituteId)) {
          importErrors.push({ row: rowIndex, message: `Committee with name '${name}' already exists for this institute.`, data: row });
          skippedCount++; continue;
        }
        const newCommittee: Committee = {
          id: idFromCsv || generateIdForImport(),
          ...committeeData,
          createdAt: now,
          updatedAt: now,
        };
        committeesStore.push(newCommittee);
        newCount++;
      }
    }

    global.__API_COMMITTEES_STORE__ = committeesStore;
    if (importErrors.length > 0) {
        return NextResponse.json({ 
            message: `Committees import partially completed with ${importErrors.length} issues.`, 
            newCount, 
            updatedCount, 
            skippedCount,
            errors: importErrors 
        }, { status: 207 }); // Multi-Status
    }
    return NextResponse.json({ message: 'Committees imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Critical error during committee import process:', error);
    return NextResponse.json({ message: 'Critical error during committee import process. Please check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
