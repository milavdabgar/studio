import { TimetableNotificationService } from '@/lib/services/timetableNotificationService';
import { NotificationService } from '@/lib/services/notificationService';
import type { Timetable, TimetableEntry, TimetableConflict } from '@/types/entities';

// Mock the NotificationService
jest.mock('@/lib/services/notificationService');

describe('TimetableNotificationService', () => {
  let timetableNotificationService: TimetableNotificationService;
  let mockNotificationService: jest.Mocked<NotificationService>;

    const mockTimetableEntry: TimetableEntry = {
      dayOfWeek: 'Monday' as const,
      startTime: '09:00',
      endTime: '10:00',
      courseId: 'CS101',
      courseName: 'Introduction to Computer Science',
      facultyId: 'faculty_1',
      roomId: 'room_1',
      entryType: 'lecture'
    };

    const mockTimetable: Timetable = {
      id: 'timetable_1',
      name: 'Spring 2024 Timetable',
      academicYear: '2023-24',
      semester: 2,
      programId: 'program_1',
      version: '1.0',
      status: 'published',
      effectiveDate: new Date().toISOString(),
      entries: [mockTimetableEntry]
    };

    const mockStakeholders = {
      students: [
        { id: 'student_1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', batchId: 'batch_1' },
        { id: 'student_2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', batchId: 'batch_1' }
      ],
      faculty: [
        { id: 'faculty_1', name: 'Dr. Smith', email: 'dr.smith@example.com', phone: '+1234567892', department: 'CS' }
      ],
      hods: [
        { id: 'hod_1', name: 'Dr. Johnson', email: 'hod@example.com', phone: '+1234567893', department: 'CS' }
      ],
      roomManagers: [
        { id: 'manager_1', name: 'Room Manager', email: 'manager@example.com', phone: '+1234567894', buildingId: 'building_1' }
      ]
    };

  beforeEach(() => {
    // Create a mock instance of NotificationService
    mockNotificationService = {
      sendNotification: jest.fn(),
      sendBatchNotifications: jest.fn(),
      getNotificationStatus: jest.fn(),
      getUserNotificationHistory: jest.fn()
    } as any;

    // Mock successful notification responses
    mockNotificationService.sendNotification.mockResolvedValue({
      success: true,
      channels: {
        email: true,
        sms: false,
        push: false,
        webhook: false
      },
      errors: [],
      messageId: 'notif_123'
    });

    mockNotificationService.sendBatchNotification.mockResolvedValue({
      totalSent: 2,
      successful: 2,
      failed: 0,
      errors: []
    });

    timetableNotificationService = new TimetableNotificationService(mockNotificationService);
  });

  describe('constructor', () => {
    it('should create instance with notification service', () => {
      expect(timetableNotificationService).toBeInstanceOf(TimetableNotificationService);
    });

    it('should initialize templates', () => {
      expect(timetableNotificationService['templates']).toBeDefined();
      expect(timetableNotificationService['templates'].student).toBeDefined();
      expect(timetableNotificationService['templates'].faculty).toBeDefined();
      expect(timetableNotificationService['templates'].hod).toBeDefined();
      expect(timetableNotificationService['templates'].room_manager).toBeDefined();
    });
  });

  describe('notifyTimetablePublished', () => {
    it('should notify all stakeholder groups when timetable is published', async () => {
      const result = await timetableNotificationService.notifyTimetablePublished(
        mockTimetable,
        mockStakeholders
      );

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      
      // Should call notification service for each stakeholder group
      expect(mockNotificationService.sendNotification).toHaveBeenCalledTimes(5); // 2 students + 1 faculty + 1 hod + 1 room manager
    });

    it('should send correct notification templates to students', async () => {
      await timetableNotificationService.notifyTimetablePublished(
        mockTimetable,
        mockStakeholders
      );

      const studentNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].userId?.startsWith('student_')
      );

      expect(studentNotifications).toHaveLength(2);
      expect(studentNotifications[0][0]).toMatchObject({
        type: 'timetable_published',
        title: expect.stringContaining('New Timetable Published'),
        channels: ['email', 'push']
      });
    });

    it('should send correct notification templates to faculty', async () => {
      await timetableNotificationService.notifyTimetablePublished(
        mockTimetable,
        mockStakeholders
      );

      const facultyNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].userId?.startsWith('faculty_')
      );

      expect(facultyNotifications).toHaveLength(1);
      expect(facultyNotifications[0][0]).toMatchObject({
        type: 'schedule_assigned',
        title: expect.stringContaining('Teaching Schedule Assigned'),
        channels: ['email', 'push']
      });
    });

    it('should send correct notification templates to HODs', async () => {
      await timetableNotificationService.notifyTimetablePublished(
        mockTimetable,
        mockStakeholders
      );

      const hodNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].userId?.startsWith('hod_')
      );

      expect(hodNotifications).toHaveLength(1);
      expect(hodNotifications[0][0]).toMatchObject({
        type: 'timetable_published',
        title: expect.stringContaining('Timetable Published'),
        channels: ['email', 'push']
      });
    });

    it('should handle empty stakeholder groups', async () => {
      const emptyStakeholders = {
        students: [],
        faculty: [],
        hods: [],
        roomManagers: []
      };

      const result = await timetableNotificationService.notifyTimetablePublished(
        mockTimetable,
        emptyStakeholders
      );

      expect(result.success).toBe(false);
      expect(mockNotificationService.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('notifyTimetableChanges', () => {
    const mockChanges = [
      {
        type: 'time_change' as const,
        oldValue: '09:00-10:30',
        newValue: '10:00-11:30',
        reason: 'Room conflict resolution',
        affectedEntries: [mockTimetable.entries[0]]
      },
      {
        type: 'room_change' as const,
        oldValue: 'Lab A',
        newValue: 'Lab B',
        reason: 'Equipment maintenance',
        affectedEntries: [mockTimetable.entries[0]]
      }
    ];

    it('should notify stakeholders of timetable changes', async () => {
      const result = await timetableNotificationService.notifyTimetableChanges(
        mockTimetable,
        mockChanges,
        mockStakeholders
      );

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('should handle time change notifications', async () => {
      const timeChanges = [mockChanges[0]];
      
      await timetableNotificationService.notifyTimetableChanges(
        mockTimetable,
        timeChanges,
        mockStakeholders
      );

      const timeChangeNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].title?.includes('Schedule')
      );

      expect(timeChangeNotifications.length).toBeGreaterThan(0);
    });

    it('should handle room change notifications', async () => {
      const roomChanges = [mockChanges[1]];
      
      await timetableNotificationService.notifyTimetableChanges(
        mockTimetable,
        roomChanges,
        mockStakeholders
      );

      const roomChangeNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].title?.includes('Room')
      );

      expect(roomChangeNotifications.length).toBeGreaterThan(0);
    });

    it('should handle class cancellation notifications', async () => {
      const cancellationChanges = [{
        type: 'cancellation' as const,
        reason: 'Faculty unavailable',
        affectedEntries: [mockTimetable.entries[0]]
      }];
      
      await timetableNotificationService.notifyTimetableChanges(
        mockTimetable,
        cancellationChanges,
        mockStakeholders
      );

      const cancellationNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].title?.includes('Cancelled')
      );

      expect(cancellationNotifications.length).toBeGreaterThan(0);
    });

    it('should handle faculty change notifications', async () => {
      const facultyChanges = [{
        type: 'faculty_change' as const,
        oldValue: 'Dr. Smith',
        newValue: 'Dr. Jones',
        affectedEntries: [mockTimetable.entries[0]]
      }];
      
      await timetableNotificationService.notifyTimetableChanges(
        mockTimetable,
        facultyChanges,
        mockStakeholders
      );

      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('should handle class addition notifications', async () => {
      const additionChanges = [{
        type: 'addition' as const,
        newValue: 'Extra Tutorial',
        affectedEntries: [mockTimetable.entries[0]]
      }];
      
      await timetableNotificationService.notifyTimetableChanges(
        mockTimetable,
        additionChanges,
        mockStakeholders
      );

      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyConflicts', () => {
    const mockConflicts: TimetableConflict[] = [
      {
        type: 'room',
        severity: 'critical',
        description: 'Room double booking',
        affectedEntries: [0],
        batchId: 'batch_1',
        roomId: 'room_1'
      },
      {
        type: 'faculty',
        severity: 'high',
        description: 'Faculty overlap',
        affectedEntries: [0],
        facultyId: 'faculty_1'
      }
    ];

    it('should notify HODs of critical conflicts immediately', async () => {
      const result = await timetableNotificationService.notifyConflicts(
        mockConflicts,
        mockStakeholders
      );

      expect(result.success).toBe(true);
      
      const hodNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].userId?.startsWith('hod_')
      );

      expect(hodNotifications.length).toBeGreaterThan(0);
      expect(hodNotifications[0][0]).toMatchObject({
        type: 'timetable_conflict',
        priority: 'urgent'
      });
    });

    it('should notify room managers of room conflicts', async () => {
      const roomConflicts = mockConflicts.filter(c => c.type === 'room');
      
      const result = await timetableNotificationService.notifyConflicts(
        roomConflicts,
        mockStakeholders
      );

      expect(result.success).toBe(true);
      
      const managerNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].userId?.startsWith('manager_')
      );

      expect(managerNotifications.length).toBeGreaterThan(0);
    });

    it('should handle conflicts with different severity levels', async () => {
      await timetableNotificationService.notifyConflicts(
        mockConflicts,
        mockStakeholders
      );

      // Critical conflicts should trigger immediate notifications
      const urgentNotifications = mockNotificationService.sendNotification.mock.calls.filter(
        call => call[0].priority === 'urgent'
      );

      expect(urgentNotifications.length).toBeGreaterThan(0);
    });

    it('should handle empty conflicts array', async () => {
      const result = await timetableNotificationService.notifyConflicts(
        [],
        mockStakeholders
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('template interpolation', () => {
    it('should interpolate template variables correctly', () => {
      const template = 'Hello {{name}}, your class {{courseName}} is at {{time}}';
      const data = {
        name: 'John',
        courseName: 'Programming',
        time: '09:00'
      };

      const result = timetableNotificationService['interpolateTemplate'](template, data);
      expect(result).toBe('Hello John, your class Programming is at 09:00');
    });

    it('should handle missing template variables', () => {
      const template = 'Hello {{name}}, your class {{courseName}} is at {{time}}';
      const data = {
        name: 'John'
        // Missing courseName and time
      };

      const result = timetableNotificationService['interpolateTemplate'](template, data);
      expect(result).toBe('Hello John, your class  is at ');
    });
  });

  describe('helper methods', () => {
    it('should calculate total hours correctly', () => {
      const entries = [
        { ...mockTimetable.entries[0], duration: 90 },
        { ...mockTimetable.entries[0], duration: 60 },
        { ...mockTimetable.entries[0], duration: 120 }
      ];

      const totalHours = timetableNotificationService['calculateTotalHours'](entries);
      expect(totalHours).toBe(4.5); // (90 + 60 + 120) / 60 = 4.5 hours
    });

    it('should handle empty entries array', () => {
      const totalHours = timetableNotificationService['calculateTotalHours']([]);
      expect(totalHours).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle notification service failures gracefully', async () => {
      mockNotificationService.sendNotification.mockRejectedValue(new Error('Service unavailable'));

      const result = await timetableNotificationService.notifyTimetablePublished(
        mockTimetable,
        mockStakeholders
      );

      expect(result.success).toBe(false);
    });

    it('should continue processing other notifications on partial failure', async () => {
      mockNotificationService.sendNotification
        .mockResolvedValueOnce({ success: false, errors: ['Failed to send'] } as any)
        .mockResolvedValue({ success: true, notificationId: 'notif_123' } as any);

      const result = await timetableNotificationService.notifyTimetablePublished(
        mockTimetable,
        mockStakeholders
      );

      // Should still have some successful results
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('stakeholder filtering', () => {
    it('should filter affected stakeholders correctly', async () => {
      const specificEntry = mockTimetable.entries[0];
      const affectedStakeholders = await timetableNotificationService['getAffectedStakeholders'](
        [specificEntry],
        mockStakeholders
      );

      expect(affectedStakeholders).toBeDefined();
      expect(affectedStakeholders.students.length).toBeGreaterThan(0);
      expect(affectedStakeholders.faculty.length).toBeGreaterThan(0);
    });
  });
});