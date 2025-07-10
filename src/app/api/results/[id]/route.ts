import { NextResponse, type NextRequest } from 'next/server';
import type { Result } from '@/types/entities';
import mongoose from 'mongoose';
import { ResultModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string; // This 'id' corresponds to Result._id
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const { id } = await params;
    const result = await ResultModel.findOne({
      $or: [
        { id: id },
        { _id: id }
      ]
    });
    
    if (result) {
      return NextResponse.json({ status: 'success', data: { result }});
    }
    return NextResponse.json({ message: 'Result not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json({ message: 'Error fetching result' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
        
        const { id } = await params;
        const resultDataToUpdate = await request.json() as Partial<Omit<Result, '_id' | 'createdAt' | 'updatedAt'>>;
        
        const existingResult = await ResultModel.findOne({
          $or: [
            { id: id },
            { _id: id }
          ]
        });

        if (!existingResult) {
            return NextResponse.json({ message: 'Result record not found' }, { status: 404 });
        }

        // Perform any specific validation for result update here if needed
        // e.g., ensuring subject grades are valid, spi/cpi calculations are consistent (though typically backend would do this)

        const updatedData = {
            ...resultDataToUpdate,
            updatedAt: new Date().toISOString(),
        };
        
        // If subjects are updated, recalculate credits/spi/cpi if necessary
        if (resultDataToUpdate.subjects) {
            updatedData.totalCredits = resultDataToUpdate.subjects.reduce((sum, sub) => sum + (sub.credits || 0), 0);
            updatedData.earnedCredits = resultDataToUpdate.subjects.reduce((sum, sub) => sum + (!sub.isBacklog && sub.credits ? sub.credits : 0), 0);
            // SPI/CPI calculation would be more complex and might involve historical data.
            // For a simple update, we might just accept the SPI/CPI if provided, or mark as needing recalculation.
            // Here, we'll just update based on provided data.
        }

        const updatedResult = await ResultModel.findOneAndUpdate(
          { $or: [{ id: id }, { _id: id }] },
          updatedData,
          { new: true }
        );

        return NextResponse.json(updatedResult);

    } catch (error) {
        console.error('Error updating result:', error);
        return NextResponse.json({ message: `Error updating result` }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const { id } = await params;
    const deletedResult = await ResultModel.findOneAndDelete({
      $or: [
        { id: id },
        { _id: id }
      ]
    });

    if (!deletedResult) {
      return NextResponse.json({ message: 'Result not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Result deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting result:', error);
    return NextResponse.json({ message: 'Error deleting result' }, { status: 500 });
  }
}
