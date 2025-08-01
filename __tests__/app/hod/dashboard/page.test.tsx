import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import { useHODRealtimeTimetable } from '@/hooks/useRealtimeTimetable';
import HODDashboardPage from '@/app/hod/dashboard/page';

const mockToast = jest.fn();

// Mock hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));
jest.mock('@/hooks/useRealtimeTimetable');
const mockUseHODRealtimeTimetable = useHODRealtimeTimetable as jest.MockedFunction<typeof useHODRealtimeTimetable>;

// Mock cookie for authentication
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'auth_user=' + encodeURIComponent(JSON.stringify({
    email: 'hod@test.com',
    name: 'Test HOD',
    activeRole: 'hod',
    availableRoles: ['hod'],
    id: 'hod123'
  }))
});

describe('HODDashboardPage', () => {
  beforeEach(() => {
    mockUseHODRealtimeTimetable.mockReturnValue({
      isConnected: true,
      connectionState: 'connected' as const,
      lastUpdate: null,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      reconnect: jest.fn(),
      getActiveSubscriptions: jest.fn(() => [])
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders HOD dashboard successfully', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Department Dashboard')).toBeInTheDocument();
    });
  });

  it('displays department metrics', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument(); // Total faculty
      expect(screen.getByText('480')).toBeInTheDocument(); // Total students
      expect(screen.getByText('18')).toBeInTheDocument(); // Total subjects
    });
  });

  it('shows system health warning when issues exist', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Department Status: WARNING')).toBeInTheDocument();
      expect(screen.getByText(/faculty members are overloaded/)).toBeInTheDocument();
      expect(screen.getByText(/timetable conflicts require attention/)).toBeInTheDocument();
    });
  });

  it('displays faculty workload distribution', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Faculty Workload Distribution')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('106%')).toBeInTheDocument(); // Overloaded faculty
      expect(screen.getByText('Prof. Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument(); // Normal workload
    });
  });

  it('displays resource utilization', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Resource Utilization')).toBeInTheDocument();
      expect(screen.getByText('Computer Lab 201')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument(); // High utilization
      expect(screen.getByText('Classroom 305')).toBeInTheDocument();
    });
  });

  it('handles tab navigation correctly', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Switch to Faculty tab
    const facultyTab = screen.getByRole('tab', { name: /faculty/i });
    fireEvent.click(facultyTab);
    
    await waitFor(() => {
      expect(screen.getByText('Faculty Workload Management')).toBeInTheDocument();
      expect(screen.getByText('Monitor and balance teaching assignments across department')).toBeInTheDocument();
    });

    // Switch to Timetables tab
    const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
    fireEvent.click(timetablesTab);
    
    await waitFor(() => {
      expect(screen.getByText('All Timetables')).toBeInTheDocument();
      expect(screen.getByText('New Timetable')).toBeInTheDocument();
    });

    // Switch to Alerts tab
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Department Alerts & Notifications')).toBeInTheDocument();
    });
  });

  it('displays faculty workload details in faculty tab', async () => {
    rtlRender(<HODDashboardPage />);
    
    const facultyTab = screen.getByRole('tab', { name: /faculty/i });
    fireEvent.click(facultyTab);
    
    await waitFor(() => {
      expect(screen.getByText('john.smith@university.edu')).toBeInTheDocument();
      expect(screen.getByText('19/18 hours/week')).toBeInTheDocument();
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('Algorithms')).toBeInTheDocument();
      expect(screen.getByText('Exceeding maximum teaching hours by 1 hour')).toBeInTheDocument();
    });
  });

  it('displays timetable overview in timetables tab', async () => {
    rtlRender(<HODDashboardPage />);
    
    const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
    fireEvent.click(timetablesTab);
    
    await waitFor(() => {
      expect(screen.getByText('CS Semester 3 Regular')).toBeInTheDocument();
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
      expect(screen.getByText('CS Semester 5 Regular')).toBeInTheDocument();
      expect(screen.getByText('PENDING APPROVAL')).toBeInTheDocument();
      expect(screen.getByText('3 conflicts detected')).toBeInTheDocument();
    });
  });

  it('handles timetable filtering', async () => {
    rtlRender(<HODDashboardPage />);
    
    const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
    fireEvent.click(timetablesTab);
    
    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('All Timetables');
      fireEvent.click(filterSelect);
      
      const publishedOption = screen.getByText('Published');
      fireEvent.click(publishedOption);
    });

    await waitFor(() => {
      expect(screen.getByText('CS Semester 3 Regular')).toBeInTheDocument();
      // Pending approval timetables should be filtered out
    });
  });

  it('displays department alerts in alerts tab', async () => {
    rtlRender(<HODDashboardPage />);
    
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Faculty Overload Alert')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Smith is assigned 19 hours (exceeds 18-hour limit)')).toBeInTheDocument();
      expect(screen.getByText('Timetable Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Room Double Booking')).toBeInTheDocument();
    });
  });

  it('shows badge indicators for pending items', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      // Should show badge for overloaded faculty
      const facultyTab = screen.getByRole('tab', { name: /faculty/i });
      expect(facultyTab).toContainHTML('1'); // 1 overloaded faculty
      
      // Should show badge for pending approvals
      const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
      expect(timetablesTab).toContainHTML('1'); // 1 pending approval
      
      // Should show badge for unresolved alerts
      const alertsTab = screen.getByRole('tab', { name: /alerts/i });
      expect(alertsTab).toContainHTML('3'); // 3 unresolved alerts
    });
  });

  it('handles real-time connection status', async () => {
    mockUseHODRealtimeTimetable.mockReturnValue({
      isConnected: false,
      connectionState: 'disconnected' as const,
      lastUpdate: null,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      reconnect: jest.fn(),
      getActiveSubscriptions: jest.fn(() => [])
    });

    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    const mockReconnect = jest.fn();
    mockUseHODRealtimeTimetable.mockReturnValue({
      isConnected: true,
      connectionState: 'connected' as const,
      lastUpdate: null,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      reconnect: mockReconnect,
      getActiveSubscriptions: jest.fn(() => [])
    });

    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });

    // Should trigger data refresh
    expect(mockReconnect).not.toHaveBeenCalled(); // Refresh button doesn't call reconnect
  });

  it('handles export functionality', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeInTheDocument();
      
      fireEvent.click(exportButton);
      // Export functionality would be mocked in a real test
    });
  });

  it('displays metric cards with correct values', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Faculty')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('Subjects')).toBeInTheDocument();
      expect(screen.getByText('Timetables')).toBeInTheDocument();
      expect(screen.getByText('Avg Workload')).toBeInTheDocument();
      expect(screen.getByText('Utilization')).toBeInTheDocument();
      expect(screen.getByText('Conflicts')).toBeInTheDocument();
    });
  });

  it('shows workload colors correctly', async () => {
    rtlRender(<HODDashboardPage />);
    
    const facultyTab = screen.getByRole('tab', { name: /faculty/i });
    fireEvent.click(facultyTab);
    
    await waitFor(() => {
      // Dr. John Smith should have red indicator for overload (106%)
      const overloadBadge = screen.getByText('106% load');
      expect(overloadBadge).toHaveClass('bg-red-100');
      
      // Prof. Sarah Johnson should have green indicator for normal load (80%)
      const normalBadge = screen.getByText('80% load');
      expect(normalBadge).toHaveClass('bg-green-100');
    });
  });

  it('handles authentication errors', async () => {
    // Clear cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    });

    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Could not load user data.'
      });
    });
  });

  it('shows loading state initially', () => {
    rtlRender(<HODDashboardPage />);
    
    expect(screen.getByText('Loading Department Dashboard...')).toBeInTheDocument();
  });

  it('displays time range selector', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('This Week')).toBeInTheDocument();
    });

    // Change time range
    const timeRangeSelect = screen.getByDisplayValue('This Week');
    fireEvent.click(timeRangeSelect);
    
    const monthOption = screen.getByText('This Month');
    fireEvent.click(monthOption);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('This Month')).toBeInTheDocument();
    });
  });

  it('handles timetable approval action', async () => {
    rtlRender(<HODDashboardPage />);
    
    const timetablesTab = screen.getByRole('tab', { name: /timetables/i });
    fireEvent.click(timetablesTab);
    
    await waitFor(() => {
      const approveButton = screen.getByText('Approve');
      expect(approveButton).toBeInTheDocument();
      
      fireEvent.click(approveButton);
      // Approval functionality would be mocked in a real test
    });
  });

  it('shows resource status indicators', async () => {
    rtlRender(<HODDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('overutilized')).toBeInTheDocument(); // Computer Lab 201
      expect(screen.getByText('optimal')).toBeInTheDocument(); // Classroom 305
      expect(screen.getByText('Maintenance')).toBeInTheDocument(); // Software Lab 301
    });
  });
});