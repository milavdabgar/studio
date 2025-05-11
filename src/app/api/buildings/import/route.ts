
import { NextResponse, type NextRequest } from 'next/server';
import type { Building, Institute } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';

let buildingsStore: Building[] = (global as any).__API_BUILDINGS_STORE__ || [];
if (!(global as any).__API_BUILDINGS_STORE__) {
  (global as any).__API_BUILDINGS_STORE__ = buildingsStore;
}
// let institutesStore: Institute[] = (global as any).institutes || []; // Ensure institutes are loaded (handled by client sending data)

const generateIdForImport = (): string => `bldg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
      dynamicTyping: true,
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors (Building Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Buildings CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['name', 'status']; 

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    parsedData.forEach((row: unknown) => {
      const name = row.name?.toString().trim();
      const status = row.status?.toString().trim().toLowerCase() as Building['status'];

      if (!name || !['active', 'inactive', 'under_maintenance'].includes(status)) {
        console.warn(`Skipping building row: Missing or invalid required data (name, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }

      let instituteId = row.instituteid?.toString().trim();
      const instituteName = row.institutename?.toString().trim();
      const instituteCode = row.institutecode?.toString().trim().toUpperCase();

      if (!instituteId) {
        const foundInstitute = clientInstitutes.find(i => 
            (instituteName && i.name.toLowerCase() === instituteName.toLowerCase()) ||
            (instituteCode && i.code.toUpperCase() === instituteCode)
        );
        if (foundInstitute) {
            instituteId = foundInstitute.id;
        } else {
            console.warn(`Skipping row for building ${name}: Could not find matching institute by name '${instituteName}' or code '${instituteCode}'.`);
            skippedCount++;
            return;
        }
      } else {
         if (!clientInstitutes.some(i => i.id === instituteId)) {
            console.warn(`Skipping row for building ${name}: Provided instituteId '${instituteId}' does not exist.`);
            skippedCount++;
            return;
        }
      }
      
      const constructionYear = row.constructionyear !== undefined && row.constructionyear !== null && !isNaN(Number(row.constructionyear)) ? Number(row.constructionyear) : undefined;
      if (constructionYear && (constructionYear < 1800 || constructionYear > new Date().getFullYear() + 5)) {
        console.warn(`Skipping row for building ${name}: Invalid construction year ${constructionYear}.`);
        skippedCount++;
        return;
      }

      const numberOfFloors = row.numberoffloors !== undefined && row.numberoffloors !== null && !isNaN(Number(row.numberoffloors)) && Number(row.numberoffloors) >=0 ? Number(row.numberoffloors) : undefined;
      const totalAreaSqFt = row.totalareasqft !== undefined && row.totalareasqft !== null && !isNaN(Number(row.totalareasqft)) && Number(row.totalareasqft) >=0 ? Number(row.totalareasqft) : undefined;


      const buildingData: Omit<Building, 'id'> = {
        name,
        status,
        instituteId,
        code: row.code?.toString().trim().toUpperCase() || undefined,
        description: row.description?.toString().trim() || undefined,
        constructionYear,
        numberOfFloors,
        totalAreaSqFt,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingBuildingIndex = -1;

      if (idFromCsv) {
        existingBuildingIndex = buildingsStore.findIndex(b => b.id === idFromCsv);
        if (existingBuildingIndex !== -1 && buildingData.code && buildingData.code !== buildingsStore[existingBuildingIndex].code && buildingsStore.some(b => b.id !== idFromCsv && b.instituteId === instituteId && b.code === buildingData.code)) {
          console.warn(`Skipping update for building ID ${idFromCsv}: Code ${buildingData.code} from CSV conflicts with another existing building in the same institute.`);
          skippedCount++;
          return; 
        }
      } else { 
        if (buildingData.code) { 
            existingBuildingIndex = buildingsStore.findIndex(b => b.instituteId === instituteId && b.code === buildingData.code);
        } else { 
            existingBuildingIndex = buildingsStore.findIndex(b => b.instituteId === instituteId && b.name.toLowerCase() === name.toLowerCase());
        }
      }


      if (existingBuildingIndex !== -1) {
        buildingsStore[existingBuildingIndex] = { ...buildingsStore[existingBuildingIndex], ...buildingData };
        updatedCount++;
      } else {
        if (buildingData.code && buildingsStore.some(b => b.instituteId === instituteId && b.code === buildingData.code)) {
             console.warn(`Skipping new building: Code ${buildingData.code} (for ${name}) already exists in institute ${instituteId}.`);
             skippedCount++;
             return;
        }
         if (!buildingData.code && buildingsStore.some(b => b.instituteId === instituteId && b.name.toLowerCase() === name.toLowerCase())) {
             console.warn(`Skipping new building: Name ${name} already exists in institute ${instituteId} (and no code provided for differentiation).`);
             skippedCount++;
             return;
        }

        const newBuilding: Building = {
          id: idFromCsv || generateIdForImport(), 
          ...buildingData,
        };
        buildingsStore.push(newBuilding);
        newCount++;
      }
    });
    (global as any).__API_BUILDINGS_STORE__ = buildingsStore;
    return NextResponse.json({ message: 'Buildings imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing buildings:', error);
    return NextResponse.json({ message: 'Error importing buildings.', error: (error as Error).message }, { status: 500 });
  }
}
