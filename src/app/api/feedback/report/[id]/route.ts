// src/app/api/feedback/report/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { FeedbackAnalysisModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');

    const { id  } = await params;
    const result = await FeedbackAnalysisModel.findOne({ id });

    if (!result) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching feedback report:', error);
    return NextResponse.json({ error: 'Error fetching report', details: (error as Error).message }, { status: 500 });
  }
}