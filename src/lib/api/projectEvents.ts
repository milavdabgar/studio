
// src/lib/api/projectEvents.ts
import type { ProjectEvent, Department, ProjectEventScheduleItem } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const projectEventService = {
  async getAllEvents(filters: { isActive?: boolean } = {}): Promise<ProjectEvent[]> {
    const queryParams = new URLSearchParams();
    if (filters.isActive !== undefined) {
      queryParams.append('isActive', String(filters.isActive));
    }
    const response = await fetch(`${API_BASE_URL}/project-events?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project events' }));
      throw new Error(errorData.message || 'Failed to fetch project events');
    }
    return response.json();
  },

  async getEventById(id: string): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch event with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch event with id ${id}`);
    }
    return response.json();
  },

  async createEvent(eventData: Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'>): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create event' }));
      throw new Error(errorData.message || 'Failed to create event');
    }
    return response.json();
  },

  async updateEvent(id: string, eventData: Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update event' }));
      throw new Error(errorData.message || 'Failed to update event');
    }
    return response.json();
  },

  async deleteEvent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/project-events/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete event with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete event with id ${id}`);
    }
  },
  
  async getEventSchedule(eventId: string): Promise<{ schedule: ProjectEventScheduleItem[], eventDate: string }> {
    const event = await this.getEventById(eventId); // Re-uses existing getEventById
    return { schedule: event.schedule || [], eventDate: event.eventDate };
  },

  async updateEventSchedule(eventId: string, scheduleData: { schedule: ProjectEventScheduleItem[] }): Promise<ProjectEvent> {
    const response = await fetch(`${API_BASE_URL}/project-events/${eventId}/schedule`, { // Target the specific schedule endpoint
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update event schedule' }));
      throw new Error(errorData.message || 'Failed to update event schedule');
    }
    return response.json();
  },
  
  async publishEventResults(eventId: string, publish: boolean): Promise<ProjectEvent> {
     // This should call the PUT endpoint for the event, updating the publishResults flag
     const response = await fetch(`${API_BASE_URL}/project-events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishResults: publish }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to ${publish ? 'publish' : 'unpublish'} results` }));
      throw new Error(errorData.message || `Failed to ${publish ? 'publish' : 'unpublish'} results`);
    }
    return response.json();
  },

  async importEvents(file: File, departments: Department[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number, errors?: Record<string, unknown>[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('departments', JSON.stringify(departments));

    const response = await fetch(`${API_BASE_URL}/project-events/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import project events.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${responseData.errors.slice(0,3).map((e: Record<string, unknown>) => e.message || JSON.stringify(e.data)).join('; ')}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return responseData;
  },
};
