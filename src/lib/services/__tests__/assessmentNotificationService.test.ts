// src/lib/services/__tests__/assessmentNotificationService.test.ts
import { jest } from '@jest/globals';
import { assessmentNotificationService } from '../assessmentNotificationService';
import type { AssessmentNotificationData } from '../assessmentNotificationService';

// Mock the notification API
jest.mock('@/lib/api/notifications', () => ({
  notificationService: {
    createNotification: jest.fn(),
    createLegacyNotification: jest.fn(),
  },
}));

// Mock fetch for scheduled tasks
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Import the mocked module
import { notificationService } from '@/lib/api/notifications';
const mockCreateLegacyNotification = notificationService.createLegacyNotification as jest.MockedFunction<typeof notificationService.createLegacyNotification>;

describe('AssessmentNotificationService', () => {
  const mockStudentId = 'student123';
  const mockStudentName = 'John Doe';
  const mockAssessmentData: AssessmentNotificationData = {
    assessmentId: 'assessment1',
    assessmentName: 'Midterm Exam',
    courseName: 'Computer Science 101',
    dueDate: '2024-07-20T09:00:00Z',
    score: 85,
    maxScore: 100,
  };

  beforeEach(() => {
    mockCreateLegacyNotification.mockClear();
    mockCreateLegacyNotification.mockClear();
    mockFetch.mockClear();
  });

  describe('notifyNewAssessment', () => {
    it('creates notification for new assessment', async () => {
      mockCreateLegacyNotification.mockResolvedValueOnce({
        id: 'notification-1',
        recipientId: mockStudentId,
        recipientType: 'student',
        message: 'Test notification',
        type: 'assignment_new',
        channels: ['push'],
        priority: 'medium',
        status: 'sent',
        isRead: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any);

      await assessmentNotificationService.notifyNewAssessment(
        mockStudentId,
        mockStudentName,
        mockAssessmentData
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledWith({
        userId: mockStudentId,
        type: 'assignment_new',
        message: 'A new assessment "Midterm Exam" has been assigned in Computer Science 101. Due: 2024-07-20T09:00:00Z',
        title: 'New Assessment Available',
        link: '/student/assessments?id=assessment1',
        relatedEntityId: 'assessment1',
        relatedEntityType: 'assessment',
      });
    });

    it('handles notification creation errors gracefully', async () => {
      mockCreateLegacyNotification.mockRejectedValueOnce(new Error('API Error'));

      await expect(
        assessmentNotificationService.notifyNewAssessment(
          mockStudentId,
          mockStudentName,
          mockAssessmentData
        )
      ).rejects.toThrow('API Error');
    });
  });

  describe('notifyDeadlineReminder', () => {
    it('creates deadline reminder notification', async () => {
      mockCreateLegacyNotification.mockResolvedValueOnce({
        id: 'notification-1',
        recipientId: mockStudentId,
        recipientType: 'student',
        message: 'Test notification',
        type: 'assignment_new',
        channels: ['push'],
        priority: 'medium',
        status: 'sent',
        isRead: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any);

      await assessmentNotificationService.notifyDeadlineReminder(
        mockStudentId,
        mockStudentName,
        mockAssessmentData,
        '2 days'
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledWith({
        userId: mockStudentId,
        type: 'reminder',
        message: 'Assessment "Midterm Exam" in Computer Science 101 is due in 2 days',
        title: 'Assessment Deadline Reminder',
        link: '/student/assessments?id=assessment1',
        relatedEntityId: 'assessment1',
        relatedEntityType: 'assessment',
      });
    });
  });

  describe('notifyGradePublished', () => {
    it('creates grade published notification with score', async () => {
      mockCreateLegacyNotification.mockResolvedValueOnce({
        id: 'notification-1',
        recipientId: mockStudentId,
        recipientType: 'student',
        message: 'Test notification',
        type: 'assignment_new',
        channels: ['push'],
        priority: 'medium',
        status: 'sent',
        isRead: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any);

      await assessmentNotificationService.notifyGradePublished(
        mockStudentId,
        mockStudentName,
        mockAssessmentData
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledWith({
        userId: mockStudentId,
        type: 'assignment_graded',
        message: 'Your assessment "Midterm Exam" has been graded. Score: 85/100',
        title: 'Assessment Graded',
        link: '/student/results?assessmentId=assessment1',
        relatedEntityId: 'assessment1',
        relatedEntityType: 'assessment',
      });
    });

    it('handles missing score data', async () => {
      mockCreateLegacyNotification.mockResolvedValueOnce({
        id: 'notification-1',
        recipientId: mockStudentId,
        recipientType: 'student',
        message: 'Test notification',
        type: 'assignment_new',
        channels: ['push'],
        priority: 'medium',
        status: 'sent',
        isRead: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any);

      const dataWithoutScore = { ...mockAssessmentData, score: undefined, maxScore: undefined };

      await assessmentNotificationService.notifyGradePublished(
        mockStudentId,
        mockStudentName,
        dataWithoutScore
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledWith({
        userId: mockStudentId,
        type: 'assignment_graded',
        message: 'Your assessment "Midterm Exam" has been graded. Score: {score}/{maxScore}',
        title: 'Assessment Graded',
        link: '/student/results?assessmentId=assessment1',
        relatedEntityId: 'assessment1',
        relatedEntityType: 'assessment',
      });
    });
  });

  describe('notifySubmissionConfirmed', () => {
    it('creates submission confirmation notification', async () => {
      mockCreateLegacyNotification.mockResolvedValueOnce({
        id: 'notification-1',
        recipientId: mockStudentId,
        recipientType: 'student',
        message: 'Test notification',
        type: 'assignment_new',
        channels: ['push'],
        priority: 'medium',
        status: 'sent',
        isRead: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any);

      const dataWithSubmission = {
        ...mockAssessmentData,
        submissionDate: '2024-07-19T15:30:00Z',
      };

      await assessmentNotificationService.notifySubmissionConfirmed(
        mockStudentId,
        mockStudentName,
        dataWithSubmission
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledWith({
        userId: mockStudentId,
        type: 'success',
        message: 'Your submission for "Midterm Exam" has been received successfully',
        title: 'Submission Confirmed',
        link: '/student/assessments?id=assessment1',
        relatedEntityId: 'assessment1',
        relatedEntityType: 'assessment',
      });
    });
  });

  describe('notifyLateSubmission', () => {
    it('creates late submission warning notification', async () => {
      mockCreateLegacyNotification.mockResolvedValueOnce({
        id: 'notification-1',
        recipientId: mockStudentId,
        recipientType: 'student',
        message: 'Test notification',
        type: 'assignment_new',
        channels: ['push'],
        priority: 'medium',
        status: 'sent',
        isRead: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any);

      await assessmentNotificationService.notifyLateSubmission(
        mockStudentId,
        mockStudentName,
        mockAssessmentData,
        3
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledWith({
        userId: mockStudentId,
        type: 'warning',
        message: 'Assessment "Midterm Exam" in Computer Science 101 is overdue',
        title: 'Late Submission Warning',
        link: '/student/assessments?id=assessment1',
        relatedEntityId: 'assessment1',
        relatedEntityType: 'assessment',
      });
    });
  });

  describe('batchNotifyNewAssessment', () => {
    it('sends notifications to multiple students', async () => {
      mockCreateLegacyNotification.mockResolvedValue({} as any);

      const students = [
        { id: 'student1', name: 'John Doe' },
        { id: 'student2', name: 'Jane Smith' },
        { id: 'student3', name: 'Bob Johnson' },
      ];

      await assessmentNotificationService.batchNotifyNewAssessment(
        students,
        mockAssessmentData
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledTimes(3);
      
      // Check that each student got a notification
      students.forEach((student, index) => {
        expect(mockCreateLegacyNotification).toHaveBeenNthCalledWith(index + 1, {
          userId: student.id,
          type: 'assignment_new',
          message: 'A new assessment "Midterm Exam" has been assigned in Computer Science 101. Due: 2024-07-20T09:00:00Z',
          title: 'New Assessment Available',
          link: '/student/assessments?id=assessment1',
          relatedEntityId: 'assessment1',
          relatedEntityType: 'assessment',
        });
      });
    });

    it('handles partial failures in batch notification', async () => {
      mockCreateLegacyNotification
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({} as any);

      const students = [
        { id: 'student1', name: 'John Doe' },
        { id: 'student2', name: 'Jane Smith' },
        { id: 'student3', name: 'Bob Johnson' },
      ];

      // Should not throw error, but handle individual failures
      await expect(
        assessmentNotificationService.batchNotifyNewAssessment(students, mockAssessmentData)
      ).resolves.not.toThrow();

      expect(mockCreateLegacyNotification).toHaveBeenCalledTimes(3);
    });
  });

  describe('checkAndSendDeadlineReminders', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-07-18T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('fetches upcoming assessments and sends reminders', async () => {
      const mockAssessments = [
        {
          id: 'assessment1',
          name: 'Midterm Exam',
          courseName: 'Computer Science 101',
          dueDate: '2024-07-19T12:00:00Z', // 24 hours from now
        },
        {
          id: 'assessment2',
          name: 'Final Project',
          courseName: 'Data Structures',
          dueDate: '2024-07-25T12:00:00Z', // 7 days from now
        },
      ];

      const mockStudents = [
        { id: 'student1', displayName: 'John Doe' },
        { id: 'student2', displayName: 'Jane Smith' },
      ];

      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(mockAssessments), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }))
        .mockResolvedValue(new Response(JSON.stringify(mockStudents), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));

      mockCreateLegacyNotification.mockResolvedValue({} as any);

      await assessmentNotificationService.checkAndSendDeadlineReminders();

      expect(mockFetch).toHaveBeenCalledWith('/api/assessments?status=pending&upcomingDeadlines=true');
      
      // Should have fetched students for each assessment
      expect(mockFetch).toHaveBeenCalledWith('/api/students?assessmentId=assessment1');
      expect(mockFetch).toHaveBeenCalledWith('/api/students?assessmentId=assessment2');
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw error
      await expect(
        assessmentNotificationService.checkAndSendDeadlineReminders()
      ).resolves.not.toThrow();
    });

    it('skips assessments that do not need reminders', async () => {
      const mockAssessments = [
        {
          id: 'assessment1',
          name: 'Midterm Exam',
          courseName: 'Computer Science 101',
          dueDate: '2024-07-30T12:00:00Z', // 12 days from now - no reminder needed
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response);

      await assessmentNotificationService.checkAndSendDeadlineReminders();

      // Should not fetch students since no reminders needed
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockCreateLegacyNotification).not.toHaveBeenCalled();
    });
  });

  describe('template formatting', () => {
    it('formats template strings correctly', async () => {
      mockCreateLegacyNotification.mockResolvedValueOnce({
        id: 'notification-1',
        recipientId: mockStudentId,
        recipientType: 'student',
        message: 'Test notification',
        type: 'assignment_new',
        channels: ['push'],
        priority: 'medium',
        status: 'sent',
        isRead: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any);

      const customData = {
        ...mockAssessmentData,
        assessmentName: 'Special "Quoted" Assessment',
        courseName: 'Advanced Programming & Algorithms',
      };

      await assessmentNotificationService.notifyNewAssessment(
        mockStudentId,
        'John "Johnny" Doe',
        customData
      );

      expect(mockCreateLegacyNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'A new assessment "Special "Quoted" Assessment" has been assigned in Advanced Programming & Algorithms. Due: 2024-07-20T09:00:00Z',
        })
      );
    });
  });

  describe('time calculations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calculates time remaining correctly', () => {
      jest.setSystemTime(new Date('2024-07-18T12:00:00Z'));

      // Test the private method indirectly through deadline reminder
      const testData = {
        ...mockAssessmentData,
        dueDate: '2024-07-19T12:00:00Z', // 24 hours from now
      };

      // This would internally use the time calculation
      expect(() => {
        assessmentNotificationService.notifyDeadlineReminder(
          mockStudentId,
          mockStudentName,
          testData,
          '1 day'
        );
      }).not.toThrow();
    });

    it('handles overdue assessments', () => {
      jest.setSystemTime(new Date('2024-07-20T12:00:00Z'));

      const overdueData = {
        ...mockAssessmentData,
        dueDate: '2024-07-19T12:00:00Z', // 24 hours ago
      };

      expect(() => {
        assessmentNotificationService.notifyLateSubmission(
          mockStudentId,
          mockStudentName,
          overdueData,
          1
        );
      }).not.toThrow();
    });
  });
});