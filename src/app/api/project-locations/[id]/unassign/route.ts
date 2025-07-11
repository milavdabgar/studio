// src/app/api/project-locations/[id]/unassign/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { ProjectLocationModel, ProjectModel, ProjectTeamModel } from '@/lib/models';
import { notificationService } from '@/lib/api/notifications';

interface RouteParams {
  params: Promise<{
    id: string; // This is the locationId string (e.g., "A-01"), not MongoDB _id
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: locationIdString  } = await params; 
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const locationToUpdate = await ProjectLocationModel.findOne({ locationId: locationIdString });
    if (!locationToUpdate) {
      return NextResponse.json({ message: `Location with ID '${locationIdString}' not found.` }, { status: 404 });
    }

    if (!locationToUpdate.isAssigned || !locationToUpdate.projectId) {
      return NextResponse.json({ message: `Location ${locationIdString} is not currently assigned to any project.` }, { status: 400 });
    }

    const previouslyAssignedProjectId = locationToUpdate.projectId;
    const project = await ProjectModel.findOne({ id: previouslyAssignedProjectId });


    locationToUpdate.projectId = undefined; 
    locationToUpdate.isAssigned = false;
    locationToUpdate.updatedAt = new Date().toISOString();
    locationToUpdate.updatedBy = "user_admin_placeholder_unassign"; 

    await locationToUpdate.save();

    if (previouslyAssignedProjectId) {
        await ProjectModel.updateOne(
          { id: previouslyAssignedProjectId },
          { 
            $unset: { locationId: "" }, 
            updatedAt: new Date().toISOString() 
          }
        );
    }

    // --- Notification Trigger ---
    if (project) {
        const team = await ProjectTeamModel.findOne({ id: project.teamId });
        if (team && team.members) {
            for (const member of team.members) {
                try {
                    await notificationService.createNotification({
                        userId: member.userId,
                        message: `Your project '${project.title}' has been unassigned from location/stall '${locationIdString}'.`,
                        type: 'project_location_update',
                        link: `/project-fair/student`, 
                    });
                } catch (notifError) {
                    console.error(`Failed to send location unassignment notification to user ${member.userId}:`, notifError);
                }
            }
        }
    }
    // --- End Notification Trigger ---


    return NextResponse.json({ status: 'success', data: { location: locationToUpdate } });
  } catch (error) {
    console.error(`Error unassigning project from location ${locationIdString}:`, error);
    return NextResponse.json({ message: 'Error unassigning project from location' }, { status: 500 });
  }
}
