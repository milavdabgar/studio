
import { NextResponse, type NextRequest } from 'next/server';
import type { Room, Building, RoomType, RoomStatus } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';
import { RoomModel, BuildingModel } from '@/lib/models';
import mongoose from 'mongoose';

const generateIdForImport = (): string => `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const ROOM_TYPE_OPTIONS_LOWER: string[] = ['lecture hall', 'laboratory', 'office', 'staff room', 'workshop', 'library', 'store room', 'other'];
const ROOM_STATUS_OPTIONS_LOWER: string[] = ['available', 'occupied', 'under_maintenance', 'unavailable'];

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
      console.error('CSV Parse Errors (Room Import):', JSON.stringify(parseErrors, null, 2));
      const errorMessages = parseErrors.map((e: ParseError) => `Row ${e.row}: ${e.message} (Code: ${e.code})`);
      return NextResponse.json({ message: 'Error parsing Rooms CSV file. Please check the file format and content.', errors: errorMessages }, { status: 400 });
    }

    const header = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['roomnumber', 'type', 'status'];

    if (!requiredHeaders.every(rh => header.includes(rh))) {
        const missing = requiredHeaders.filter(rh => !header.includes(rh));
        return NextResponse.json({ message: `CSV header is missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` }, { status: 400 });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of parsedData) {
      // Type the row object
      const csvRow = row as any;
      
      const roomNumber = csvRow.roomnumber?.toString().trim().toUpperCase();
      const typeRaw = csvRow.type?.toString().trim().toLowerCase();
      const type = ROOM_TYPE_OPTIONS_LOWER.includes(typeRaw) ? (typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).replace(/\s([a-z])/g, (match: string) => ` ${match.trim().toUpperCase()}`)) as RoomType : 'Other';
      
      const statusRaw = csvRow.status?.toString().trim().toLowerCase();
      const status = ROOM_STATUS_OPTIONS_LOWER.includes(statusRaw) ? statusRaw as RoomStatus : 'unavailable';

      if (!roomNumber) {
         console.warn(`Skipping room row: Missing room number. Row: ${JSON.stringify(row)}`);
        skippedCount++;
        continue;
      }

      let buildingId = csvRow.buildingid?.toString().trim();
      if (!buildingId) {
        const buildingName = csvRow.buildingname?.toString().trim();
        const buildingCode = csvRow.buildingcode?.toString().trim().toUpperCase();
        
        // Look up building in MongoDB
        const foundBuilding = await BuildingModel.findOne({
          $or: [
            ...(buildingName ? [{ name: { $regex: new RegExp(`^${buildingName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : []),
            ...(buildingCode ? [{ code: { $regex: new RegExp(`^${buildingCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : [])
          ]
        });
        
        if (foundBuilding) buildingId = foundBuilding._id.toString();
        else { 
            console.warn(`Skipping room ${roomNumber}: Could not find building by name/code. Row: ${JSON.stringify(row)}`);
            skippedCount++; continue; 
        }
      } else {
        // Verify building exists in MongoDB
        const buildingExists = await BuildingModel.findById(buildingId);
        if (!buildingExists) {
         console.warn(`Skipping room ${roomNumber}: Building ID ${buildingId} not found. Row: ${JSON.stringify(row)}`);
         skippedCount++; continue;
        }
      }

      const floor = csvRow.floor !== undefined && csvRow.floor !== null && !isNaN(Number(csvRow.floor)) ? Number(csvRow.floor) : undefined;
      const capacity = csvRow.capacity !== undefined && csvRow.capacity !== null && !isNaN(Number(csvRow.capacity)) && Number(csvRow.capacity) >=0 ? Number(csvRow.capacity) : undefined;
      const areaSqFt = csvRow.areasqft !== undefined && csvRow.areasqft !== null && !isNaN(Number(csvRow.areasqft)) && Number(csvRow.areasqft) >=0 ? Number(csvRow.areasqft) : undefined;

      const roomData: Partial<Room> = {
        roomNumber, type, status, buildingId,
        name: csvRow.name?.toString().trim() || undefined,
        floor, capacity, areaSqFt,
        notes: csvRow.notes?.toString().trim() || undefined,
      };

      const idFromCsv = csvRow.id?.toString().trim();
      let existingRoom = null;

      if (idFromCsv && mongoose.Types.ObjectId.isValid(idFromCsv)) {
        existingRoom = await RoomModel.findById(idFromCsv);
      } else {
        existingRoom = await RoomModel.findOne({ roomNumber, buildingId });
      }

      if (existingRoom) {
        await RoomModel.findByIdAndUpdate(existingRoom._id, roomData);
        updatedCount++;
      } else {
        // Check for duplicate room in building
        const duplicateRoom = await RoomModel.findOne({ roomNumber, buildingId });
        if (duplicateRoom) {
          console.warn(`Skipping room ${roomNumber}: Already exists in building ${buildingId}.`);
          skippedCount++; continue;
        }

        const newRoom = new RoomModel(roomData);
        await newRoom.save();
        newCount++;
      }
    }

    return NextResponse.json({ message: 'Rooms imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing rooms:', error);
    return NextResponse.json({ message: 'Error importing rooms.', error: (error as Error).message }, { status: 500 });
  }
}
