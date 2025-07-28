import { facultyPreferenceService } from '../facultyPreferences';
import type { FacultyPreference, DayOfWeek } from '@/types/entities';

// Mock fetch globally
global.fetch = jest.fn();

describe('facultyPreferenceService', () => {
  const mockFacultyPreference: FacultyPreference = {
    id: 'pref1',
    facultyId: 'faculty1',
    academicYear: '2024-25',
    semester: 1,
    preferredCourses: [
      {
        courseId: 'course1',
        preference: 'high',
        expertise: 9,
        previouslyTaught: true,
        maxSections: 2
      }
    ],
    timePreferences: [
      {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '12:00',
        preference: 'preferred'
      }
    ],
    roomPreferences: ['room1'],
    maxHoursPerWeek: 20,
    maxConsecutiveHours: 3,
    unavailableSlots: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    priority: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getAllPreferences', () => {
    it('should fetch all faculty preferences successfully', async () => {
      const mockPreferences = [mockFacultyPreference];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences
      });

      const result = await facultyPreferenceService.getAllPreferences();

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences');
      expect(result).toEqual(mockPreferences);
    });

    it('should throw error when fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' })
      });

      await expect(facultyPreferenceService.getAllPreferences())
        .rejects.toThrow('Failed to fetch faculty preferences');
    });

    it('should throw default error when response is not ok and no error message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(facultyPreferenceService.getAllPreferences())
        .rejects.toThrow('Failed to fetch faculty preferences');
    });
  });

  describe('getPreferencesByFaculty', () => {
    it('should fetch preferences for specific faculty', async () => {
      const mockPreferences = [mockFacultyPreference];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences
      });

      const result = await facultyPreferenceService.getPreferencesByFaculty('faculty1');

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences?facultyId=faculty1');
      expect(result).toEqual(mockPreferences);
    });

    it('should handle empty results for faculty', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const result = await facultyPreferenceService.getPreferencesByFaculty('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getPreferencesByTerm', () => {
    it('should fetch preferences for specific academic term', async () => {
      const mockPreferences = [mockFacultyPreference];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences
      });

      const result = await facultyPreferenceService.getPreferencesByTerm('2024-25', 1);

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences?academicYear=2024-25&semester=1');
      expect(result).toEqual(mockPreferences);
    });

    it('should handle different semester numbers', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await facultyPreferenceService.getPreferencesByTerm('2024-25', 2);

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences?academicYear=2024-25&semester=2');
    });
  });

  describe('createPreference', () => {
    it('should create new faculty preference successfully', async () => {
      const newPreferenceData = {
        facultyId: 'faculty2',
        academicYear: '2024-25',
        semester: 2,
        preferredCourses: [],
        timePreferences: [],
        roomPreferences: [],
        maxHoursPerWeek: 18,
        maxConsecutiveHours: 4,
        unavailableSlots: [],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayOfWeek[],
        priority: 5
      };

      const createdPreference = { ...newPreferenceData, id: 'pref2', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdPreference
      });

      const result = await facultyPreferenceService.createPreference(newPreferenceData);

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferenceData)
      });
      expect(result).toEqual(createdPreference);
    });

    it('should throw error for invalid creation data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Validation error' })
      });

      const invalidData = {
        facultyId: '',
        academicYear: '',
        semester: 0,
        preferredCourses: [],
        timePreferences: [],
        roomPreferences: [],
        maxHoursPerWeek: 20,
        maxConsecutiveHours: 3,
        unavailableSlots: [],
        workingDays: [],
        priority: 5
      };

      await expect(facultyPreferenceService.createPreference(invalidData))
        .rejects.toThrow('Validation error');
    });
  });

  describe('updatePreference', () => {
    it('should update existing faculty preference successfully', async () => {
      const updateData = {
        maxHoursPerWeek: 25,
        priority: 9
      };

      const updatedPreference = { ...mockFacultyPreference, ...updateData };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedPreference
      });

      const result = await facultyPreferenceService.updatePreference('pref1', updateData);

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences/pref1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      expect(result).toEqual(updatedPreference);
    });

    it('should throw error when updating non-existent preference', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Preference not found' })
      });

      await expect(facultyPreferenceService.updatePreference('nonexistent', {}))
        .rejects.toThrow('Preference not found');
    });
  });

  describe('deletePreference', () => {
    it('should delete faculty preference successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      await facultyPreferenceService.deletePreference('pref1');

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences/pref1', {
        method: 'DELETE'
      });
    });

    it('should throw error when deleting non-existent preference', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Preference not found' })
      });

      await expect(facultyPreferenceService.deletePreference('nonexistent'))
        .rejects.toThrow('Preference not found');
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(facultyPreferenceService.deletePreference('pref1'))
        .rejects.toThrow('Network error');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Malformed JSON'); }
      });

      await expect(facultyPreferenceService.getAllPreferences())
        .rejects.toThrow('Failed to fetch faculty preferences');
    });

    it('should handle network timeouts', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(facultyPreferenceService.getAllPreferences())
        .rejects.toThrow('Request timeout');
    });

    it('should handle server errors with custom messages', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' })
      });

      await expect(facultyPreferenceService.createPreference({
        facultyId: 'faculty1',
        academicYear: '2024-25',
        semester: 1,
        preferredCourses: [],
        timePreferences: [],
        roomPreferences: [],
        maxHoursPerWeek: 20,
        maxConsecutiveHours: 3,
        unavailableSlots: [],
        workingDays: ['Monday'],
        priority: 5
      })).rejects.toThrow('Internal server error');
    });
  });

  describe('Parameter Validation', () => {
    it('should handle special characters in faculty ID', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await facultyPreferenceService.getPreferencesByFaculty('faculty@test.com');

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences?facultyId=faculty@test.com');
    });

    it('should handle different academic year formats', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await facultyPreferenceService.getPreferencesByTerm('2023-2024', 1);

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences?academicYear=2023-2024&semester=1');
    });

    it('should handle edge case semester numbers', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await facultyPreferenceService.getPreferencesByTerm('2024-25', 8);

      expect(fetch).toHaveBeenCalledWith('/api/faculty-preferences?academicYear=2024-25&semester=8');
    });
  });
});