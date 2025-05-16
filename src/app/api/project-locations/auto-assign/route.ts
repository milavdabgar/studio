// src/app/api/project-locations/auto-assign/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation, Project, Department, ProjectTeam } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
}

if (!global.__API_PROJECT_LOCATIONS_STORE__) global.__API_PROJECT_LOCATIONS_STORE__ = [];
if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_DEPARTMENTS_STORE__) global.__API_DEPARTMENTS_STORE__ = [];
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];


let projectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__;
let projectsStore: Project[] = global.__API_PROJECTS_STORE__;
let departmentsStore: Department[] = global.__API_DEPARTMENTS_STORE__;
const projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;


export async function POST(request: NextRequest) {
  try {
    const { eventId, departmentWise } = await request.json();

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required for auto-assignment.' }, { status: 400 });
    }

    const eventProjects = projectsStore.filter(p => p.eventId === eventId && !p.locationId && p.status === 'approved');
    const availableLocations = projectLocationsStore.filter(loc => loc.eventId === eventId && !loc.isAssigned);

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
        const locationsInDept = availableLocations.filter(loc => loc.department === deptId).sort((a,b) => a.section.localeCompare(b.section) || a.position - b.position);
        
        for (let i = 0; i < projectsInDept.length; i++) {
          if (i < locationsInDept.length) {
            const project = projectsInDept[i];
            const location = locationsInDept[i];
            
            const locIndex = projectLocationsStore.findIndex(l => l.id === location.id);
            if(locIndex !== -1) {
                projectLocationsStore[locIndex].projectId = project.id;
                projectLocationsStore[locIndex].isAssigned = true;
                projectLocationsStore[locIndex].updatedAt = now;
                projectLocationsStore[locIndex].updatedBy = updatedBy;
            }

            const projIndex = projectsStore.findIndex(p => p.id === project.id);
            if(projIndex !== -1){
                projectsStore[projIndex].locationId = location.locationId; 
                projectsStore[projIndex].updatedAt = now;
            }
            assignments.push({ projectId: project.id, locationId: location.locationId });
            assignedCount++;

            // --- Notification Trigger ---
            const team = projectTeamsStore.find(t => t.id === project.teamId);
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
          
          const locIndex = projectLocationsStore.findIndex(l => l.id === location.id);
          if(locIndex !== -1) {
              projectLocationsStore[locIndex].projectId = project.id;
              projectLocationsStore[locIndex].isAssigned = true;
              projectLocationsStore[locIndex].updatedAt = now;
              projectLocationsStore[locIndex].updatedBy = updatedBy;
          }

          const projIndex = projectsStore.findIndex(p => p.id === project.id);
            if(projIndex !== -1){
                projectsStore[projIndex].locationId = location.locationId;
                projectsStore[projIndex].updatedAt = now;
            }
          assignments.push({ projectId: project.id, locationId: location.locationId });
          assignedCount++;

           // --- Notification Trigger ---
            const team = projectTeamsStore.find(t => t.id === project.teamId);
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

    global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;
    global.__API_PROJECTS_STORE__ = projectsStore;

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
