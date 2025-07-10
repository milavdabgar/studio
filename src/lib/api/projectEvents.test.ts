import { projectEventService } from './projectEvents';
import type { ProjectEvent, Department, ProjectEventScheduleItem } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; statusText?: string }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => JSON.stringify(await (options.json ? options.json() : {})),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch globally for all tests in this file
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ProjectEventService API Tests', () => {
  const now = new Date().toISOString();
  const mockScheduleItem: ProjectEventScheduleItem = {
    time: "09:00 AM - 10:00 AM",
    activity: "Inauguration",
    location: "Auditorium",
    coordinator: { userId: "user1", name: "Coordinator Name" },
    notes: "Chief Guest arrival"
  };
  const mockProjectEvent: ProjectEvent = {
    id: "event1",
    name: "TechFest 2024",
    academicYear: "2024-25",
    eventDate: now,
    registrationStartDate: now,
    registrationEndDate: now,
    status: "upcoming",
    isActive: true,
    schedule: [mockScheduleItem],
    createdAt: now,
    updatedAt: now,
  };
  const mockProjectEvents: ProjectEvent[] = [mockProjectEvent];
  const mockDepartments: Department[] = [{ id: 'dept1', name: 'CS', code: 'CS', instituteId: 'inst1', status: 'active'}];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAllEvents', () => {
    it('should fetch all events successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectEvents }));
      const result = await projectEventService.getAllEvents();
      expect(fetch).toHaveBeenCalledWith('/api/project-events?');
      expect(result).toEqual(mockProjectEvents);
    });
    
    it('should fetch active events successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectEvents.filter(e => e.isActive) }));
      const result = await projectEventService.getAllEvents({ isActive: true });
      expect(fetch).toHaveBeenCalledWith('/api/project-events?isActive=true');
      expect(result).toEqual(mockProjectEvents.filter(e => e.isActive));
    });

    it('should throw an error if fetching all events fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Fetch error' }) }));
      await expect(projectEventService.getAllEvents()).rejects.toThrow('Fetch error');
    });
  });

  describe('getEventById', () => {
    it('should fetch an event by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectEvent }));
      const result = await projectEventService.getEventById('event1');
      expect(fetch).toHaveBeenCalledWith('/api/project-events/event1');
      expect(result).toEqual(mockProjectEvent);
    });

    it('should throw an error if fetching event by ID fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Event not found' }) }));
      await expect(projectEventService.getEventById('event1')).rejects.toThrow('Event not found');
    });

    it('should handle JSON parsing error when fetching event by ID fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectEventService.getEventById('event1')).rejects.toThrow('Failed to fetch event with id event1');
    });
  });

  describe('createEvent', () => {
    const newEventData: Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'schedule'> = {
      name: "Innovate 2025",
      academicYear: "2025-26",
      eventDate: new Date().toISOString(),
      registrationStartDate: new Date().toISOString(),
      registrationEndDate: new Date().toISOString(),
      status: "upcoming",
      isActive: true,
    };
    const createdEvent: ProjectEvent = { ...newEventData, id: 'event2', schedule: [], createdAt: now, updatedAt: now };

    it('should create an event successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdEvent }));
      const result = await projectEventService.createEvent(newEventData);
      expect(fetch).toHaveBeenCalledWith('/api/project-events', expect.objectContaining({ method: 'POST', body: JSON.stringify(newEventData) }));
      expect(result).toEqual(createdEvent);
    });

    it('should throw an error if creating event fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Validation error' }) }));
      await expect(projectEventService.createEvent(newEventData)).rejects.toThrow('Validation error');
    });

    it('should handle JSON parsing error when creating event fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectEventService.createEvent(newEventData)).rejects.toThrow('Failed to create event');
    });
  });

  describe('updateEvent', () => {
    const updateData: Partial<Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>> = { name: 'TechFest 2024 Updated' };
    const updatedEvent: ProjectEvent = { ...mockProjectEvent, name: 'TechFest 2024 Updated', updatedAt: new Date().toISOString() };

    it('should update an event successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedEvent }));
      const result = await projectEventService.updateEvent('event1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/project-events/event1', expect.objectContaining({ method: 'PUT', body: JSON.stringify(updateData) }));
      expect(result).toEqual(updatedEvent);
    });

    it('should throw an error if updating event fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Update failed' }) }));
      await expect(projectEventService.updateEvent('event1', updateData)).rejects.toThrow('Update failed');
    });

    it('should handle JSON parsing error when updating event fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectEventService.updateEvent('event1', updateData)).rejects.toThrow('Failed to update event');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await projectEventService.deleteEvent('event1');
      expect(fetch).toHaveBeenCalledWith('/api/project-events/event1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should throw an error if deleting event fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Delete failed' }) }));
      await expect(projectEventService.deleteEvent('event1')).rejects.toThrow('Delete failed');
    });

    it('should handle JSON parsing error when deleting event fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectEventService.deleteEvent('event1')).rejects.toThrow('Failed to delete event with id event1');
    });
  });
  
  describe('getEventSchedule', () => {
    it('should get event schedule successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockProjectEvent })); // getEventById is called internally
      const result = await projectEventService.getEventSchedule('event1');
      expect(result).toEqual({ schedule: mockProjectEvent.schedule, eventDate: mockProjectEvent.eventDate });
    });
  });
  
  describe('updateEventSchedule', () => {
    const newSchedule: ProjectEventScheduleItem[] = [{ ...mockScheduleItem, activity: "Updated Activity" }];
    const updatedEventWithSchedule: ProjectEvent = { ...mockProjectEvent, schedule: newSchedule, updatedAt: new Date().toISOString() };

    it('should update event schedule successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedEventWithSchedule }));
      const result = await projectEventService.updateEventSchedule('event1', { schedule: newSchedule });
      expect(fetch).toHaveBeenCalledWith('/api/project-events/event1/schedule', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ schedule: newSchedule })}));
      expect(result).toEqual(updatedEventWithSchedule);
    });

    it('should throw an error if updating event schedule fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Schedule update failed' }) }));
      await expect(projectEventService.updateEventSchedule('event1', { schedule: newSchedule })).rejects.toThrow('Schedule update failed');
    });

    it('should handle JSON parsing error when updating event schedule fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectEventService.updateEventSchedule('event1', { schedule: newSchedule })).rejects.toThrow('Failed to update event schedule');
    });
  });

  describe('publishEventResults', () => {
    it('should publish event results successfully', async () => {
      const updatedEventPublished: ProjectEvent = { ...mockProjectEvent, publishResults: true, updatedAt: new Date().toISOString() };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedEventPublished }));
      const result = await projectEventService.publishEventResults('event1', true);
      expect(fetch).toHaveBeenCalledWith('/api/project-events/event1', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ publishResults: true })}));
      expect(result).toEqual(updatedEventPublished);
    });

    it('should throw an error if publishing event results fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Publish failed' }) }));
      await expect(projectEventService.publishEventResults('event1', true)).rejects.toThrow('Publish failed');
    });

    it('should handle JSON parsing error when publishing event results fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(projectEventService.publishEventResults('event1', true)).rejects.toThrow('Failed to publish results');
    });
  });

  describe('importEvents', () => {
    const mockFile = new File(['test data'], 'events.csv', { type: 'text/csv' });
    const mockResponse = { newCount: 1, updatedCount: 0, skippedCount: 0 };

    it('should import events successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResponse }));
      const result = await projectEventService.importEvents(mockFile, mockDepartments);
      expect(fetch).toHaveBeenCalledWith('/api/project-events/import', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle import errors with details', async () => {
      const errorResponse = { message: 'Import failed', errors: [{row: 1, message: 'Bad data'}]};
      mockFetch.mockResolvedValueOnce(createMockResponse({ok: false, status: 400, json: async () => errorResponse}));
      await expect(projectEventService.importEvents(mockFile, mockDepartments)).rejects.toThrow('Import failed Specific issues: Bad data');
    });

    it('should handle generic import error', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ok: false, status: 500, json: async () => ({ message: 'Server error during import' })}));
        await expect(projectEventService.importEvents(mockFile, mockDepartments)).rejects.toThrow('Server error during import');
    });
  });

});
