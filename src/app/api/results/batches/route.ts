import { NextResponse, type NextRequest } from 'next/server';
import type { UploadBatch } from '@/types/entities';
import { ResultModel } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  try {
    // Use MongoDB aggregation to get batch summaries efficiently
    const batchSummaries = await ResultModel.aggregate([
      {
        $match: { uploadBatch: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: "$uploadBatch",
          count: { $sum: 1 },
          latestUpload: { $max: "$createdAt" }
        }
      },
      {
        $sort: { latestUpload: -1 }
      },
      {
        $limit: 20
      }
    ]);

    const batches: UploadBatch[] = batchSummaries.map(summary => ({
      _id: summary._id,
      count: summary.count,
      latestUpload: summary.latestUpload || new Date(0).toISOString(),
    }));

    return NextResponse.json({ status: 'success', data: { batches } });
  } catch (error) {
    console.error('Error fetching result batches:', error);
    return NextResponse.json({ message: 'Error fetching result batches.', error: (error as Error).message }, { status: 500 });
  }
}
