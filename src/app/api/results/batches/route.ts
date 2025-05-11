import { NextResponse, type NextRequest } from 'next/server';
import type { Result, UploadBatch } from '@/types/entities';

declare global {
  var __API_RESULTS_STORE__: Result[] | undefined;
}
if (!global.__API_RESULTS_STORE__) {
  global.__API_RESULTS_STORE__ = [];
}
const resultsStore: Result[] = global.__API_RESULTS_STORE__;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_RESULTS_STORE__)) {
    global.__API_RESULTS_STORE__ = [];
    return NextResponse.json({ message: 'Result data store corrupted.' }, { status: 500 });
  }

  const batchSummary: { [key: string]: { count: number; latestUpload: string } } = {};

  resultsStore.forEach(result => {
    if (result.uploadBatch) {
      if (!batchSummary[result.uploadBatch]) {
        batchSummary[result.uploadBatch] = { count: 0, latestUpload: result.createdAt || new Date(0).toISOString() };
      }
      batchSummary[result.uploadBatch].count++;
      if (result.createdAt && new Date(result.createdAt) > new Date(batchSummary[result.uploadBatch].latestUpload)) {
        batchSummary[result.uploadBatch].latestUpload = result.createdAt;
      }
    }
  });

  const batches: UploadBatch[] = Object.entries(batchSummary)
    .map(([batchId, data]) => ({
      _id: batchId,
      count: data.count,
      latestUpload: data.latestUpload,
    }))
    .sort((a, b) => new Date(b.latestUpload).getTime() - new Date(a.latestUpload).getTime())
    .slice(0, 20); // Limit to recent 20 batches as in reference

  return NextResponse.json({ status: 'success', data: { batches } });
}
