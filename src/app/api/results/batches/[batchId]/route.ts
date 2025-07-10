import { NextResponse, type NextRequest } from 'next/server';
import { ResultModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    batchId: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  try {
    const { batchId } = await params;

    const deleteResult = await ResultModel.deleteMany({ uploadBatch: batchId });
    const deletedCount = deleteResult.deletedCount || 0;

    if (deletedCount === 0) {
      return NextResponse.json({ message: 'No results found for this batch ID to delete.' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'success', 
      data: { deletedCount } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting results batch:', error);
    return NextResponse.json({ message: 'Error deleting results batch.' }, { status: 500 });
  }
}
