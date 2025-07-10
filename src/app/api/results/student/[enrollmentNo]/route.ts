import { NextResponse, type NextRequest } from 'next/server';
import { ResultModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    enrollmentNo: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  try {
    const { enrollmentNo } = await params;
    
    const studentResults = await ResultModel.find({ enrollmentNo })
      .sort({ semester: 1, examid: 1 })
      .lean();
    
    if (studentResults.length > 0) {
      return NextResponse.json({ status: 'success', data: { results: studentResults }});
    }
    return NextResponse.json({ status: 'success', data: { results: [] }, message: 'No results found for this student.' });
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json({ message: 'Error fetching student results.' }, { status: 500 });
  }
}
