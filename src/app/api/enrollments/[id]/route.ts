import { NextResponse, type NextRequest } from 'next/server';
import type { Enrollment, EnrollmentStatus } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { EnrollmentModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string; // Enrollment ID
  }>;
}

// GET a specific enrollment by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const enrollment = await EnrollmentModel.findOne({ id }).lean();
    if (enrollment) {
      // Format enrollment to ensure proper id field
      const enrollmentWithId = {
        ...enrollment,
        id: (enrollment as unknown as { id?: string; _id: { toString(): string } }).id || (enrollment as unknown as { id?: string; _id: { toString(): string } })._id.toString()
      };
      return NextResponse.json(enrollmentWithId);
    }
    return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching enrollment ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error fetching enrollment.', error: (error as Error).message }, { status: 500 });
  }
}

// PUT to update an enrollment (e.g., change status by admin/faculty)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const enrollmentDataToUpdate = await request.json() as Partial<Omit<Enrollment, 'id' | 'studentId' | 'courseOfferingId' | 'createdAt'>>;
    
    const existingEnrollment = await EnrollmentModel.findOne({ id }).lean();
    if (!existingEnrollment) {
      return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }
    
    // Validate status if provided
    if (enrollmentDataToUpdate.status) {
        const validStatuses: EnrollmentStatus[] = ['requested', 'enrolled', 'withdrawn', 'completed', 'failed', 'incomplete'];
        if(!validStatuses.includes(enrollmentDataToUpdate.status)) {
            return NextResponse.json({ message: `Invalid status: ${enrollmentDataToUpdate.status}`}, { status: 400 });
        }
    }

    const updateData = {
      ...enrollmentDataToUpdate,
      updatedAt: new Date().toISOString(),
    };

    const updatedEnrollment = await EnrollmentModel.findOneAndUpdate(
      { id },
      updateData,
      { new: true, lean: true }
    );

    if (!updatedEnrollment) {
      return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }

    // Format enrollment to ensure proper id field
    const enrollmentWithId = {
      ...updatedEnrollment,
      id: (updatedEnrollment as unknown as { id?: string; _id: { toString(): string } }).id || (updatedEnrollment as unknown as { id?: string; _id: { toString(): string } })._id.toString()
    };

    return NextResponse.json(enrollmentWithId);
  } catch (error) {
    console.error(`Error updating enrollment ${id}:`, error);
    return NextResponse.json({ message: `Error updating enrollment ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE an enrollment (e.g., student withdraws, admin removes)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    const deletedEnrollment = await EnrollmentModel.findOneAndDelete({ id });
    
    if (!deletedEnrollment) {
      return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error(`Error deleting enrollment ${id}:`, error);
    return NextResponse.json({ message: `Error deleting enrollment ${id}`, error: (error as Error).message }, { status: 500 });
  }
}
