
import { NextResponse, type NextRequest } from 'next/server';
import type { Committee, UserRole, SystemUser as User } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { userService } from '@/lib/api/users';


declare global {
  var __API_COMMITTEES_STORE__: Committee[] | undefined;
}

if (!global.__API_COMMITTEES_STORE__) {
  global.__API_COMMITTEES_STORE__ = [];
}
let committeesStore: Committee[] = global.__API_COMMITTEES_STORE__;

interface RouteParams {
  params: {
    id: string;
  };
}

async function updateUserRole(userId: string, role: UserRole, add: boolean) {
  try {
    const user = await userService.getUserById(userId) as User;
    if (!user) return;

    let newRoles = [...user.roles];
    if (add && !newRoles.includes(role)) {
      newRoles.push(role);
    } else if (!add) {
      newRoles = newRoles.filter(r => r !== role);
    }

    if (JSON.stringify(newRoles.sort()) !== JSON.stringify(user.roles.sort())) {
      await userService.updateUser(userId, { roles: newRoles });
    }
  } catch (error) {
    console.error(`Failed to update role for user ${userId}:`, error);
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Committee data store corrupted.' }, { status: 500 });
  }
  const committee = committeesStore.find(c => c.id === id);
  if (committee) {
    return NextResponse.json(committee);
  }
  return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Committee data store corrupted.' }, { status: 500 });
  }
  try {
    const committeeData = await request.json() as Partial<Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>>;
    const committeeIndex = committeesStore.findIndex(c => c.id === id);

    if (committeeIndex === -1) {
      return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
    }
    const existingCommittee = committeesStore[committeeIndex];

    if (committeeData.name !== undefined && !committeeData.name.trim()) {
      return NextResponse.json({ message: 'Committee Name cannot be empty.' }, { status: 400 });
    }
    if (committeeData.purpose !== undefined && !committeeData.purpose.trim()) {
      return NextResponse.json({ message: 'Committee Purpose cannot be empty.' }, { status: 400 });
    }
     if (committeeData.instituteId !== undefined && !committeeData.instituteId) {
      return NextResponse.json({ message: 'Institute ID cannot be empty if provided for update.' }, { status: 400 });
    }
    if (committeeData.formationDate && !isValid(parseISO(committeeData.formationDate))) {
        return NextResponse.json({ message: 'Valid Formation Date is required (YYYY-MM-DD).' }, { status: 400 });
    }
    if (committeeData.dissolutionDate && committeeData.dissolutionDate !== null && !isValid(parseISO(committeeData.dissolutionDate))) {
        return NextResponse.json({ message: 'Valid Dissolution Date is required (YYYY-MM-DD) if provided.' }, { status: 400 });
    }
    if (committeeData.name && committeeData.name.trim().toLowerCase() !== existingCommittee.name.toLowerCase() && 
        committeesStore.some(c => c.id !== id && c.name.toLowerCase() === committeeData.name!.trim().toLowerCase() && c.instituteId === (committeeData.instituteId || existingCommittee.instituteId))) {
      return NextResponse.json({ message: `Committee with name '${committeeData.name.trim()}' already exists for this institute.` }, { status: 409 });
    }

    const oldConvenerId = existingCommittee.convenerId;
    const newConvenerId = committeeData.convenerId === undefined ? existingCommittee.convenerId : committeeData.convenerId;


    const updatedCommittee = { 
      ...existingCommittee, 
      ...committeeData,
      name: committeeData.name ? committeeData.name.trim() : existingCommittee.name,
      description: committeeData.description !== undefined ? committeeData.description.trim() || undefined : existingCommittee.description,
      purpose: committeeData.purpose ? committeeData.purpose.trim() : existingCommittee.purpose,
      dissolutionDate: committeeData.dissolutionDate === null ? undefined : committeeData.dissolutionDate || existingCommittee.dissolutionDate, // Allow clearing dissolutionDate
      convenerId: newConvenerId,
      updatedAt: new Date().toISOString(),
    };

    committeesStore[committeeIndex] = updatedCommittee;
    global.__API_COMMITTEES_STORE__ = committeesStore;

    if (oldConvenerId && oldConvenerId !== newConvenerId) {
      await updateUserRole(oldConvenerId, 'committee_convener', false);
    }
    if (newConvenerId && newConvenerId !== oldConvenerId) {
      await updateUserRole(newConvenerId, 'committee_convener', true);
    }


    return NextResponse.json(updatedCommittee);
  } catch (error) {
    console.error(`Error updating committee ${id}:`, error);
    return NextResponse.json({ message: `Error updating committee ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_COMMITTEES_STORE__)) {
    global.__API_COMMITTEES_STORE__ = [];
    return NextResponse.json({ message: 'Committee data store corrupted.' }, { status: 500 });
  }
  
  const committeeIndex = committeesStore.findIndex(c => c.id === id);
  if (committeeIndex === -1) {
    return NextResponse.json({ message: 'Committee not found' }, { status: 404 });
  }

  const deletedCommittee = committeesStore[committeeIndex];
  committeesStore.splice(committeeIndex, 1);
  global.__API_COMMITTEES_STORE__ = committeesStore;

  if (deletedCommittee.convenerId) {
    await updateUserRole(deletedCommittee.convenerId, 'committee_convener', false);
  }

  return NextResponse.json({ message: 'Committee deleted successfully' }, { status: 200 });
}
