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
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration - in production this would be in MongoDB
let mockCampaigns: CollectionCampaign[] = [];

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let filteredCampaigns = mockCampaigns;
    if (status && status !== 'all') {
      filteredCampaigns = mockCampaigns.filter(campaign => campaign.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filteredCampaigns
    });
  } catch (error) {
    console.error('Error fetching preference campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preference campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const campaignData = await request.json() as Omit<CollectionCampaign, 'id' | 'createdAt' | 'updatedAt'>;

    // Validation
    if (!campaignData.name || !campaignData.academicYear || !campaignData.semesters.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, academicYear, semesters.' },
        { status: 400 }
      );
    }

    const currentTimestamp = new Date().toISOString();
    const newCampaign: CollectionCampaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...campaignData,
      status: campaignData.status || 'draft',
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    mockCampaigns.push(newCampaign);

    return NextResponse.json({
      success: true,
      data: newCampaign
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating preference campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create preference campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoose();
    
    const body: Partial<CollectionCampaign> & { id: string } = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const campaignIndex = mockCampaigns.findIndex(c => c.id === body.id);
    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const updatedCampaign = {
      ...mockCampaigns[campaignIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };

    mockCampaigns[campaignIndex] = updatedCampaign;

    return NextResponse.json({
      success: true,
      data: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating preference campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preference campaign' },
      { status: 500 }
    );
  }
}