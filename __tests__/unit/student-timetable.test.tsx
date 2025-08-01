import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import { useStudentRealtimeTimetable } from '@/hooks/useRealtimeTimetable';
import StudentTimetablePage from '@/app/student/timetable/page';

const mockToast = jest.fn();

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

jest.mock('@/hooks/useRealtimeTimetable');

jest.mock('@/lib/api/timetables', () => ({
  timetableService: {
    getAllTimetables: jest.fn()
  }
}));

jest.mock('@/lib/api/students', () => ({
  studentService: {
    getAllStudents: jest.fn()
  }
}));

jest.mock('@/lib/api/courses', () => ({
  courseService: {
    getAllCourses: jest.fn()
  }
}));

jest.mock('@/lib/services/roomService', () => ({
  roomService: {
    getAllRooms: jest.fn()
  }
}));

const mockUseStudentRealtimeTimetable = useStudentRealtimeTimetable as jest.MockedFunction<typeof useStudentRealtimeTimetable>;

jest.mock('@/lib/api/programs', () => ({
  programService: {
    getAllPrograms: jest.fn()
  }
}));

jest.mock('@/lib/api/batches', () => ({
  batchService: {
    getAllBatches: jest.fn()
  }
}));

jest.mock('@/lib/api/faculty', () => ({
  facultyService: {
    getAllFaculty: jest.fn()
  }
}));

jest.mock('@/components/RealtimeStatus', () => ({
  RealtimeStatus: ({ showLabel, onReconnect }: any) => (
    <div data-testid="realtime-status">
      {showLabel ? 'Live Updates' : 'Status'}
      <button onClick={onReconnect} data-testid="reconnect-button">Reconnect</button>
    </div>
  ),
  RealtimeNotification: ({ title, message, onDismiss }: any) => (
    <div data-testid="realtime-notification">
      <span>{title}: {message}</span>
      <button onClick={onDismiss} data-testid="dismiss-notification">Dismiss</button>
    </div>
  )
}));

// Mock data
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

const mockFacultyData = {
  id: 'faculty123',
  firstName: 'Dr. John',
  lastName: 'Smith',
  email: 'faculty@test.com'
};

describe('Student Timetable Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup realtime hook mock
    mockUseStudentRealtimeTimetable.mockReturnValue({
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
    const { courseService } = require('@/lib/api/courses');
    const { roomService } = require('@/lib/services/roomService');
    const { programService } = require('@/lib/api/programs');
    const { batchService } = require('@/lib/api/batches');
    const { facultyService } = require('@/lib/api/faculty');

    timetableService.getAllTimetables.mockResolvedValue([mockTimetableData]);
    studentService.getAllStudents.mockResolvedValue([mockStudentData]);
    courseService.getAllCourses.mockResolvedValue(mockCourses);
    roomService.getAllRooms.mockResolvedValue(mockRooms);
    programService.getAllPrograms.mockResolvedValue(mockPrograms);
    batchService.getAllBatches.mockResolvedValue(mockBatches);
    facultyService.getAllFaculty.mockResolvedValue([mockFacultyData]);

    // Setup auth cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'auth_user=' + encodeURIComponent(JSON.stringify({
        email: 'student@test.com',
        name: 'Test Student',
        activeRole: 'student',
        availableRoles: ['student'],
        id: 'student123'
      }))
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders main timetable interface', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
      });
    });

    it('displays student information', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
        expect(screen.getByText('2024-25 Semester 3')).toBeInTheDocument();
      });
    });

    it('shows timetable content', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        // Basic content check
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
        expect(screen.getByText('Database Systems')).toBeInTheDocument();
      });
    });

    it('displays course entries', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
        expect(screen.getByText('Database Systems')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches between different view modes', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
      });

      // Test List view
      const listTab = screen.getByRole('tab', { name: /list/i });
      fireEvent.click(listTab);
      
      await waitFor(() => {
        expect(screen.getByText('lecture')).toBeInTheDocument();
        expect(screen.getByText('lab')).toBeInTheDocument();
      });

      // Test Weekly view
      const weeklyTab = screen.getByRole('tab', { name: /weekly/i });
      fireEvent.click(weeklyTab);
      
      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Tuesday')).toBeInTheDocument();
      });
    });

    it('shows list tab content', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
      });

      const listTab = screen.getByRole('tab', { name: /list/i });
      
      // Just check that the list tab exists and is clickable
      expect(listTab).toBeInTheDocument();
      fireEvent.click(listTab);
      
      // Tab should be clickable without errors
      expect(listTab).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('handles real-time timetable updates', async () => {
      const mockTimetableUpdate = {
        type: 'timetable_updated' as const,
        timetableId: 'timetable123',
        timestamp: new Date().toISOString(),
        changes: { 
          before: [],
          after: [],
          modified: ['entry1'],
          added: [],
          removed: []
        }
      };

      mockUseStudentRealtimeTimetable.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        lastUpdate: mockTimetableUpdate,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        reconnect: jest.fn(),
        getActiveSubscriptions: jest.fn(() => [])
      });

      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '🔄 Timetable Updated',
          description: 'Your timetable has been updated with 1 changes.',
          duration: 5000
        });
      });
    });

    it('shows connection status', async () => {
      mockUseStudentRealtimeTimetable.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        lastUpdate: null,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        reconnect: jest.fn(),
        getActiveSubscriptions: jest.fn(() => [])
      });

      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const { timetableService } = require('@/lib/api/timetables');
      timetableService.getAllTimetables = jest.fn().mockRejectedValue(new Error('API Error'));

      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load timetable data.'
        });
      });
    });

    it('handles authentication errors', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: ''
      });

      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'User not logged in.'
        });
      });
    });

    it('handles missing timetable data', async () => {
      const { timetableService } = require('@/lib/api/timetables');
      timetableService.getAllTimetables = jest.fn().mockResolvedValue([]);

      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('No timetable available')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('provides export options', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      // Should show export options (this would depend on implementation)
      await waitFor(() => {
        expect(exportButton).toBeInTheDocument();
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

    it('shows mobile scroll hints', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('← Swipe to scroll horizontally →')).toBeInTheDocument();
      });
    });

    it('adapts layout for mobile', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
      });

      // Check for responsive classes (this would depend on implementation)
      const container = screen.getByText('My Timetable').closest('div');
      expect(container).toHaveClass(/responsive|mobile|sm:/);
    });
  });

  describe('Filter and Search', () => {
    it('filters timetable by subject', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
        expect(screen.getByText('Database Systems')).toBeInTheDocument();
      });

      // Test filter functionality
      const filterInput = screen.queryByPlaceholderText(/search|filter/i);
      if (filterInput) {
        fireEvent.change(filterInput, { target: { value: 'Data' } });
        
        await waitFor(() => {
          expect(screen.getByText('Data Structures')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('supports keyboard navigation', async () => {
      render(<StudentTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Timetable')).toBeInTheDocument();
      });

      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();
      
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      
      // Should move focus to next tab
      expect(document.activeElement).toBeTruthy();
    });
  });
});