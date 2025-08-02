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
// Use global to share state across API routes
declare global {
  var mockCampaigns: CollectionCampaign[] | undefined;
}

if (!global.mockCampaigns) {
  global.mockCampaigns = [
    {
      id: 'camp_demo_1',
      name: 'Spring 2025 Preference Collection',
      academicYear: '2024-25',
      semesters: [1, 3, 5],
      targetFaculties: [],
      startDate: '2025-01-15T00:00:00.000Z',
      endDate: '2025-01-30T23:59:59.000Z',
      reminderSchedule: [],
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let filteredCampaigns = global.mockCampaigns!;
    if (status && status !== 'all') {
      filteredCampaigns = global.mockCampaigns!.filter(campaign => campaign.status === status);
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
    if (!campaignData.name || !campaignData.academicYear || !campaignData.semesters || !Array.isArray(campaignData.semesters) || campaignData.semesters.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, academicYear, semesters (must be a non-empty array).' },
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

    global.mockCampaigns!.push(newCampaign);

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

    if (!mockCampaigns) {
      return NextResponse.json(
        { success: false, error: 'No campaigns available' },
        { status: 500 }
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