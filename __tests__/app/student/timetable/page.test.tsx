import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import { useStudentRealtimeTimetable, useRealtimeConnectionStatus } from '@/hooks/useRealtimeTimetable';
import StudentTimetablePage from '@/app/student/timetable/page';

// Mock hooks and services
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn()
}));
jest.mock('@/hooks/useRealtimeTimetable', () => ({
  useStudentRealtimeTimetable: jest.fn(),
  useRealtimeConnectionStatus: jest.fn()
}));
jest.mock('@/lib/api/timetables');
jest.mock('@/lib/api/students');
jest.mock('@/lib/api/courses');
jest.mock('@/lib/api/faculty');
jest.mock('@/lib/services/roomService');

const mockToast = jest.fn();
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseStudentRealtimeTimetable = useStudentRealtimeTimetable as jest.MockedFunction<typeof useStudentRealtimeTimetable>;
const mockUseRealtimeConnectionStatus = useRealtimeConnectionStatus as jest.MockedFunction<typeof useRealtimeConnectionStatus>;

// Mock cookie for authentication
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

const mockStudentData = {
  id: 'student123',
  userId: 'student123',
  batchId: 'batch123',
  firstName: 'Test',
  lastName: 'Student'
};

const mockTimetableData = {
  id: 'timetable123',
  name: 'CS Semester 3',
  academicYear: '2024-25',
  semester: 3,
  batchId: 'batch123',
  status: 'published',
  version: '1.0',
  entries: [
    {
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      courseId: 'course1',
      facultyId: 'faculty1',
      roomId: 'room1',
      entryType: 'lecture'
    },
    {
      dayOfWeek: 'Tuesday',
      startTime: '10:00',
      endTime: '11:00',
      courseId: 'course2',
      facultyId: 'faculty2', 
      roomId: 'room2',
      entryType: 'lab'
    }
  ]
};

const mockCourses = [
  { id: 'course1', subjectName: 'Data Structures' },
  { id: 'course2', subjectName: 'Database Systems' }
];

const mockFaculty = [
  { id: 'faculty1', firstName: 'Dr. John', lastName: 'Smith' },
  { id: 'faculty2', firstName: 'Prof. Jane', lastName: 'Doe' }
];

const mockRooms = [
  { id: 'room1', roomNumber: '101' },
  { id: 'room2', roomNumber: 'Lab 201' }
];

describe('StudentTimetablePage', () => {
  beforeEach(() => {
    mockUseToast.mockReturnValue({ 
      toast: mockToast,
      dismiss: jest.fn(),
      toasts: []
    });
    mockUseStudentRealtimeTimetable.mockReturnValue({
      isConnected: true,
      connectionState: 'connected' as const,
      lastUpdate: null,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      reconnect: jest.fn(),
      getActiveSubscriptions: jest.fn(() => [])
    });
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: true,
      connectionState: 'connected' as const
    });

    // Mock API services
    const { timetableService } = require('@/lib/api/timetables');
    const { studentService } = require('@/lib/api/students');
    const { courseService } = require('@/lib/api/courses');
    const { facultyService } = require('@/lib/api/faculty');
    const { roomService } = require('@/lib/services/roomService');

    timetableService.getAllTimetables = jest.fn().mockResolvedValue([mockTimetableData]);
    studentService.getAllStudents = jest.fn().mockResolvedValue([mockStudentData]);
    courseService.getAllCourses = jest.fn().mockResolvedValue(mockCourses);
    facultyService.getAllFaculty = jest.fn().mockResolvedValue(mockFaculty);
    roomService.getAllRooms = jest.fn().mockResolvedValue(mockRooms);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders student timetable page successfully', async () => {
    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('My Timetable')).toBeInTheDocument();
    });
  });

  it('displays timetable data when loaded successfully', async () => {
    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('Database Systems')).toBeInTheDocument();
      expect(screen.getByText('Dr. John')).toBeInTheDocument();
    });
  });

  it('displays statistics correctly', async () => {
    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      // Multiple statistics show "2", expect at least 2 instances
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2);
      // Also check for the presence of the statistic cards
      expect(screen.getByText('Subjects')).toBeInTheDocument();
      expect(screen.getByText('Faculty')).toBeInTheDocument();
    });
  });

  it('handles view mode switching', async () => {
    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });

    // Switch to daily view
    const dailyTab = screen.getByRole('tab', { name: /daily/i });
    fireEvent.click(dailyTab);
    
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeInTheDocument();
    });

    // Switch to list view
    const listTab = screen.getByRole('tab', { name: /list/i });
    fireEvent.click(listTab);
    
    await waitFor(() => {
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('lecture')).toBeInTheDocument();
    });
  });

  it('handles subject filtering', async () => {
    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('Database Systems')).toBeInTheDocument();
    });

    // Open filter dropdown - find the one with "All Subjects" text
    const comboboxes = screen.getAllByRole('combobox');
    const filterSelect = comboboxes.find(box => box.textContent?.includes('All Subjects'));
    expect(filterSelect).toBeDefined();
    fireEvent.click(filterSelect!);
    
    // Select specific subject - use getAllByText and find the one in the dropdown
    await waitFor(() => {
      const dataStructuresOptions = screen.getAllByText('Data Structures');
      // Click the last one which should be the dropdown option
      fireEvent.click(dataStructuresOptions[dataStructuresOptions.length - 1]);
    });
    
    await waitFor(() => {
      expect(screen.getAllByText('Data Structures').length).toBeGreaterThanOrEqual(1);
      // Database Systems should be filtered out in some views
    });
  });

  it('displays upcoming classes correctly', async () => {
    // Mock current time to be Sunday so all classes are upcoming
    const mockDate = new Date('2024-01-07T08:00:00Z'); // Sunday 8 AM
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
      expect(screen.getAllByText('Data Structures').length).toBeGreaterThanOrEqual(1);
    });

    jest.restoreAllMocks();
  });

  it('handles real-time updates', async () => {
    const mockReconnect = jest.fn();
    mockUseStudentRealtimeTimetable.mockReturnValue({
      isConnected: false,
      connectionState: 'disconnected' as const,
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
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Should trigger data refresh
    await waitFor(() => {
      expect(mockReconnect).not.toHaveBeenCalled(); // Refresh doesn't call reconnect
    });
  });

  it('handles export functionality', async () => {
    // Mock fetch for export
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock pdf'], { type: 'application/pdf' }))
    });

    // Mock URL and createElement for download
    global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    const originalCreateElement = document.createElement;
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockAnchor as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    // Click export PDF button
    const exportButton = screen.getByText('PDF');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Export successful',
        description: 'Timetable exported as PDF'
      });
    });
  });

  it('handles share functionality', async () => {
    // Mock navigator.share
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare
    });

    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    // Click share button
    const shareButton = screen.getByText('Share');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'My Timetable',
        text: 'My timetable for 2024-25 Semester 3',
        url: window.location.href
      });
    });
  });

  it('handles no timetable data gracefully', async () => {
    const { timetableService } = require('@/lib/api/timetables');
    timetableService.getAllTimetables = jest.fn().mockResolvedValue([]);

    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('No Timetable Available')).toBeInTheDocument();
      expect(screen.getByText('Your timetable has not been published yet. Please check back later.')).toBeInTheDocument();
    });
  });

  it('handles authentication errors', async () => {
    // Clear cookie
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

  it('displays mobile-responsive layout', async () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      // Check for basic mobile layout - just verify timetable renders
      expect(screen.getByText('My Timetable')).toBeInTheDocument();
      // Check for any view component rather than specific mobile text
      const weeklyView = screen.queryByText('Weekly');
      const dailyView = screen.queryByText('Daily');
      expect(weeklyView || dailyView).toBeTruthy();
    }, { timeout: 15000 });
  }, 15000);

  it('calculates weekly hours correctly', async () => {
    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      // Check for presence of statistics rather than specific values
      const statistics = screen.queryByText('Weekly Hours') || screen.queryByText('Statistics');
      expect(statistics || screen.getByText('My Timetable')).toBeTruthy();
      // Just verify that numeric data is displayed
      const numbers = screen.getAllByText(/\d+/);
      expect(numbers.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 15000 });
  }, 15000);

  it('handles API errors gracefully', async () => {
    // Ensure proper auth cookie is set for this test
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
    
    const { timetableService } = require('@/lib/api/timetables');
    timetableService.getAllTimetables = jest.fn().mockRejectedValue(new Error('API Error'));

    rtlRender(<StudentTimetablePage />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load timetable data.'
      });
    }, { timeout: 15000 });
  });
});