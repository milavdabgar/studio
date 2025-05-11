import { NextResponse, type NextRequest } from 'next/server';
import type { Result } from '@/types/entities';

declare global {
  var __API_RESULTS_STORE__: Result[] | undefined;
}
if (!global.__API_RESULTS_STORE__) {
  global.__API_RESULTS_STORE__ = [];
}
const resultsStore: Result[] = global.__API_RESULTS_STORE__;

interface RouteParams {
  params: {
    id: string; // This 'id' corresponds to Result._id
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_RESULTS_STORE__)) {
    global.__API_RESULTS_STORE__ = [];
    return NextResponse.json({ message: 'Result data store corrupted.' }, { status: 500 });
  }
  const result = global.__API_RESULTS_STORE__.find(r => r._id === id);
  if (result) {
    return NextResponse.json({ status: 'success', data: { result }});
  }
  return NextResponse.json({ message: 'Result not found' }, { status: 404 });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_RESULTS_STORE__)) {
    global.__API_RESULTS_STORE__ = [];
    return NextResponse.json({ message: 'Result data store corrupted.' }, { status: 500 });
  }
  const initialLength = global.__API_RESULTS_STORE__.length;
  const newStore = global.__API_RESULTS_STORE__.filter(r => r._id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Result not found' }, { status: 404 });
  }
  
  global.__API_RESULTS_STORE__ = newStore;
  // resultsStore = global.__API_RESULTS_STORE__; // This line is redundant if resultsStore directly references the global one.
  return NextResponse.json({ message: 'Result deleted successfully' }, { status: 200 });
}
