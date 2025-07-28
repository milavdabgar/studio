
import { NextResponse, type NextRequest } from 'next/server';
import type { Project } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectModel, ProjectTeamModel, ProjectLocationModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let project;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      project = await ProjectModel.findById(id);
    } else {
      project = await ProjectModel.findOne({ id });
    }
    
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ status: 'success', data: { project: project.toJSON() } });
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return NextResponse.json({ message: `Error fetching project ${id}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await connectMongoose();
    
    const projectDataToUpdate = await request.json() as Partial<Omit<Project, 'id'>>;
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let existingProject;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      existingProject = await ProjectModel.findById(id);
    } else {
      existingProject = await ProjectModel.findOne({ id });
    }

    if (!existingProject) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    if (projectDataToUpdate.title !== undefined && !projectDataToUpdate.title.trim()) {
        return NextResponse.json({ message: 'Project Title cannot be empty if provided.' }, { status: 400 });
    }

    const updateData = {
      ...projectDataToUpdate,
      updatedAt: new Date().toISOString(),
    };

    const updatedProject = await ProjectModel.findByIdAndUpdate(
      existingProject._id,
      updateData,
      { new: true }
    );

    // --- Notification Trigger for Project Status Change ---
    if (projectDataToUpdate.status && projectDataToUpdate.status !== existingProject.status) {
        const team = await ProjectTeamModel.findOne({ id: updatedProject.teamId });
        if (team && team.members) {
            for (const member of team.members) {
                try {
                    await notificationService.createLegacyNotification({
                        userId: member.userId,
                        message: `The status of your project '${updatedProject.title}' has been updated to '${updatedProject.status}'.`,
                        type: 'project_status_change',
                        link: `/project-fair/student`, // Or a more specific link if available
                    });
                } catch (notifError) {
                    console.error(`Failed to send project status update notification to user ${member.userId}:`, notifError);
                }
            }
        }
    }
    // --- End Notification Trigger ---

    return NextResponse.json({ status: 'success', data: { project: updatedProject.toJSON() } });
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return NextResponse.json({ message: `Error updating project ${id}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let project;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      project = await ProjectModel.findById(id);
    } else {
      project = await ProjectModel.findOne({ id });
    }

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const deletedProject = project.toJSON();
    
    // Remove the project from the database
    await ProjectModel.findByIdAndDelete(project._id);

    // Handle project location cleanup using MongoDB
    if (deletedProject.locationId) {
      await ProjectLocationModel.findOneAndUpdate(
        { 
          $or: [
            { id: deletedProject.locationId }, 
            { locationId: deletedProject.locationId }
          ]
        },
        {
          projectId: undefined,
          isAssigned: false,
          updatedBy: "user_admin_placeholder_project_delete",
          updatedAt: new Date().toISOString()
        }
      );
    }

    return NextResponse.json({ status: 'success', data: null });
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    return NextResponse.json({ message: `Error deleting project ${id}` }, { status: 500 });
  }
}
