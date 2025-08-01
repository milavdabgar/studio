import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import { useStudentRealtimeTimetable, useFacultyRealtimeTimetable, useHODRealtimeTimetable } from '@/hooks/useRealtimeTimetable';

// Import pages to test
import StudentTimetablePage from '@/app/student/timetable/page';
import FacultyTimetablePage from '@/app/faculty/timetable/page';
import HODDashboardPage from '@/app/hod/dashboard/page';
import InstituteDashboardPage from '@/app/admin/institute-dashboard/page';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/useRealtimeTimetable');
jest.mock('@/lib/api/timetables');
jest.mock('@/lib/api/students');
jest.mock('@/lib/api/faculty');
jest.mock('@/lib/api/courses');
jest.mock('@/lib/services/roomService');
jest.mock('@/lib/api/programs');
jest.mock('@/lib/api/batches');
jest.mock('@/components/RealtimeStatus', () => ({
  RealtimeStatus: ({ showLabel }: any) => (
    <div data-testid="realtime-status">{showLabel ? 'Live Updates' : 'Status'}</div>
  ),
  RealtimeNotification: ({ title, message }: any) => (
    <div data-testid="realtime-notification">{title}: {message}</div>
  )
}));

const mockToast = jest.fn();
const mockUseToast = jest.mocked(useToast);
const mockUseStudentRealtimeTimetable = jest.mocked(useStudentRealtimeTimetable);
const mockUseFacultyRealtimeTimetable = jest.mocked(useFacultyRealtimeTimetable);
const mockUseHODRealtimeTimetable = jest.mocked(useHODRealtimeTimetable);

// Common test data
const mockTimetableData = {
  id: 'timetable123',
  name: 'CS Semester 3',
  academicYear: '2024-25',
  semester: 3,
  batchId: 'batch123',
  programId: 'program123',
  status: 'published',
  version: '1.0',
  entries: [
    {
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      courseId: 'course1',
      facultyId: 'faculty123',
      roomId: 'room1',
      entryType: 'lecture'
    },
    {
      dayOfWeek: 'Tuesday',
      startTime: '10:00',
      endTime: '11:00',
      courseId: 'course2',
      facultyId: 'faculty123',
      roomId: 'room2',
      entryType: 'lab'
    }
  ]
};

const mockStudentData = {
  id: 'student123',
  userId: 'student123',
  batchId: 'batch123',
  firstName: 'Test',
  lastName: 'Student'
};

const mockFacultyData = {
  id: 'faculty123',
  userId: 'faculty123',
  firstName: 'Dr. John',
  lastName: 'Smith',
  email: 'faculty@test.com'
};

const mockCourses = [
  { id: 'course1', subjectName: 'Data Structures' },
  { id: 'course2', subjectName: 'Database Systems' }
];

const mockRooms = [
  { id: 'room1', roomNumber: '101' },
  { id: 'room2', roomNumber: 'Lab 201' }
];

const mockPrograms = [
  { id: 'program123', code: 'CS' }
];

const mockBatches = [
  { id: 'batch123', name: 'CS-A' }
];

// Helper function to setup common mocks
const setupMocks = (role: 'student' | 'faculty' | 'hod' | 'admin') => {
  mockUseToast.mockReturnValue({ 
    toast: mockToast,
    dismiss: jest.fn(),
    toasts: []
  });
  
  // Setup real-time hooks - include all properties from the actual hook return type
  mockUseStudentRealtimeTimetable.mockReturnValue({
    isConnected: true,
    connectionState: 'connected',
    lastUpdate: null,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    reconnect: jest.fn(),
    getActiveSubscriptions: jest.fn(() => [])
  });
  
  mockUseFacultyRealtimeTimetable.mockReturnValue({
    isConnected: true,
    connectionState: 'connected',
    lastUpdate: null,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    reconnect: jest.fn(),
    getActiveSubscriptions: jest.fn(() => [])
  });

  mockUseHODRealtimeTimetable.mockReturnValue({
    isConnected: true,
    connectionState: 'connected',
    lastUpdate: null,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    reconnect: jest.fn(),
    getActiveSubscriptions: jest.fn(() => [])
  });

  // Setup API mocks
  const { timetableService } = require('@/lib/api/timetables');
  const { studentService } = require('@/lib/api/students');
  const { facultyService } = require('@/lib/api/faculty');
  const { courseService } = require('@/lib/api/courses');
  const { roomService } = require('@/lib/services/roomService');
  const { programService } = require('@/lib/api/programs');
  const { batchService } = require('@/lib/api/batches');

  timetableService.getAllTimetables = jest.fn().mockResolvedValue([mockTimetableData]);
  studentService.getAllStudents = jest.fn().mockResolvedValue([mockStudentData]);
  facultyService.getAllFaculty = jest.fn().mockResolvedValue([mockFacultyData]);
  courseService.getAllCourses = jest.fn().mockResolvedValue(mockCourses);
  roomService.getAllRooms = jest.fn().mockResolvedValue(mockRooms);
  programService.getAllPrograms = jest.fn().mockResolvedValue(mockPrograms);
  batchService.getAllBatches = jest.fn().mockResolvedValue(mockBatches);

  // Setup cookie for authentication
  const cookieData = {
    student: {
      email: 'student@test.com',
      name: 'Test Student',
      activeRole: 'student',
      availableRoles: ['student'],
      id: 'student123'
    },
    faculty: {
      email: 'faculty@test.com',
      name: 'Test Faculty',
      activeRole: 'faculty',
      availableRoles: ['faculty'],
      id: 'faculty123'
    },
    hod: {
      email: 'hod@test.com',
      name: 'Test HOD',
      activeRole: 'hod',
      availableRoles: ['hod'],
      id: 'hod123'
    },
    admin: {
      email: 'admin@test.com',
      name: 'Test Admin',
      activeRole: 'admin',
      availableRoles: ['admin'],
      id: 'admin123'
    }
  };

  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: 'auth_user=' + encodeURIComponent(JSON.stringify(cookieData[role]))
  });
};

describe('Phase 4: Multi-Stakeholder Timetable Views - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Student Timetable Integration', () => {
    beforeEach(() => {
      setupMocks('student');
    });

    it('renders complete student timetable workflow', async () => {
      rtlRender(<StudentTimetablePage />);
      
      // Should load and display timetable data
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
        expect(screen.getByText('Database Systems')).toBeInTheDocument();
      });

      // Should show statistics
      expect(screen.getByText('2')).toBeInTheDocument(); // Total subjects

      // Should show real-time status
      expect(screen.getByTestId('realtime-status')).toBeInTheDocument();

      // Should handle view switching
      const listTab = screen.getByRole('tab', { name: /list/i });
      fireEvent.click(listTab);
      
      await waitFor(() => {
        expect(screen.getByText('lecture')).toBeInTheDocument();
      });
    });

    it('handles real-time timetable updates for students', async () => {
      const mockReconnect = jest.fn();
      mockUseStudentRealtimeTimetable.mockReturnValue({
        isConnected: true,
        connectionState: 'connected' as const,
        lastUpdate: {
          type: 'timetable_updated',
          timetableId: 'timetable123',
          timestamp: new Date().toISOString(),
          changes: { 
            before: [],
            after: [],
            modified: ['entry1'],
            added: [],
            removed: []
          }
        },
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        reconnect: mockReconnect,
        getActiveSubscriptions: jest.fn(() => [])
      });

      rtlRender(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
      });

      // Real-time updates should trigger data refresh
      expect(mockUseStudentRealtimeTimetable).toHaveBeenCalledWith(
        'student123',
        ['batch123'],
        expect.any(Function)
      );
    });
  });

  describe('Faculty Timetable Integration', () => {
    beforeEach(() => {
      setupMocks('faculty');
    });

    it('renders complete faculty timetable workflow with workload analysis', async () => {
      rtlRender(<FacultyTimetablePage />);
      
      // Should load and display faculty data
      await waitFor(() => {
        expect(screen.getByText('My Teaching Schedule')).toBeInTheDocument();
        expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      });

      // Should show workload metrics
      expect(screen.getByText('2h')).toBeInTheDocument(); // Total hours
      expect(screen.getByText('11%')).toBeInTheDocument(); // Utilization rate

      // Should show tabbed interface
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();

      // Should switch to workload analysis
      const workloadTab = screen.getByText('Workload Analysis');
      fireEvent.click(workloadTab);
      
      await waitFor(() => {
        expect(screen.getByText('Weekly Distribution')).toBeInTheDocument();
        expect(screen.getByText('Time Slot Usage')).toBeInTheDocument();
      });
    });

    it('detects and displays workload conflicts', async () => {
      // Setup overloaded schedule
      const overloadedTimetable = {
        ...mockTimetableData,
        entries: Array.from({ length: 20 }, (_, i) => ({
          dayOfWeek: 'Monday',
          startTime: `${9 + Math.floor(i / 8)}:00`,
          endTime: `${10 + Math.floor(i / 8)}:00`,
          courseId: `course${i}`,
          facultyId: 'faculty123',
          roomId: 'room1',
          entryType: 'lecture'
        }))
      };

      const { timetableService } = require('@/lib/api/timetables');
      timetableService.getAllTimetables = jest.fn().mockResolvedValue([overloadedTimetable]);

      rtlRender(<FacultyTimetablePage />);
      
      await waitFor(() => {
        const workloadTab = screen.getByText('Workload Analysis');
        fireEvent.click(workloadTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Workload Issues')).toBeInTheDocument();
        expect(screen.getByText(/exceeds maximum limit/)).toBeInTheDocument();
      });
    });
  });

  describe('HOD Dashboard Integration', () => {
    beforeEach(() => {
      setupMocks('hod');
    });

    it('renders complete HOD dashboard with department management', async () => {
      rtlRender(<HODDashboardPage />);
      
      // Should load and display department data
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
      });

      // Should show department metrics - check if they exist in the document
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Faculty count from mock
      });

      // Should handle tab navigation
      const facultyTab = screen.getByRole('tab', { name: /faculty/i });
      fireEvent.click(facultyTab);
      
      await waitFor(() => {
        expect(screen.getByText('Faculty Workload Management')).toBeInTheDocument();
      });
    });

    it('handles real-time department updates', async () => {
      const mockReconnect = jest.fn();
      mockUseHODRealtimeTimetable.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected' as const,
        lastUpdate: null,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        reconnect: mockReconnect,
        getActiveSubscriptions: jest.fn(() => [])
      });

      rtlRender(<HODDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      // Should provide reconnect functionality
      expect(mockUseHODRealtimeTimetable).toHaveBeenCalledWith(
        'hod123',
        [],
        expect.any(Function)
      );
    });
  });

  describe('Institute Dashboard Integration', () => {
    beforeEach(() => {
      setupMocks('admin');
    });

    it('renders complete institute dashboard with system-wide metrics', async () => {
      rtlRender(<InstituteDashboardPage />);
      
      // Should load and display institute data
      await waitFor(() => {
        expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
      });

      // Should show institute-wide metrics
      expect(screen.getByText('8')).toBeInTheDocument(); // Departments
      expect(screen.getByText('156')).toBeInTheDocument(); // Faculty
      expect(screen.getByText('2340')).toBeInTheDocument(); // Students

      // Should handle tab navigation
      const departmentsTab = screen.getByRole('tab', { name: /departments/i });
      fireEvent.click(departmentsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Department Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Stakeholder Real-time Updates', () => {
    it('simulates real-time update flow across stakeholders', async () => {
      // Simulate timetable change event
      const timetableChangeEvent = {
        type: 'timetable_updated' as const,
        timetableId: 'timetable123',
        batchId: 'batch123',
        timestamp: new Date().toISOString(),
        changes: {
          before: [],
          after: [],
          modified: ['entry1'],
          added: [],
          removed: []
        }
      };

      // Mock real-time hooks to simulate receiving the event
      mockUseStudentRealtimeTimetable.mockImplementation((userId, batchIds, onTimetableChange) => {
        // Simulate receiving the event
        setTimeout(() => {
          if (onTimetableChange) {
            onTimetableChange(timetableChangeEvent);
          }
        }, 0);
        
        return {
          isConnected: true,
          connectionState: 'connected' as const,
          lastUpdate: timetableChangeEvent,
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          reconnect: jest.fn(),
          getActiveSubscriptions: jest.fn(() => [])
        };
      });

      setupMocks('student');
      rtlRender(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
      });

      // Should handle the real-time update
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '🔄 Timetable Updated',
          description: 'Your timetable has been updated with 1 changes.',
          duration: 5000
        });
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('ensures each stakeholder sees appropriate data', async () => {
      // Test student view
      setupMocks('student');
      const { unmount: unmountStudent } = rtlRender(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
        // Students should see personal timetable only
        expect(screen.queryByText('Faculty Workload')).not.toBeInTheDocument();
      });
      unmountStudent();

      // Test faculty view
      setupMocks('faculty');
      const { unmount: unmountFaculty } = rtlRender(<FacultyTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Teaching Schedule')).toBeInTheDocument();
        // Faculty should see workload analysis
        expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
      });
      unmountFaculty();

      // Test HOD view
      setupMocks('hod');
      const { unmount: unmountHOD } = rtlRender(<HODDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
        // HODs should see department-wide data
        expect(screen.getByText('Faculty Workload Management')).toBeInTheDocument();
      });
      unmountHOD();

      // Test admin view
      setupMocks('admin');
      rtlRender(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
        // Admins should see institute-wide data
        expect(screen.getByText('Comprehensive overview of institute-wide timetable operations')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('renders mobile-friendly interfaces for all stakeholders', async () => {
      setupMocks('student');
      rtlRender(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
        // Should show mobile scroll hint
        expect(screen.getByText('← Swipe to scroll horizontally →')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully across all views', async () => {
      setupMocks('student');
      
      // Mock API failure
      const { timetableService } = require('@/lib/api/timetables');
      timetableService.getAllTimetables = jest.fn().mockRejectedValue(new Error('API Error'));

      rtlRender(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load timetable data.'
        });
      });
    });

    it('handles authentication errors consistently', async () => {
      // Clear cookie to simulate auth error
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: ''
      });

      rtlRender(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'User not logged in.'
        });
      });
    });
  });
});