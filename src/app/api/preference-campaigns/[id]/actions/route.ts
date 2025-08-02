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

// Import the same mock data - in production this would be in MongoDB
// For now, we'll create a shared reference
// Note: global declaration is in the main route.ts file

if (!global.mockCampaigns) {
  global.mockCampaigns = [];
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const body = await request.json();
    const { action, facultyIds } = body;

    // Find and update the campaign
    const campaignIndex = global.mockCampaigns!.findIndex(c => c.id === params.id);
    
    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'start':
      case 'launch':
        // Start/Launch campaign
        global.mockCampaigns![campaignIndex].status = 'active';
        global.mockCampaigns![campaignIndex].updatedAt = new Date().toISOString();
        
        return NextResponse.json({
          success: true,
          message: 'Campaign started successfully',
          data: {
            notificationsSent: 15,
            status: 'active',
            timestamp: new Date().toISOString()
          }
        });

      case 'complete':
        // Complete campaign
        global.mockCampaigns![campaignIndex].status = 'completed';
        global.mockCampaigns![campaignIndex].updatedAt = new Date().toISOString();
        
        return NextResponse.json({
          success: true,
          message: 'Campaign completed successfully',
          data: {
            status: 'completed',
            timestamp: new Date().toISOString()
          }
        });

      case 'pause':
        // Pause campaign
        global.mockCampaigns![campaignIndex].status = 'draft';
        global.mockCampaigns![campaignIndex].updatedAt = new Date().toISOString();
        
        return NextResponse.json({
          success: true,
          message: 'Campaign paused successfully',
          data: {
            status: 'draft',
            timestamp: new Date().toISOString()
          }
        });

      case 'cancel':
        // Cancel campaign
        global.mockCampaigns![campaignIndex].status = 'completed';
        global.mockCampaigns![campaignIndex].updatedAt = new Date().toISOString();
        
        return NextResponse.json({
          success: true,
          message: 'Campaign cancelled successfully',
          data: {
            status: 'cancelled',
            timestamp: new Date().toISOString()
          }
        });

      case 'send_reminder':
        // Mock sending reminders
        const targetCount = facultyIds ? facultyIds.length : 10;
        return NextResponse.json({
          success: true,
          message: 'Reminders sent successfully',
          data: {
            remindersSent: targetCount,
            timestamp: new Date().toISOString()
          }
        });

      case 'export':
        // Mock export functionality
        return NextResponse.json({
          success: true,
          message: 'Export started',
          data: {
            exportUrl: `/api/preference-campaigns/${params.id}/export`,
            format: 'csv',
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}. Valid actions are: start, complete, pause, cancel, send_reminder, export` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing campaign action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform campaign action' },
      { status: 500 }
    );
  }
}