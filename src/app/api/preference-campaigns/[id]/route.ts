import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';

interface CollectionCampaign {
  id: string;
  name: string;
  academicYear: string;
  semesters: number[];
  targetFaculties: string[];
  startDate: string;
  endDate: string;
  reminderSchedule: string[];
  status: 'draft' | 'active' | 'completed' | 'expired';
  description?: string;
  responseCount: number;
  totalTargeted: number;
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration - in production this would be in MongoDB
// Use global to share state across API routes
declare global {
  var mockCampaigns: CollectionCampaign[] | undefined;
}

if (!global.mockCampaigns) {
  global.mockCampaigns = [];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const campaign = global.mockCampaigns!.find(c => c.id === params.id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const updates = await request.json();
    
    const campaignIndex = global.mockCampaigns!.findIndex(c => c.id === params.id);
    
    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Update the campaign
    const updatedCampaign = {
      ...global.mockCampaigns![campaignIndex],
      ...updates,
      id: params.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    global.mockCampaigns![campaignIndex] = updatedCampaign;

    return NextResponse.json({
      success: true,
      data: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const campaignIndex = global.mockCampaigns!.findIndex(c => c.id === params.id);
    
    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Remove the campaign
    global.mockCampaigns!.splice(campaignIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}