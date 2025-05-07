
import { NextResponse, type NextRequest } from 'next/server';
import type { Faculty, SystemUser } from '@/types/entities';
import { userService } from '@/lib/api/users'; // For updating/deleting linked user

// In-memory store (replace with DB)
let facultyStore: Faculty[] = (global as any).__API_FACULTY_STORE__ || [];
if (!(global as any).__API_FACULTY_STORE__) {
  (global as any).__API_FACULTY_STORE__ = facultyStore;
}

interface RouteParams {
  params: {
    id: string;
  };
}

const findUserByFacultyEmail = async (email: string): Promise<SystemUser | undefined> => {
    const users = await userService.getAllUsers(); // In a real app, this might be a direct DB query
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const faculty = facultyStore.find(f => f.id === id);
  if (faculty) {
    return NextResponse.json(faculty);
  }
  return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
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

    const updatedFaculty = { ...existingFaculty, ...facultyData };
    facultyStore[facultyIndex] = updatedFaculty;
    (global as any).__API_FACULTY_STORE__ = facultyStore;

    // Update linked system user if email or name changes
    const linkedUser = await findUserByFacultyEmail(existingFaculty.instituteEmail);
    if (linkedUser) {
        const userUpdateData: Partial<SystemUser> = {
            name: updatedFaculty.gtuName || `${updatedFaculty.title || ''} ${updatedFaculty.firstName || ''} ${updatedFaculty.middleName || ''} ${updatedFaculty.lastName || ''}`.replace(/\s+/g, ' ').trim() || updatedFaculty.staffCode,
            status: updatedFaculty.status === 'active' ? 'active' : 'inactive',
            department: updatedFaculty.department,
        };
        if (updatedFaculty.instituteEmail.toLowerCase() !== linkedUser.email.toLowerCase()) {
            // Email change is complex, might need new user creation or specific handling
            // For now, we assume instituteEmail (login email) might not be directly updatable post-creation
            // or would require special handling. Here we'll just update other fields.
            console.warn(`Institute email change detected for faculty ${updatedFaculty.id}. System user email ${linkedUser.email} was not updated. Manual intervention may be needed.`);
        }
        try {
            await userService.updateUser(linkedUser.id, userUpdateData);
        } catch(userError) {
            console.error(`Failed to update linked system user ${linkedUser.id} for faculty ${updatedFaculty.id}:`, userError);
            // Decide if this should fail the faculty update or just log a warning
        }
    }


    return NextResponse.json(updatedFaculty);
  } catch (error) {
    console.error(`Error updating faculty ${id}:`, error);
    return NextResponse.json({ message: `Error updating faculty ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const facultyIndex = facultyStore.findIndex(f => f.id === id);

  if (facultyIndex === -1) {
    return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
  }
  
  const deletedFaculty = facultyStore.splice(facultyIndex, 1)[0];
  (global as any).__API_FACULTY_STORE__ = facultyStore;

  // Attempt to delete linked system user
  const linkedUser = await findUserByFacultyEmail(deletedFaculty.instituteEmail);
  if (linkedUser) {
      try {
          await userService.deleteUser(linkedUser.id);
      } catch (userError) {
          console.error(`Failed to delete linked system user ${linkedUser.id} for faculty ${id}:`, userError);
          // Log error but don't fail faculty deletion if user deletion fails
      }
  }

  return NextResponse.json({ message: 'Faculty deleted successfully' }, { status: 200 });
}
