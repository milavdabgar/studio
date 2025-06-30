import { NextResponse, type NextRequest } from 'next/server';
import type { Enrollment, EnrollmentStatus } from '@/types/entities';

// Ensure the global store is initialized
declare global {
  // eslint-disable-next-line no-var
  var __API_ENROLLMENTS_STORE__: Enrollment[] | undefined;
}
if (!global.__API_ENROLLMENTS_STORE__) {
  global.__API_ENROLLMENTS_STORE__ = [];
}
let enrollmentsStore: Enrollment[] = global.__API_ENROLLMENTS_STORE__;

interface RouteParams {
  params: Promise<{
    id: string; // Enrollment ID
  }>;
}

// GET a specific enrollment by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id  } = await params;
  const enrollment = enrollmentsStore.find(e => e.id === id);
  if (enrollment) {
    return NextResponse.json(enrollment);
  }
  return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
}

// PUT to update an enrollment (e.g., change status by admin/faculty)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id  } = await params;
  try {
    const enrollmentDataToUpdate = await request.json() as Partial<Omit<Enrollment, 'id' | 'studentId' | 'courseOfferingId' | 'createdAt'>>;
    const enrollmentIndex = enrollmentsStore.findIndex(e => e.id === id);

    if (enrollmentIndex === -1) {
      return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }

    const existingEnrollment = enrollmentsStore[enrollmentIndex];
    
    // Validate status if provided
    if (enrollmentDataToUpdate.status) {
        const validStatuses: EnrollmentStatus[] = ['requested', 'enrolled', 'withdrawn', 'completed', 'failed', 'incomplete'];
        if(!validStatuses.includes(enrollmentDataToUpdate.status)) {
            return NextResponse.json({ message: `Invalid status: ${enrollmentDataToUpdate.status}`}, { status: 400 });
        }
    }

    const updatedEnrollment: Enrollment = {
      ...existingEnrollment,
      ...enrollmentDataToUpdate,
      updatedAt: new Date().toISOString(),
    };

    enrollmentsStore[enrollmentIndex] = updatedEnrollment;
    global.__API_ENROLLMENTS_STORE__ = enrollmentsStore;

    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error(`Error updating enrollment ${id}:`, error);
    return NextResponse.json({ message: `Error updating enrollment ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE an enrollment (e.g., student withdraws, admin removes)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id  } = await params;
  const initialLength = enrollmentsStore.length;
  enrollmentsStore = enrollmentsStore.filter(e => e.id !== id);

  if (enrollmentsStore.length === initialLength) {
    return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
  }
  global.__API_ENROLLMENTS_STORE__ = enrollmentsStore;
  return NextResponse.json({ message: 'Enrollment deleted successfully' });
}
