
import { NextResponse, type NextRequest } from 'next/server';
import type { Building, Institute } from '@/types/entities';
import { parse } from 'papaparse';

let buildingsStore: Building[] = (global as any).buildingsStore || [];
if (!(global as any).buildingsStore) {
  (global as any).buildingsStore = buildingsStore;
}
let institutesStore: Institute[] = (global as any).institutes || []; // Ensure institutes are loaded

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
    });

    if (parseErrors.length > 0) {
      console.error('CSV Parse Errors:', parseErrors);
      return NextResponse.json({ message: 'Error parsing CSV file.', errors: parseErrors.map(e => e.message) }, { status: 400 });
    }
    
    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['name', 'status']; // instituteId or (instituteName and instituteCode) checked later

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    parsedData.forEach((row: any) => {
      const name = row.name?.trim();
      const status = row.status?.trim().toLowerCase() as Building['status'];

      if (!name || !['active', 'inactive', 'under_maintenance'].includes(status)) {
        console.warn(`Skipping row: Missing or invalid required data (name, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }

      let instituteId = row.instituteid?.trim();
      const instituteName = row.institutename?.trim();
      const instituteCode = row.institutecode?.trim().toUpperCase();

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
      
      const constYearStr = row.constructionyear?.trim();
      const constructionYear = constYearStr && !isNaN(parseInt(constYearStr)) ? parseInt(constYearStr) : undefined;
      if (constructionYear && (constructionYear < 1800 || constructionYear > new Date().getFullYear() + 5)) {
        console.warn(`Skipping row for building ${name}: Invalid construction year ${constructionYear}.`);
        skippedCount++;
        return;
      }

      const numFloorsStr = row.numberoffloors?.trim();
      const numberOfFloors = numFloorsStr && !isNaN(parseInt(numFloorsStr)) && parseInt(numFloorsStr) >= 0 ? parseInt(numFloorsStr) : undefined;
      
      const areaSqFtStr = row.totalareasqft?.trim();
      const totalAreaSqFt = areaSqFtStr && !isNaN(parseFloat(areaSqFtStr)) && parseFloat(areaSqFtStr) >= 0 ? parseFloat(areaSqFtStr) : undefined;


      const buildingData: Omit<Building, 'id'> = {
        name,
        status,
        instituteId,
        code: row.code?.trim().toUpperCase() || undefined,
        description: row.description?.trim() || undefined,
        constructionYear,
        numberOfFloors,
        totalAreaSqFt,
      };

      const idFromCsv = row.id?.trim();
      let existingBuildingIndex = -1;

      if (idFromCsv) {
        existingBuildingIndex = buildingsStore.findIndex(b => b.id === idFromCsv);
        if (existingBuildingIndex !== -1 && buildingData.code && buildingData.code !== buildingsStore[existingBuildingIndex].code && buildingsStore.some(b => b.id !== idFromCsv && b.instituteId === instituteId && b.code === buildingData.code)) {
          console.warn(`Skipping update for ID ${idFromCsv}: Code ${buildingData.code} from CSV conflicts with another existing building in the same institute.`);
          skippedCount++;
          return; 
        }
      } else { 
        if (buildingData.code) { // Try to find by code and institute if no ID
            existingBuildingIndex = buildingsStore.findIndex(b => b.instituteId === instituteId && b.code === buildingData.code);
        } else { // Try to find by name and institute if no ID and no code
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

    return NextResponse.json({ message: 'Buildings imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing buildings:', error);
    return NextResponse.json({ message: 'Error importing buildings.', error: (error as Error).message }, { status: 500 });
  }
}

