
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { connectMongoose } from '@/lib/mongodb';
import { CommitteeModel } from '@/lib/models';

// Initialize default committees if none exist
async function initializeDefaultCommittees() {
  await connectMongoose();
  const committeeCount = await CommitteeModel.countDocuments();
  
  if (committeeCount === 0) {
    const now = new Date().toISOString();
    const defaultCommittees = [
      {
        id: "cmt_arc_gpp",
        name: "Anti-Ragging Committee",
        code: "ARC_GPP",
        purpose: "To prevent ragging and ensure a safe campus environment.",
        instituteId: "inst1",
        formationDate: "2023-07-01",
        status: "active",
        convenerId: "user_hod_ce_gpp",
        members: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cmt_cwan_gpp",
        name: "College Website & Network Committee",
        code: "CWAN_GPP",
        description: "Manages and maintains the college website and network infrastructure.",
        purpose: "To oversee digital presence and IT infrastructure.",
        instituteId: "inst1",
        formationDate: "2023-01-15",
        status: "active",
        convenerId: "user_committee_convener_gpp",
        members: [],
        createdAt: now,
        updatedAt: now,
      }
    ];
    
    await CommitteeModel.insertMany(defaultCommittees);
  }
}


const generateId = (): string => `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;



export async function GET() {
  try {
    await connectMongoose();
    await initializeDefaultCommittees();
    
    const committees = await CommitteeModel.find({}).lean();
    
    // Format committees to ensure proper id field
    const committeesWithId = committees.map(committee => ({
      ...committee,
      id: committee.id || (committee as Record<string, unknown>)._id?.toString()
    }));

    return NextResponse.json(committeesWithId);
  } catch (error) {
    console.error('Error in GET /api/committees:', error);
    return NextResponse.json({ message: 'Internal server error processing committees request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const committeeData = await request.json() as Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>;

    if (!committeeData || !committeeData.name || !committeeData.name.trim()) {
      return NextResponse.json({ message: 'Committee Name is required.' }, { status: 400 });
    }
    if (!committeeData.code || !committeeData.code.trim()) {
      return NextResponse.json({ message: 'Committee Code is required.' }, { status: 400 });
    }
    if (!committeeData.purpose || !committeeData.purpose.trim()) {
      return NextResponse.json({ message: 'Committee Purpose is required.' }, { status: 400 });
    }
    if (!committeeData.type || !committeeData.type.trim()) {
      return NextResponse.json({ message: 'Committee Type is required.' }, { status: 400 });
    }
    if (!committeeData.chairperson) {
      return NextResponse.json({ message: 'Committee Chairperson is required.' }, { status: 400 });
    }
    if (!committeeData.instituteId) {
      return NextResponse.json({ message: 'Institute ID is required.' }, { status: 400 });
    }
    if (!committeeData.formationDate || !isValid(parseISO(committeeData.formationDate))) {
        return NextResponse.json({ message: 'Valid Formation Date is required (YYYY-MM-DD).' }, { status: 400 });
    }
    if (committeeData.dissolutionDate && !isValid(parseISO(committeeData.dissolutionDate))) {
        return NextResponse.json({ message: 'Valid Dissolution Date is required (YYYY-MM-DD) if provided.' }, { status: 400 });
    }
    
    // Validate email formats in chairperson and members
    if (committeeData.chairperson?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(committeeData.chairperson.email)) {
        return NextResponse.json({ message: 'Invalid chairperson email format.' }, { status: 400 });
      }
    }
    
    if (committeeData.members) {
      for (const member of committeeData.members) {
        if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
          return NextResponse.json({ message: 'Invalid member email format.' }, { status: 400 });
        }
        if (member.contactNumber && !/^[0-9]{10}$/.test(member.contactNumber)) {
          return NextResponse.json({ message: 'Contact number must be exactly 10 digits.' }, { status: 400 });
        }
      }
    }
    
    // Validate chairperson contact number
    if (committeeData.chairperson?.contactNumber && !/^[0-9]{10}$/.test(committeeData.chairperson.contactNumber)) {
      return NextResponse.json({ message: 'Chairperson contact number must be exactly 10 digits.' }, { status: 400 });
    }
    
    // Check for duplicates
    const existingByCode = await CommitteeModel.findOne({
      code: { $regex: new RegExp(`^${committeeData.code.trim()}$`, 'i') },
      instituteId: committeeData.instituteId
    });
    if (existingByCode) {
      return NextResponse.json({ message: `Committee with code '${committeeData.code.trim()}' already exists for this institute.` }, { status: 409 });
    }
    
    const existingByName = await CommitteeModel.findOne({
      name: { $regex: new RegExp(`^${committeeData.name.trim()}$`, 'i') },
      instituteId: committeeData.instituteId
    });
    if (existingByName) {
      return NextResponse.json({ message: `Committee with name '${committeeData.name.trim()}' already exists for this institute.` }, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newCommitteeData = {
      id: generateId(),
      name: committeeData.name.trim(),
      code: committeeData.code.trim().toUpperCase(),
      description: committeeData.description?.trim() || undefined,
      purpose: committeeData.purpose.trim(),
      instituteId: committeeData.instituteId,
      formationDate: committeeData.formationDate, 
      dissolutionDate: committeeData.dissolutionDate || undefined,
      type: committeeData.type || 'Academic',
      department: committeeData.department || undefined,
      chairperson: committeeData.chairperson || undefined,
      establishedDate: committeeData.establishedDate || committeeData.formationDate,
      meetingSchedule: committeeData.meetingSchedule || undefined,
      responsibilities: committeeData.responsibilities || [],
      status: committeeData.status || 'active',
      convenerId: committeeData.convenerId || undefined,
      members: committeeData.members || [],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newCommittee = new CommitteeModel(newCommitteeData);
    await newCommittee.save();
    
    // TODO: Role management functions need to be updated for MongoDB
    // await createOrUpdateCommitteeRoles(newCommittee, false); 
    // if (newCommittee.convenerId) {
    //   await updateUserConvenerRole(newCommittee.convenerId, newCommittee.code, newCommittee.name, true);
    // }
    
    return NextResponse.json(newCommittee.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json({ message: 'Error creating committee' }, { status: 500 });
  }
}
