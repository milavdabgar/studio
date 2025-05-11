import { NextResponse, type NextRequest } from 'next/server';
import type { Result } from '@/types/entities';

declare global {
  var __API_RESULTS_STORE__: Result[] | undefined;
}
if (!global.__API_RESULTS_STORE__) {
  global.__API_RESULTS_STORE__ = [];
}
// let resultsStore: Result[] = global.__API_RESULTS_STORE__; // No need to reassign here, work on global directly

interface RouteParams {
  params: {
    batchId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { batchId } = params;
  if (!Array.isArray(global.__API_RESULTS_STORE__)) {
    global.__API_RESULTS_STORE__ = [];
    return NextResponse.json({ message: 'Result data store corrupted.' }, { status: 500 });
  }

  const initialLength = global.__API_RESULTS_STORE__.length;
  const newStore = global.__API_RESULTS_STORE__.filter(r => r.uploadBatch !== batchId);
  const deletedCount = initialLength - newStore.length;

  if (deletedCount === 0) {
    return NextResponse.json({ message: 'No results found for this batch ID to delete.' }, { status: 404 });
  }
  
  global.__API_RESULTS_STORE__ = newStore;
  // resultsStore = global.__API_RESULTS_STORE__; // Redundant if working on global directly

  return NextResponse.json({ 
    status: 'success', 
    data: { deletedCount } 
  }, { status: 200 });
}
