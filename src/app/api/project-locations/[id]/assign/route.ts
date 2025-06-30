// src/app/api/project-locations/[id]/assign/route.ts
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
  const { id: locationIdString  } = await params; // The user-friendly locationId
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ message: 'Project ID is required for assignment.' }, { status: 400 });
    }

    const locationToUpdate = await ProjectLocationModel.findOne({ locationId: locationIdString });
    if (!locationToUpdate) {
      return NextResponse.json({ message: `Location with ID '${locationIdString}' not found.` }, { status: 404 });
    }

    if (locationToUpdate.isAssigned && locationToUpdate.projectId && locationToUpdate.projectId !== projectId) {
      return NextResponse.json({ message: `Location ${locationIdString} is already assigned to project ${locationToUpdate.projectId}. Unassign it first.` }, { status: 409 });
    }

    const projectToAssign = await ProjectModel.findOne({ $or: [{ id: projectId }, { _id: projectId }] });
    if (!projectToAssign) {
      return NextResponse.json({ message: `Project with ID '${projectId}' not found.` }, { status: 404 });
    }
    
    const otherLocationAssignedToProject = await ProjectLocationModel.findOne({ 
      projectId: projectId, 
      locationId: { $ne: locationIdString } 
    });
    if (otherLocationAssignedToProject) {
        return NextResponse.json({ message: `Project ${projectId} is already assigned to location ${otherLocationAssignedToProject.locationId}.`}, { status: 409 });
    }

    locationToUpdate.projectId = projectId;
    locationToUpdate.isAssigned = true;
    locationToUpdate.updatedAt = new Date().toISOString();
    locationToUpdate.updatedBy = "user_admin_placeholder_assign"; 

    await locationToUpdate.save();

    // Update project with location
    await ProjectModel.updateOne(
      { $or: [{ id: projectId }, { _id: projectId }] },
      { 
        locationId: locationIdString, 
        updatedAt: new Date().toISOString() 
      }
    );

    // --- Notification Trigger ---
    const team = await ProjectTeamModel.findOne({ $or: [{ id: projectToAssign.teamId }, { _id: projectToAssign.teamId }] });
    if (team && team.members) {
        for (const member of team.members) {
            try {
                await notificationService.createNotification({
                    userId: member.userId,
                    message: `Your project '${projectToAssign.title}' has been assigned to location/stall '${locationIdString}'.`,
                    type: 'project_location_update',
                    link: `/project-fair/student`, 
                });
            } catch (notifError) {
                console.error(`Failed to send location assignment notification to user ${member.userId}:`, notifError);
            }
        }
    }
    // --- End Notification Trigger ---

    return NextResponse.json({ status: 'success', data: { location: locationToUpdate } });
  } catch (error) {
    console.error(`Error assigning project to location ${locationIdString}:`, error);
    return NextResponse.json({ message: 'Error assigning project to location', error: (error as Error).message }, { status: 500 });
  }
}
