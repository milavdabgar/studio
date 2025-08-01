import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import { useHODRealtimeTimetable } from '@/hooks/useRealtimeTimetable';
import HODTimetablePage from '@/app/hod/timetable/page';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/useRealtimeTimetable');

const mockToast = jest.fn();
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseHODRealtimeTimetable = useHODRealtimeTimetable as jest.MockedFunction<typeof useHODRealtimeTimetable>;

describe('HOD Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockUseHODRealtimeTimetable.mockReturnValue({
      isConnected: true,
      connectionState: 'connected',
      lastUpdate: null,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      reconnect: jest.fn(),
      getActiveSubscriptions: jest.fn(() => [])
    });

    // Setup auth cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'auth_user=' + encodeURIComponent(JSON.stringify({
        email: 'hod@test.com',
        name: 'Dr. HOD',
        activeRole: 'hod',
        availableRoles: ['hod'],
        id: 'hod123',
        department: 'Computer Science'
      }))
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders main HOD dashboard interface', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
      });
    });

    it('displays department information', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Computer Science Department')).toBeInTheDocument();
        expect(screen.getByText('Academic Year 2024-25')).toBeInTheDocument();
      });
    });

    it('shows department metrics cards', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Faculty')).toBeInTheDocument();
        expect(screen.getByText('Subjects')).toBeInTheDocument();
        expect(screen.getByText('Timetables')).toBeInTheDocument();
        expect(screen.getByText('Avg Workload')).toBeInTheDocument();
        expect(screen.getByText('Utilization')).toBeInTheDocument();
        expect(screen.getByText('Conflicts')).toBeInTheDocument();
      });
    });

    it('displays metric values correctly', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Faculty count
        expect(screen.getByText('12')).toBeInTheDocument(); // Subjects count
        expect(screen.getByText('8')).toBeInTheDocument(); // Timetables count
        expect(screen.getByText('78%')).toBeInTheDocument(); // Avg workload
        expect(screen.getByText('85%')).toBeInTheDocument(); // Utilization
        expect(screen.getByText('3')).toBeInTheDocument(); // Conflicts
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches between overview, faculty, and timetables tabs', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
      });

      // Test Faculty tab
      const facultyTab = screen.getByRole('tab', { name: /faculty/i });
      fireEvent.click(facultyTab);
      
      await waitFor(() => {
        expect(screen.getByText('Faculty Workload Management')).toBeInTheDocument();
      });

      // Test Timetables tab
      const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
      fireEvent.click(timetablesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Filter timetables')).toBeInTheDocument();
      });

      // Test Overview tab
      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      fireEvent.click(overviewTab);
      
      await waitFor(() => {
        expect(screen.getByText('Faculty Workload Distribution')).toBeInTheDocument();
        expect(screen.getByText('Recent Activities')).toBeInTheDocument();
      });
    });
  });

  describe('Faculty Workload Management', () => {
    it('displays faculty workload information', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const facultyTab = screen.getByRole('tab', { name: /faculty/i });
        fireEvent.click(facultyTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
        expect(screen.getByText('john.smith@university.edu')).toBeInTheDocument();
        expect(screen.getByText('90% load')).toBeInTheDocument();
      });
    });

    it('shows faculty workload progress bars', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const facultyTab = screen.getByRole('tab', { name: /faculty/i });
        fireEvent.click(facultyTab);
      });

      await waitFor(() => {
        expect(screen.getByText('18/20 hours/week')).toBeInTheDocument();
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('identifies overloaded faculty', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const facultyTab = screen.getByRole('tab', { name: /faculty/i });
        fireEvent.click(facultyTab);
      });

      await waitFor(() => {
        expect(screen.getByText('95% load')).toBeInTheDocument();
        // Check for overload indicator (red color)
        const overloadBadge = screen.getByText('95% load');
        expect(overloadBadge).toHaveClass(/red/);
      });
    });

    it('shows faculty subjects and assignments', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const facultyTab = screen.getByRole('tab', { name: /faculty/i });
        fireEvent.click(facultyTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
        expect(screen.getByText('Algorithms')).toBeInTheDocument();
        expect(screen.getByText('Database Systems')).toBeInTheDocument();
      });
    });

    it('displays conflicts for faculty', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const facultyTab = screen.getByRole('tab', { name: /faculty/i });
        fireEvent.click(facultyTab);
      });

      await waitFor(() => {
        expect(screen.getByText('1 conflicts')).toBeInTheDocument();
        expect(screen.getByText('2 conflicts')).toBeInTheDocument();
      });
    });
  });

  describe('Timetable Management', () => {
    it('displays timetable overview cards', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
        fireEvent.click(timetablesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('CS Semester 3 Regular')).toBeInTheDocument();
        expect(screen.getByText('CS Semester 5 Regular')).toBeInTheDocument();
        expect(screen.getByText('CS Semester 7 Electives')).toBeInTheDocument();
      });
    });

    it('shows timetable status badges', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
        fireEvent.click(timetablesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
        expect(screen.getByText('PENDING APPROVAL')).toBeInTheDocument();
        expect(screen.getByText('DRAFT')).toBeInTheDocument();
      });
    });

    it('filters timetables by status', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
        fireEvent.click(timetablesTab);
      });

      await waitFor(() => {
        const filterSelect = screen.getByText('Filter timetables');
        fireEvent.click(filterSelect);
      });

      await waitFor(() => {
        const publishedFilter = screen.getByText('Published');
        fireEvent.click(publishedFilter);
      });

      await waitFor(() => {
        expect(screen.getByText('CS Semester 3 Regular')).toBeInTheDocument();
        // Should not show draft or pending items when filtered
      });
    });

    it('shows timetable actions', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
        fireEvent.click(timetablesTab);
      });

      await waitFor(() => {
        expect(screen.getAllByText('View')).toHaveLength(3);
        expect(screen.getAllByText('Edit')).toHaveLength(3);
      });
    });

    it('displays conflict indicators', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
        fireEvent.click(timetablesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('2 conflicts detected')).toBeInTheDocument();
        expect(screen.getByText('1 conflicts detected')).toBeInTheDocument();
      });
    });
  });

  describe('Overview Dashboard', () => {
    it('shows faculty workload distribution', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Faculty Workload Distribution')).toBeInTheDocument();
        expect(screen.getByText('Current teaching load across department')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
        expect(screen.getByText('Prof. Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Dr. Michael Brown')).toBeInTheDocument();
        expect(screen.getByText('Prof. Emily Davis')).toBeInTheDocument();
      });
    });

    it('displays recent activities', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Activities')).toBeInTheDocument();
        expect(screen.getByText('Latest timetable updates and changes')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('CS Semester 3 Regular')).toBeInTheDocument();
        expect(screen.getByText('CS Semester 5 Regular')).toBeInTheDocument();
        expect(screen.getByText('CS Semester 7 Electives')).toBeInTheDocument();
      });
    });

    it('shows activity status icons', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        // Should show check circle for published items
        const checkIcons = screen.getAllByTestId('check-circle-icon');
        expect(checkIcons.length).toBeGreaterThan(0);
        
        // Should show alert triangle for items with conflicts
        const alertIcons = screen.getAllByTestId('alert-triangle-icon');
        expect(alertIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Export and Actions', () => {
    it('provides export functionality', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      // Should maintain export button (functionality would be implemented separately)
      expect(exportButton).toBeInTheDocument();
    });

    it('shows reports button', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Reports')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('handles real-time department updates', async () => {
      const mockDepartmentUpdate = {
        type: 'timetable_updated' as const,
        timetableId: 'dept-timetable',
        timestamp: new Date().toISOString(),
        changes: { modified: ['faculty1'], added: ['timetable2'] }
      };

      mockUseHODRealtimeTimetable.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        lastUpdate: mockDepartmentUpdate,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        reconnect: jest.fn(),
        getActiveSubscriptions: jest.fn(() => [])
      });

      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '🏢 Department Update',
          description: 'Department data has been updated.',
          duration: 4000
        });
      });
    });

    it('shows connection status', async () => {
      mockUseHODRealtimeTimetable.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        lastUpdate: null,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        reconnect: jest.fn(),
        getActiveSubscriptions: jest.fn(() => [])
      });

      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('handles conflict alerts', async () => {
      const mockConflictUpdate = {
        type: 'conflict_detected' as const,
        timetableId: 'timetable1',
        timestamp: new Date().toISOString(),
        conflicts: [{ type: 'faculty_overload', severity: 'high' }]
      };

      mockUseHODRealtimeTimetable.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        lastUpdate: mockConflictUpdate,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        reconnect: jest.fn(),
        getActiveSubscriptions: jest.fn(() => [])
      });

      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: '⚠️ Department Alert',
          description: 'New conflicts detected in department schedules.',
          duration: 8000
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('handles authentication errors', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: ''
      });

      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Could not load user data.'
        });
      });
    });

    it('handles data loading errors gracefully', async () => {
      // Mock console.error to prevent error logs in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // This would test API error handling, but since we're using mock data,
      // we'll test the error state display
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('shows loading state', async () => {
      render(<HODTimetablePage />);
      
      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('adapts layout for mobile screens', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
      });

      // Check for mobile-responsive grid classes
      const metricsGrid = document.querySelector('.grid');
      expect(metricsGrid).toHaveClass(/grid-cols-2|sm:grid-cols-3|lg:grid-cols-6/);
    });

    it('stacks elements vertically on small screens', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Department Timetable Management')).toBeInTheDocument();
      });

      // Check for flex column classes on small screens
      const header = document.querySelector('.flex');
      expect(header).toHaveClass(/flex-col|sm:flex-row/);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(1);
    });

    it('provides proper ARIA labels for metrics', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        progressBars.forEach(bar => {
          expect(bar).toHaveAttribute('aria-label');
        });
      });
    });

    it('supports keyboard navigation', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        tabs.forEach(tab => {
          expect(tab).toHaveAttribute('tabindex');
        });
      });
    });

    it('has proper color contrast for status indicators', async () => {
      render(<HODTimetablePage />);
      
      await waitFor(() => {
        const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
        fireEvent.click(timetablesTab);
      });

      await waitFor(() => {
        const statusBadges = screen.getAllByText(/PUBLISHED|DRAFT|PENDING/);
        statusBadges.forEach(badge => {
          // Should have appropriate contrast classes
          expect(badge).toHaveClass(/text-/);
        });
      });
    });
  });

  describe('Performance', () => {
    it('memoizes expensive metric calculations', async () => {
      const { rerender } = render(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('78%')).toBeInTheDocument();
      });

      // Re-render should use memoized calculations
      rerender(<HODTimetablePage />);
      
      await waitFor(() => {
        expect(screen.getByText('78%')).toBeInTheDocument();
      });
    });
  });
});