// src/app/api/project-locations/auto-assign/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { ProjectLocationModel, ProjectModel, DepartmentModel, ProjectTeamModel } from '@/lib/models';
import { notificationService } from '@/lib/api/notifications';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const { eventId, departmentWise } = await request.json();

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required for auto-assignment.' }, { status: 400 });
    }

    const eventProjects = await ProjectModel.find({ 
      eventId: eventId, 
      locationId: { $exists: false }, 
      status: 'approved' 
    });
    
    const availableLocations = await ProjectLocationModel.find({ 
      eventId: eventId, 
      isAssigned: false 
    });

    if (eventProjects.length === 0) {
      return NextResponse.json({ message: 'No approved projects without locations to assign for this event.' }, { status: 200 });
    }
    if (availableLocations.length === 0) {
      return NextResponse.json({ message: 'No available locations for this event. Please create locations first.' }, { status: 400 });
    }

    let assignedCount = 0;
    const assignments: { projectId: string, locationId: string }[] = [];
    const now = new Date().toISOString();
    const updatedBy = "user_admin_auto_assign"; 

    if (departmentWise) {
      const departments = Array.from(new Set(eventProjects.map(p => p.department)));
      for (const deptId of departments) {
        const projectsInDept = eventProjects.filter(p => p.department === deptId);
        const locationsInDept = availableLocations
          .filter(loc => loc.department === deptId)
          .sort((a,b) => a.section.localeCompare(b.section) || a.position - b.position);
        
        for (let i = 0; i < projectsInDept.length; i++) {
          if (i < locationsInDept.length) {
            const project = projectsInDept[i];
            const location = locationsInDept[i];
            
            // Update location
            await ProjectLocationModel.updateOne(
              { _id: location._id },
              {
                projectId: project.id,
                isAssigned: true,
                updatedAt: now,
                updatedBy: updatedBy
              }
            );

            // Update project
            await ProjectModel.updateOne(
              { _id: project._id },
              {
                locationId: location.locationId,
                updatedAt: now
              }
            );
            
            assignments.push({ projectId: project.id, locationId: location.locationId });
            assignedCount++;

            // --- Notification Trigger ---
            const team = await ProjectTeamModel.findOne({ $or: [{ id: project.teamId }, { _id: project.teamId }] });
            if (team && team.members) {
                for (const member of team.members) {
                    try {
                        await notificationService.createNotification({
                            userId: member.userId,
                            message: `Your project '${project.title}' has been auto-assigned to location/stall '${location.locationId}'.`,
                            type: 'project_location_update',
                            link: `/project-fair/student`, 
                        });
                    } catch (notifError) {
                        console.error(`Failed to send auto-assignment notification to user ${member.userId}:`, notifError);
                    }
                }
            }
            // --- End Notification Trigger ---
          }
        }
      }
    } else { 
      const sortedAvailableLocations = availableLocations.sort((a,b) => a.section.localeCompare(b.section) || a.position - b.position);
      for (let i = 0; i < eventProjects.length; i++) {
        if (i < sortedAvailableLocations.length) {
          const project = eventProjects[i];
          const location = sortedAvailableLocations[i];
          
          // Update location
          await ProjectLocationModel.updateOne(
            { _id: location._id },
            {
              projectId: project.id,
              isAssigned: true,
              updatedAt: now,
              updatedBy: updatedBy
            }
          );

          // Update project
          await ProjectModel.updateOne(
            { _id: project._id },
            {
              locationId: location.locationId,
              updatedAt: now
            }
          );
          
          assignments.push({ projectId: project.id, locationId: location.locationId });
          assignedCount++;

           // --- Notification Trigger ---
            const team = await ProjectTeamModel.findOne({ $or: [{ id: project.teamId }, { _id: project.teamId }] });
            if (team && team.members) {
                for (const member of team.members) {
                    try {
                        await notificationService.createNotification({
                            userId: member.userId,
                            message: `Your project '${project.title}' has been auto-assigned to location/stall '${location.locationId}'.`,
                            type: 'project_location_update',
                            link: `/project-fair/student`, 
                        });
                    } catch (notifError) {
                        console.error(`Failed to send auto-assignment notification to user ${member.userId}:`, notifError);
                    }
                }
            }
            // --- End Notification Trigger ---
        }
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      message: `Auto-assigned ${assignedCount} projects to locations.`,
      data: { assignments, assignedCount, totalProjectsToAssign: eventProjects.length, totalAvailableLocations: availableLocations.length } 
    });

  } catch (error) {
    console.error('Error during auto-assignment of project locations:', error);
    return NextResponse.json({ message: 'Error during auto-assignment', error: (error as Error).message }, { status: 500 });
  }
}
