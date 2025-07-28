
// src/app/api/project-events/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvent } from '@/types/entities';
import { isValid, parseISO } from 'date-fns';
import { notificationService } from '@/lib/api/notifications';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectEventModel, ProjectTeamModel } from '@/lib/models';


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
    let event;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      event = await ProjectEventModel.findById(id);
    } else {
      event = await ProjectEventModel.findOne({ id });
    }
    
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json(event.toJSON());
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return NextResponse.json({ message: `Error fetching event ${id}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await connectMongoose();
    
    const eventDataToUpdate = await request.json() as Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let existingEvent;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      existingEvent = await ProjectEventModel.findById(id);
    } else {
      existingEvent = await ProjectEventModel.findOne({ id });
    }

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    if (eventDataToUpdate.name !== undefined && !eventDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Event Name cannot be empty.' }, { status: 400 });
    }
    if (eventDataToUpdate.academicYear !== undefined && !eventDataToUpdate.academicYear.trim()) {
        return NextResponse.json({ message: 'Academic Year cannot be empty.' }, { status: 400 });
    }
    
    const newEventDate = eventDataToUpdate.eventDate ? parseISO(eventDataToUpdate.eventDate) : parseISO(existingEvent.eventDate);
    const newRegStartDate = eventDataToUpdate.registrationStartDate ? parseISO(eventDataToUpdate.registrationStartDate) : parseISO(existingEvent.registrationStartDate);
    const newRegEndDate = eventDataToUpdate.registrationEndDate ? parseISO(eventDataToUpdate.registrationEndDate) : parseISO(existingEvent.registrationEndDate);

    if (!isValid(newEventDate) || !isValid(newRegStartDate) || !isValid(newRegEndDate)) {
         return NextResponse.json({ message: 'Invalid date format provided.' }, { status: 400 });
    }
    if (newRegStartDate >= newEventDate || newRegEndDate >= newEventDate || newRegStartDate >= newRegEndDate) {
        return NextResponse.json({ message: 'Event dates are illogical. Please check registration and event dates.' }, { status: 400 });
    }
     if (eventDataToUpdate.status && !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(eventDataToUpdate.status)) {
        return NextResponse.json({ message: 'Invalid event status.' }, { status: 400 });
    }

    const updateData = {
      ...eventDataToUpdate,
      name: eventDataToUpdate.name?.trim() || existingEvent.name,
      description: eventDataToUpdate.description !== undefined ? eventDataToUpdate.description.trim() || undefined : existingEvent.description,
      academicYear: eventDataToUpdate.academicYear?.trim() || existingEvent.academicYear,
      eventDate: eventDataToUpdate.eventDate || existingEvent.eventDate,
      registrationStartDate: eventDataToUpdate.registrationStartDate || existingEvent.registrationStartDate,
      registrationEndDate: eventDataToUpdate.registrationEndDate || existingEvent.registrationEndDate,
      updatedBy: "user_admin_placeholder", 
      updatedAt: new Date().toISOString(),
    };

    const updatedEvent = await ProjectEventModel.findByIdAndUpdate(
      existingEvent._id,
      updateData,
      { new: true }
    );

    // --- Notification Trigger for Results Published ---
    if (eventDataToUpdate.publishResults === true && existingEvent.publishResults !== true) {
        const teamsForEvent = await ProjectTeamModel.find({ eventId: id });
        const userIdsToNotify: Set<string> = new Set();
        teamsForEvent.forEach(team => {
            team.members.forEach((member: { userId: string }) => userIdsToNotify.add(member.userId));
        });

        for (const userId of userIdsToNotify) {
            try {
                await notificationService.createLegacyNotification({
                    userId: userId,
                    message: `Results for the event '${updatedEvent.name}' have been published! Check the event page for details.`,
                    type: 'event_results_published',
                    link: `/project-fair/student`, // Or a more specific results page
                });
            } catch (notifError) {
                console.error(`Failed to send results published notification to user ${userId}:`, notifError);
            }
        }
    }
    // --- End Notification Trigger ---

    return NextResponse.json(updatedEvent.toJSON());
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    return NextResponse.json({ message: `Error updating event ${id}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let event;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      event = await ProjectEventModel.findById(id);
    } else {
      event = await ProjectEventModel.findOne({ id });
    }

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Remove the event from the database
    await ProjectEventModel.findByIdAndDelete(event._id);
    
    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    return NextResponse.json({ message: `Error deleting event ${id}` }, { status: 500 });
  }
}
