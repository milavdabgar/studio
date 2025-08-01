import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import FacultyTimetablePage from '@/app/faculty/timetable/page';

const mockToast = jest.fn();

// Mock hooks and services
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));
jest.mock('@/lib/api/timetables');
jest.mock('@/lib/api/faculty');
jest.mock('@/lib/api/courses');
jest.mock('@/lib/services/roomService');
jest.mock('@/lib/api/programs');
jest.mock('@/lib/api/batches');

// Mock cookie for authentication
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'auth_user=' + encodeURIComponent(JSON.stringify({
    email: 'faculty@test.com',
    name: 'Test Faculty',
    activeRole: 'faculty',
    availableRoles: ['faculty'],
    id: 'faculty123'
  }))
});

const mockFacultyData = {
  id: 'faculty123',
  userId: 'faculty123',
  firstName: 'Dr. John',
  lastName: 'Smith',
  email: 'faculty@test.com'
};

const mockTimetableEntries = [
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
    dayOfWeek: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    courseId: 'course2',
    facultyId: 'faculty123',
    roomId: 'room2',
    entryType: 'lab'
  },
  {
    dayOfWeek: 'Tuesday',
    startTime: '14:00',
    endTime: '15:00',
    courseId: 'course3',
    facultyId: 'faculty123',
    roomId: 'room1',
    entryType: 'lecture'
  }
];

const mockTimetables = [
  {
    id: 'timetable1',
    name: 'CS Sem 3',
    status: 'published',
    version: '1.0',
    batchId: 'batch1',
    programId: 'program1',
    entries: mockTimetableEntries
  }
];

const mockCourses = [
  { id: 'course1', subjectName: 'Data Structures' },
  { id: 'course2', subjectName: 'Database Lab' },
  { id: 'course3', subjectName: 'Algorithms' }
];

const mockRooms = [
  { id: 'room1', roomNumber: '101' },
  { id: 'room2', roomNumber: 'Lab 201' }
];

const mockPrograms = [
  { id: 'program1', code: 'CS' }
];

const mockBatches = [
  { id: 'batch1', name: 'CS-A' }
];

describe('FacultyTimetablePage', () => {
  beforeEach(() => {
    // Mock API services
    const { timetableService } = require('@/lib/api/timetables');
    const { facultyService } = require('@/lib/api/faculty');
    const { courseService } = require('@/lib/api/courses');
    const { roomService } = require('@/lib/services/roomService');
    const { programService } = require('@/lib/api/programs');
    const { batchService } = require('@/lib/api/batches');

    timetableService.getAllTimetables = jest.fn().mockResolvedValue(mockTimetables);
    facultyService.getAllFaculty = jest.fn().mockResolvedValue([mockFacultyData]);
    courseService.getAllCourses = jest.fn().mockResolvedValue(mockCourses);
    roomService.getAllRooms = jest.fn().mockResolvedValue(mockRooms);
    programService.getAllPrograms = jest.fn().mockResolvedValue(mockPrograms);
    batchService.getAllBatches = jest.fn().mockResolvedValue(mockBatches);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders faculty timetable page successfully', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('My Teaching Schedule')).toBeInTheDocument();
    });
  });

  it('displays faculty workload metrics', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      // Should show total hours (3 classes = 3 hours)
      expect(screen.getByText('3h')).toBeInTheDocument();
      // Should show course count
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 courses
    });
  });

  it('displays faculty schedule in tabbed interface', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });
  });

  it('shows schedule tab content by default', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Teaching Schedule')).toBeInTheDocument();
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('Database Lab')).toBeInTheDocument();
    });
  });

  it('switches to workload analysis tab', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    // Wait for the component to load and workload analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
      expect(screen.getByText('3h')).toBeInTheDocument(); // Total hours should be displayed
    });

    const workloadTab = screen.getByText('Workload Analysis');
    fireEvent.click(workloadTab);

    await waitFor(() => {
      expect(screen.getByText('Weekly Distribution')).toBeInTheDocument();
      expect(screen.getByText('Time Slot Usage')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('detects workload overload conflicts', async () => {
    // Create overloaded faculty with many classes
    const overloadedEntries = Array.from({ length: 20 }, (_, i) => ({
      dayOfWeek: 'Monday',
      startTime: `${9 + Math.floor(i / 8)}:00`,
      endTime: `${10 + Math.floor(i / 8)}:00`,
      courseId: `course${i}`,
      facultyId: 'faculty123',
      roomId: 'room1',
      entryType: 'lecture'
    }));

    const { timetableService } = require('@/lib/api/timetables');
    timetableService.getAllTimetables = jest.fn().mockResolvedValue([{
      ...mockTimetables[0],
      entries: overloadedEntries
    }]);

    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
    });

    const workloadTab = screen.getByText('Workload Analysis');
    fireEvent.click(workloadTab);

    await waitFor(() => {
      expect(screen.getByText('Workload Issues')).toBeInTheDocument();
      expect(screen.getByText(/exceeds maximum limit/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('detects back-to-back class conflicts', async () => {
    const backToBackEntries = [
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
        dayOfWeek: 'Monday',
        startTime: '10:00',
        endTime: '11:00',
        courseId: 'course2',
        facultyId: 'faculty123',
        roomId: 'room2',
        entryType: 'lecture'
      },
      {
        dayOfWeek: 'Monday',
        startTime: '11:00',
        endTime: '12:00',
        courseId: 'course3',
        facultyId: 'faculty123',
        roomId: 'room1',
        entryType: 'lecture'
      },
      {
        dayOfWeek: 'Monday',
        startTime: '12:00',
        endTime: '13:00',
        courseId: 'course4',
        facultyId: 'faculty123',
        roomId: 'room2',
        entryType: 'lecture'
      }
    ];

    const { timetableService } = require('@/lib/api/timetables');
    timetableService.getAllTimetables = jest.fn().mockResolvedValue([{
      ...mockTimetables[0],
      entries: backToBackEntries
    }]);

    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
    });

    const workloadTab = screen.getByText('Workload Analysis');
    fireEvent.click(workloadTab);

    await waitFor(() => {
      expect(screen.getByText('Workload Issues')).toBeInTheDocument();
      expect(screen.getByText(/consecutive classes/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows alerts tab with faculty notifications', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });

    const alertsTab = screen.getByText('Alerts');
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByText('Faculty Alerts')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calculates weekly distribution correctly', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
    });

    const workloadTab = screen.getByText('Workload Analysis');
    fireEvent.click(workloadTab);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      // Monday should have 2 hours, Tuesday should have 1 hour
      expect(screen.getByText('2.0h')).toBeInTheDocument();
      expect(screen.getByText('1.0h')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calculates time slot distribution correctly', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
    });

    const workloadTab = screen.getByText('Workload Analysis');
    fireEvent.click(workloadTab);

    await waitFor(() => {
      expect(screen.getByText('Time Slot Usage')).toBeInTheDocument();
      expect(screen.getByText('09:00-10:00')).toBeInTheDocument();
      expect(screen.getByText('10:00-11:00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles no timetable data gracefully', async () => {
    const { facultyService } = require('@/lib/api/faculty');
    facultyService.getAllFaculty = jest.fn().mockResolvedValue([]);

    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Faculty profile not found.'
      });
    });
  });

  it('handles API errors gracefully', async () => {
    const { timetableService } = require('@/lib/api/timetables');
    timetableService.getAllTimetables = jest.fn().mockRejectedValue(new Error('API Error'));

    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load timetable data.'
      });
    });
  });

  it('displays utilization rate correctly', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      // 3 hours out of 18 max hours = 16.7% utilization (rounded to 17%)
      expect(screen.getByText('17%')).toBeInTheDocument();
    });
  });

  it('shows conflict count in summary', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      // Should show 0 conflicts for normal workload
      expect(screen.getByText('0')).toBeInTheDocument(); // Conflicts count
    });
  });

  it('handles authentication errors', async () => {
    // Clear cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    });

    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'User not logged in.'
      });
    });
  });

  it('displays faculty name in header', async () => {
    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading state initially', () => {
    // Mock the APIs to delay response to keep loading state visible
    const { timetableService } = require('@/lib/api/timetables');
    timetableService.getAllTimetables = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
    
    rtlRender(<FacultyTimetablePage />);
    
    // Loading state shows a spinner, not text
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles empty schedule gracefully', async () => {
    const { timetableService } = require('@/lib/api/timetables');
    timetableService.getAllTimetables = jest.fn().mockResolvedValue([{
      ...mockTimetables[0],
      entries: []
    }]);

    rtlRender(<FacultyTimetablePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Your schedule is not available or no classes are assigned.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});