import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { StudentModel } from '@/lib/models';
import { userService } from '@/lib/api/users';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Find the student first
    let student = await StudentModel.findOne({ id }).lean() as any;
    if (!student && id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await StudentModel.findById(id).lean() as any;
    }
    
    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    
    // Check if student has a linked user
    if (!student.userId) {
      return NextResponse.json({ message: 'Student has no linked user account' }, { status: 400 });
    }
    
    // Use the user service to remove the student role
    try {
      const result = await userService.removeUserRole(student.userId, 'student');
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error removing student role:', error);
      return NextResponse.json({ 
        message: 'Failed to remove student role', 
        error: (error as Error).message 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in student role removal:', error);
    return NextResponse.json({ 
      message: 'Internal server error during student role removal',
      error: (error as Error).message 
    }, { status: 500 });
  }
}