import { NextResponse, type NextRequest } from 'next/server';
import type { Result, ResultSubject } from '@/types/entities';

declare global {
  var __API_RESULTS_STORE__: Result[] | undefined;
}
if (!global.__API_RESULTS_STORE__) {
  global.__API_RESULTS_STORE__ = [];
}
const resultsStore: Result[] = global.__API_RESULTS_STORE__;

interface RouteParams {
  params: Promise<{
    id: string; // This 'id' corresponds to Result._id
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id  } = await params;
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { id  } = await params;
    try {
        const resultDataToUpdate = await request.json() as Partial<Omit<Result, '_id' | 'createdAt' | 'updatedAt'>>;
        const resultIndex = resultsStore.findIndex(r => r._id === id);

        if (resultIndex === -1) {
            return NextResponse.json({ message: 'Result record not found' }, { status: 404 });
        }
        const existingResult = resultsStore[resultIndex];

        // Perform any specific validation for result update here if needed
        // e.g., ensuring subject grades are valid, spi/cpi calculations are consistent (though typically backend would do this)

        const updatedResult: Result = {
            ...existingResult,
            ...resultDataToUpdate,
            updatedAt: new Date().toISOString(),
        };
        
        // If subjects are updated, recalculate credits/spi/cpi if necessary
        if (resultDataToUpdate.subjects) {
            updatedResult.totalCredits = resultDataToUpdate.subjects.reduce((sum, sub) => sum + (sub.credits || 0), 0);
            updatedResult.earnedCredits = resultDataToUpdate.subjects.reduce((sum, sub) => sum + (!sub.isBacklog && sub.credits ? sub.credits : 0), 0);
            // SPI/CPI calculation would be more complex and might involve historical data.
            // For a simple update, we might just accept the SPI/CPI if provided, or mark as needing recalculation.
            // Here, we'll just update based on provided data.
        }


        resultsStore[resultIndex] = updatedResult;
        global.__API_RESULTS_STORE__ = resultsStore;

        return NextResponse.json(updatedResult);

    } catch (error) {
        console.error(`Error updating result ${id}:`, error);
        return NextResponse.json({ message: `Error updating result ${id}`, error: (error as Error).message }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id  } = await params;
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
