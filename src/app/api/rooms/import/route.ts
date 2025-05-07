
import { NextResponse, type NextRequest } from 'next/server';
import type { Room, Building, RoomType, RoomStatus } from '@/types/entities';
import { parse, type ParseError } from 'papaparse';

let roomsStore: Room[] = (global as any).__API_ROOMS_STORE__ || [];
if (!(global as any).__API_ROOMS_STORE__) {
  (global as any).__API_ROOMS_STORE__ = roomsStore;
}
// let buildingsStore: Building[] = (global as any).buildings || []; // Client sends this

const generateIdForImport = (): string => `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const ROOM_TYPE_OPTIONS_LOWER: string[] = ['lecture hall', 'laboratory', 'office', 'staff room', 'workshop', 'library', 'store room', 'other'];
const ROOM_STATUS_OPTIONS_LOWER: string[] = ['available', 'occupied', 'under_maintenance', 'unavailable'];


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const buildingsJson = formData.get('buildings') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }
    if (!buildingsJson) {
      return NextResponse.json({ message: 'Building data for mapping is missing.' }, { status: 400 });
    }
    const clientBuildings: Building[] = JSON.parse(buildingsJson);

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

    parsedData.forEach((row: any) => {
      const roomNumber = row.roomnumber?.toString().trim().toUpperCase();
      const typeRaw = row.type?.toString().trim().toLowerCase();
      const type = ROOM_TYPE_OPTIONS_LOWER.includes(typeRaw) ? (typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).replace(/\s([a-z])/g, (match) => ` ${match.trim().toUpperCase()}`)) as RoomType : 'Other';
      
      const statusRaw = row.status?.toString().trim().toLowerCase();
      const status = ROOM_STATUS_OPTIONS_LOWER.includes(statusRaw) ? statusRaw as RoomStatus : 'unavailable';


      if (!roomNumber) {
         console.warn(`Skipping room row: Missing room number. Row: ${JSON.stringify(row)}`);
        skippedCount++;
        return;
      }

      let buildingId = row.buildingid?.toString().trim();
      if (!buildingId) {
        const buildingName = row.buildingname?.toString().trim();
        const buildingCode = row.buildingcode?.toString().trim().toUpperCase();
        const foundBuilding = clientBuildings.find(b => (buildingName && b.name.toLowerCase() === buildingName.toLowerCase()) || (buildingCode && b.code?.toUpperCase() === buildingCode));
        if (foundBuilding) buildingId = foundBuilding.id;
        else { 
            console.warn(`Skipping room ${roomNumber}: Could not find building by name/code. Row: ${JSON.stringify(row)}`);
            skippedCount++; return; 
        }
      } else if (!clientBuildings.some(b => b.id === buildingId)) {
         console.warn(`Skipping room ${roomNumber}: Building ID ${buildingId} not found. Row: ${JSON.stringify(row)}`);
         skippedCount++; return;
      }

      const floor = row.floor !== undefined && row.floor !== null && !isNaN(Number(row.floor)) ? Number(row.floor) : undefined;
      const capacity = row.capacity !== undefined && row.capacity !== null && !isNaN(Number(row.capacity)) && Number(row.capacity) >=0 ? Number(row.capacity) : undefined;
      const areaSqFt = row.areasqft !== undefined && row.areasqft !== null && !isNaN(Number(row.areasqft)) && Number(row.areasqft) >=0 ? Number(row.areasqft) : undefined;

      const roomData: Omit<Room, 'id'> = {
        roomNumber, type, status, buildingId,
        name: row.name?.toString().trim() || undefined,
        floor, capacity, areaSqFt,
        notes: row.notes?.toString().trim() || undefined,
      };

      const idFromCsv = row.id?.toString().trim();
      let existingRoomIndex = -1;

      if (idFromCsv) {
        existingRoomIndex = roomsStore.findIndex(r => r.id === idFromCsv);
      } else {
        existingRoomIndex = roomsStore.findIndex(r => r.roomNumber === roomNumber && r.buildingId === buildingId);
      }

      if (existingRoomIndex !== -1) {
        roomsStore[existingRoomIndex] = { ...roomsStore[existingRoomIndex], ...roomData };
        updatedCount++;
      } else {
        if(roomsStore.some(r => r.roomNumber === roomNumber && r.buildingId === buildingId)){
            console.warn(`Skipping new room ${roomNumber} in building ${buildingId}: Already exists.`);
            skippedCount++; return;
        }
        const newRoom: Room = { id: idFromCsv || generateIdForImport(), ...roomData };
        roomsStore.push(newRoom);
        newCount++;
      }
    });
    (global as any).__API_ROOMS_STORE__ = roomsStore;
    return NextResponse.json({ message: 'Rooms imported successfully.', newCount, updatedCount, skippedCount }, { status: 200 });

  } catch (error) {
    console.error('Error importing rooms:', error);
    return NextResponse.json({ message: 'Error importing rooms.', error: (error as Error).message }, { status: 500 });
  }
}
