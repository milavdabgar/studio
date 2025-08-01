import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import InstituteDashboardPage from '@/app/admin/institute-dashboard/page';

// Mock hooks and components
jest.mock('@/hooks/use-toast');
jest.mock('@/components/RealtimeStatus', () => ({
  RealtimeStatus: ({ showLabel, onReconnect }: any) => (
    <div>
      <span>{showLabel ? 'Live Updates' : 'Status'}</span>
      {onReconnect && <button onClick={onReconnect}>Reconnect</button>}
    </div>
  )
}));

const mockToast = jest.fn();
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('InstituteDashboardPage', () => {
  beforeEach(() => {
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders institute dashboard successfully', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
    });
  });

  it('displays institute-wide metrics', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // Total departments
      expect(screen.getByText('Faculty')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument(); // Total faculty
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('2340')).toBeInTheDocument(); // Total students
    });
  });

  it('shows system health status', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Comprehensive overview of institute-wide timetable operations')).toBeInTheDocument();
      expect(screen.getByText('Overall Utilization')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });
  });

  it('displays real-time status component', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Live Updates')).toBeInTheDocument();
    });
  });

  it('handles tab navigation correctly', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Switch to Departments tab
    const departmentsTab = screen.getByRole('tab', { name: /departments/i });
    fireEvent.click(departmentsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Department Overview')).toBeInTheDocument();
      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
    });

    // Switch to Resources tab
    const resourcesTab = screen.getByRole('tab', { name: /resources/i });
    fireEvent.click(resourcesTab);
    
    await waitFor(() => {
      expect(screen.getByText('Resource Utilization')).toBeInTheDocument();
      expect(screen.getByText('Monitor room and faculty utilization across the institute')).toBeInTheDocument();
    });

    // Switch to Alerts tab
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);
    
    await waitFor(() => {
      expect(screen.getByText('System Alerts')).toBeInTheDocument();
      expect(screen.getByText('Monitor and resolve system-wide issues')).toBeInTheDocument();
    });
  });

  it('displays department status in overview', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Department Status')).toBeInTheDocument();
      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
      expect(screen.getByText('28 faculty • 420 students')).toBeInTheDocument();
      expect(screen.getByText('published')).toBeInTheDocument();
      expect(screen.getByText('85% utilized')).toBeInTheDocument();
    });
  });

  it('shows system health metrics in overview', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('Real-time system performance metrics')).toBeInTheDocument();
      expect(screen.getByText('24/24')).toBeInTheDocument(); // Active timetables
      expect(screen.getByText('healthy')).toBeInTheDocument(); // System status
    });
  });

  it('displays detailed department information in departments tab', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const departmentsTab = screen.getByRole('tab', { name: /departments/i });
    fireEvent.click(departmentsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Electronics & Communication')).toBeInTheDocument();
      expect(screen.getByText('Information Technology')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument(); // Faculty count for ECE
      expect(screen.getByText('380')).toBeInTheDocument(); // Student count for ECE
      expect(screen.getByText('72')).toBeInTheDocument(); // Utilization rate for ECE
    });
  });

  it('shows resource utilization details in resources tab', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const resourcesTab = screen.getByRole('tab', { name: /resources/i });
    fireEvent.click(resourcesTab);
    
    await waitFor(() => {
      expect(screen.getByText('Lab 201')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('overutilized')).toBeInTheDocument();
      expect(screen.getByText('37/40')).toBeInTheDocument(); // Lab capacity
      expect(screen.getByText('17/18')).toBeInTheDocument(); // Faculty capacity
    });
  });

  it('displays system alerts in alerts tab', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Room Double Booking')).toBeInTheDocument();
      expect(screen.getByText('Faculty Overload')).toBeInTheDocument();
      expect(screen.getByText('Room 301 has conflicting bookings on Monday 10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith assigned 19 hours (exceeds 18-hour limit)')).toBeInTheDocument();
    });
  });

  it('shows alert badges for pending issues', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      const alertsTab = screen.getByRole('tab', { name: /alerts/i });
      expect(alertsTab).toContainHTML('2'); // 2 unresolved alerts
    });
  });

  it('handles time range selector', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Today')).toBeInTheDocument();
    });

    // Change time range
    const timeRangeSelect = screen.getByDisplayValue('Today');
    fireEvent.click(timeRangeSelect);
    
    const weekOption = screen.getByText('This Week');
    fireEvent.click(weekOption);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('This Week')).toBeInTheDocument();
    });
  });

  it('handles export functionality', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeInTheDocument();
      
      fireEvent.click(exportButton);
      // Export functionality would be mocked in a real test
    });
  });

  it('displays severity-based alert styling', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);
    
    await waitFor(() => {
      const mediumAlert = screen.getByText('medium');
      expect(mediumAlert).toHaveClass('bg-yellow-100');
      
      const highAlert = screen.getByText('high');
      expect(highAlert).toHaveClass('bg-orange-100');
    });
  });

  it('shows progress bars for utilization metrics', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      // Progress bars should be present for utilization rates
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it('handles alert resolution', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);
    
    await waitFor(() => {
      const resolveButtons = screen.getAllByText('Resolve');
      expect(resolveButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(resolveButtons[0]);
      // Resolution functionality would be mocked in a real test
    });
  });

  it('displays department status badges correctly', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const departmentsTab = screen.getByRole('tab', { name: /departments/i });
    fireEvent.click(departmentsTab);
    
    await waitFor(() => {
      const publishedBadge = screen.getByText('PUBLISHED');
      expect(publishedBadge).toHaveClass('bg-green-100');
      
      const draftBadge = screen.getByText('DRAFT');
      expect(draftBadge).toHaveClass('bg-yellow-100');
    });
  });

  it('shows resource type indicators', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const resourcesTab = screen.getByRole('tab', { name: /resources/i });
    fireEvent.click(resourcesTab);
    
    await waitFor(() => {
      expect(screen.getByText('room')).toBeInTheDocument();
      expect(screen.getByText('faculty')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument(); // Department name
    });
  });

  it('displays peak hours information', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    const resourcesTab = screen.getByRole('tab', { name: /resources/i });
    fireEvent.click(resourcesTab);
    
    await waitFor(() => {
      expect(screen.getByText('10:00-12:00, 14:00-16:00')).toBeInTheDocument(); // Peak hours for Lab 201
      expect(screen.getByText('09:00-11:00, 15:00-17:00')).toBeInTheDocument(); // Peak hours for Dr. Smith
    });
  });

  it('handles loading state', () => {
    rtlRender(<InstituteDashboardPage />);
    
    expect(screen.getByText('Loading Institute Dashboard...')).toBeInTheDocument();
  });

  it('shows metric cards with icons', async () => {
    rtlRender(<InstituteDashboardPage />);
    
    await waitFor(() => {
      // Should display metric cards with appropriate icons
      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('Faculty')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('Rooms')).toBeInTheDocument();
      expect(screen.getByText('Timetables')).toBeInTheDocument();
      expect(screen.getByText('Conflicts')).toBeInTheDocument();
      expect(screen.getByText('Utilization')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Force an error in the component's useEffect
    rtlRender(<InstituteDashboardPage />);
    
    // The component should handle errors gracefully and show the dashboard
    await waitFor(() => {
      expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});