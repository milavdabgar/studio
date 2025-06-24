import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, User, StaffCategory } from '@/types/entities'; 
import { userService } from '@/lib/api/users'; 

const facultyStore: Faculty[] = (global as any).__API_FACULTY_STORE__ || [];
if (!(global as any).__API_FACULTY_STORE__) {
  (global as any).__API_FACULTY_STORE__ = facultyStore;
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const faculty = facultyStore.find(f => f.id === id);
  if (faculty) {
    return NextResponse.json(faculty);
  }
  return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const facultyData = await request.json() as Partial<Omit<Faculty, 'id'>>;
    const facultyIndex = facultyStore.findIndex(f => f.id === id);

    if (facultyIndex === -1) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }
    const existingFaculty = facultyStore[facultyIndex];

    if (facultyData.staffCode && facultyData.staffCode.trim() !== existingFaculty.staffCode && facultyStore.some(f => f.id !== id && f.staffCode === facultyData.staffCode!.trim())) {
        return NextResponse.json({ message: `Staff code '${facultyData.staffCode.trim()}' already exists.` }, { status: 409 });
    }
    if (facultyData.instituteEmail && facultyData.instituteEmail.trim().toLowerCase() !== existingFaculty.instituteEmail.toLowerCase() && facultyStore.some(f => f.id !== id && f.instituteEmail.toLowerCase() === facultyData.instituteEmail!.trim().toLowerCase())) {
        return NextResponse.json({ message: `Institute email '${facultyData.instituteEmail.trim()}' is already in use.` }, { status: 409 });
    }

    const updatedFaculty = { ...existingFaculty, ...facultyData, staffCategory: facultyData.staffCategory || existingFaculty.staffCategory || 'Teaching' };
    facultyStore[facultyIndex] = updatedFaculty;
    (global as any).__API_FACULTY_STORE__ = facultyStore;

    // Update linked system user if it exists
    if (updatedFaculty.userId) {
        const userUpdateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {
            displayName: updatedFaculty.gtuName || `${updatedFaculty.title || ''} ${updatedFaculty.firstName || ''} ${updatedFaculty.middleName || ''} ${updatedFaculty.lastName || ''}`.replace(/\s+/g, ' ').trim() || updatedFaculty.staffCode,
            isActive: updatedFaculty.status === 'active',
        };
        if (updatedFaculty.instituteEmail.toLowerCase() !== existingFaculty.instituteEmail.toLowerCase()) {
             userUpdateData.instituteEmail = updatedFaculty.instituteEmail;
             if (existingFaculty.personalEmail === existingFaculty.instituteEmail) { 
                userUpdateData.email = updatedFaculty.personalEmail || updatedFaculty.instituteEmail;
             }
        }
         if(updatedFaculty.personalEmail && updatedFaculty.personalEmail !== existingFaculty.personalEmail){
            userUpdateData.email = updatedFaculty.personalEmail;
        }
        // Update roles based on staffCategory if it changed
        if (updatedFaculty.staffCategory !== existingFaculty.staffCategory) {
            const baseRole = updatedFaculty.staffCategory === 'Teaching' ? 'faculty' : (updatedFaculty.staffCategory?.toLowerCase() + '_staff' as UserRole) || 'faculty';
            const existingUser = await userService.getUserById(updatedFaculty.userId);
            if (existingUser) {
                const newRoles = existingUser.roles.filter(r => !r.endsWith('_staff') && r !== 'faculty'); // Remove old staff/faculty specific roles
                if (!newRoles.includes(baseRole)) {
                    newRoles.push(baseRole);
                }
                userUpdateData.roles = newRoles;
            }
        }


        try {
            await userService.updateUser(updatedFaculty.userId, userUpdateData);
        } catch(userError) {
            console.error(`Failed to update linked system user ${updatedFaculty.userId} for faculty ${updatedFaculty.id}:`, userError);
        }
    }


    return NextResponse.json(updatedFaculty);
  } catch (error) {
    console.error(`Error updating faculty ${id}:`, error);
    return NextResponse.json({ message: `Error updating faculty ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const facultyIndex = facultyStore.findIndex(f => f.id === id);

  if (facultyIndex === -1) {
    return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
  }
  
  const deletedFaculty = facultyStore.splice(facultyIndex, 1)[0];
  (global as any).__API_FACULTY_STORE__ = facultyStore;

  if (deletedFaculty.userId) {
      try {
          await userService.deleteUser(deletedFaculty.userId);
      } catch (userError: unknown) {
           const error = userError as Error & { data?: any };
           if (error.message?.includes('Cannot delete this administrative user') || (error.data && error.data.message?.includes('administrative user'))) {
            console.warn(`Administrative user ${deletedFaculty.userId} linked to faculty ${id} was not deleted.`);
          } else {
            console.error(`Failed to delete linked system user ${deletedFaculty.userId} for faculty ${id}:`, error);
          }
      }
  }

  return NextResponse.json({ message: 'Faculty deleted successfully' }, { status: 200 });
}

