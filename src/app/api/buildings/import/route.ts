
import { NextResponse, type NextRequest } from 'next/server';
import type { Building } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { BuildingModel, InstituteModel } from '@/lib/models';
import mongoose from 'mongoose';


export async function POST(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }


    const fileText = await file.text();

    const { data: parsedData, errors: parseErrors } = parse<Record<string, unknown>>(fileText, {
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

    for (const row of parsedData) {
      // Type the row object
      const csvRow = row as Record<string, unknown>;
      
      const name = csvRow.name?.toString().trim();
      const status = csvRow.status?.toString().trim().toLowerCase() as Building['status'];

      if (!name || !['active', 'inactive', 'under_maintenance'].includes(status)) {
        console.warn(`Skipping building row: Missing or invalid required data (name, status). Row: ${JSON.stringify(row)}`);
        skippedCount++;
        continue;
      }

      let instituteId = csvRow.instituteid?.toString().trim();
      const instituteName = csvRow.institutename?.toString().trim();
      const instituteCode = csvRow.institutecode?.toString().trim().toUpperCase();

      if (!instituteId) {
        // Try to find existing institute in MongoDB
        const foundInstitute = await InstituteModel.findOne({
          $or: [
            ...(instituteName ? [{ name: { $regex: new RegExp(`^${instituteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : []),
            ...(instituteCode ? [{ code: { $regex: new RegExp(`^${instituteCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : [])
          ]
        });
        
        if (foundInstitute) {
            instituteId = foundInstitute._id.toString();
        } else {
            console.warn(`Skipping row for building ${name}: Could not find matching institute by name '${instituteName}' or code '${instituteCode}'.`);
            skippedCount++;
            continue;
        }
      } else {
        // Verify the provided instituteId exists in MongoDB
        const instituteExists = await InstituteModel.findById(instituteId);
        if (!instituteExists) {
            console.warn(`Skipping row for building ${name}: Provided instituteId '${instituteId}' does not exist.`);
            skippedCount++;
            continue;
        }
      }
      
      const constructionYear = csvRow.constructionyear !== undefined && csvRow.constructionyear !== null && !isNaN(Number(csvRow.constructionyear)) ? Number(csvRow.constructionyear) : undefined;
      if (constructionYear && (constructionYear < 1800 || constructionYear > new Date().getFullYear() + 5)) {
        console.warn(`Skipping row for building ${name}: Invalid construction year ${constructionYear}.`);
        skippedCount++;
        continue;
      }

      const numberOfFloors = csvRow.numberoffloors !== undefined && csvRow.numberoffloors !== null && !isNaN(Number(csvRow.numberoffloors)) && Number(csvRow.numberoffloors) >=0 ? Number(csvRow.numberoffloors) : undefined;
      const totalAreaSqFt = csvRow.totalareasqft !== undefined && csvRow.totalareasqft !== null && !isNaN(Number(csvRow.totalareasqft)) && Number(csvRow.totalareasqft) >=0 ? Number(csvRow.totalareasqft) : undefined;

      const buildingData: Partial<Building> = {
        name,
        status,
        instituteId,
        code: csvRow.code?.toString().trim().toUpperCase() || undefined,
        description: csvRow.description?.toString().trim() || undefined,
        constructionYear,
        numberOfFloors,
        totalAreaSqFt,
      };

      const idFromCsv = csvRow.id?.toString().trim();
      let existingBuilding = null;

      if (idFromCsv && mongoose.Types.ObjectId.isValid(idFromCsv)) {
        existingBuilding = await BuildingModel.findById(idFromCsv);
        if (existingBuilding && buildingData.code && buildingData.code !== existingBuilding.code) {
          const duplicateCodeBuilding = await BuildingModel.findOne({ 
            _id: { $ne: idFromCsv }, 
            instituteId, 
            code: buildingData.code 
          });
          if (duplicateCodeBuilding) {
            console.warn(`Skipping update for building ID ${idFromCsv}: Code ${buildingData.code} from CSV conflicts with another existing building in the same institute.`);
            skippedCount++;
            continue; 
          }
        }
      } else { 
        if (buildingData.code) { 
          existingBuilding = await BuildingModel.findOne({ instituteId, code: buildingData.code });
        } else { 
          existingBuilding = await BuildingModel.findOne({ 
            instituteId, 
            name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          });
        }
      }

      if (existingBuilding) {
        await BuildingModel.findByIdAndUpdate(existingBuilding._id, buildingData);
        updatedCount++;
      } else {
        if (buildingData.code) {
          const duplicateCodeBuilding = await BuildingModel.findOne({ instituteId, code: buildingData.code });
          if (duplicateCodeBuilding) {
             console.warn(`Skipping new building: Code ${buildingData.code} (for ${name}) already exists in institute ${instituteId}.`);
             skippedCount++;
             continue;
          }
        }
        
        if (!buildingData.code) {
          const duplicateNameBuilding = await BuildingModel.findOne({ 
            instituteId, 
            name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          });
          if (duplicateNameBuilding) {
             console.warn(`Skipping new building: Name ${name} already exists in institute ${instituteId} (and no code provided for differentiation).`);
             skippedCount++;
             continue;
          }
        }

        const newBuilding = new BuildingModel(buildingData);
        await newBuilding.save();
        newCount++;
      }
    }

    return NextResponse.json({ message: 'Buildings imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing buildings:', error);
    return NextResponse.json({ message: 'Error importing buildings.', error: (error as Error).message }, { status: 500 });
  }
}
