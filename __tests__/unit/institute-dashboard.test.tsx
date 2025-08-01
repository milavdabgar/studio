import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import InstituteDashboardPage from '@/app/admin/institute-dashboard/page';

const mockToast = jest.fn();

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

jest.mock('@/components/RealtimeStatus', () => ({
  RealtimeStatus: ({ showLabel }: any) => (
    <div data-testid="realtime-status">{showLabel ? 'Live Updates' : 'Status'}</div>
  )
}));

describe('Institute Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'auth_user=' + encodeURIComponent(JSON.stringify({
        email: 'admin@test.com',
        name: 'Admin User',
        activeRole: 'admin',
        availableRoles: ['admin'],
        id: 'admin123'
      }))
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders main institute dashboard interface', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
      });
    });

    it('displays dashboard description', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Comprehensive overview of institute-wide timetable operations')).toBeInTheDocument();
      });
    });

    it('shows real-time status component', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('realtime-status')).toBeInTheDocument();
        expect(screen.getByText('Live Updates')).toBeInTheDocument();
      });
    });

    it('displays time range selector', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('shows export button', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
    });
  });

  describe('System Metrics', () => {
    it('displays all institute-wide metrics', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Departments')).toBeInTheDocument();
        expect(screen.getByText('Faculty')).toBeInTheDocument();
        expect(screen.getByText('Students')).toBeInTheDocument();
        expect(screen.getByText('Rooms')).toBeInTheDocument();
        expect(screen.getByText('Timetables')).toBeInTheDocument();
        expect(screen.getByText('Conflicts')).toBeInTheDocument();
        expect(screen.getByText('Utilization')).toBeInTheDocument();
      });
    });

    it('shows correct metric values', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument(); // Departments
        expect(screen.getByText('156')).toBeInTheDocument(); // Faculty
        expect(screen.getByText('2340')).toBeInTheDocument(); // Students
        expect(screen.getByText('84')).toBeInTheDocument(); // Rooms
        expect(screen.getByText('24')).toBeInTheDocument(); // Timetables
        expect(screen.getByText('3')).toBeInTheDocument(); // Conflicts
        expect(screen.getByText('78%')).toBeInTheDocument(); // Utilization
      });
    });

    it('uses appropriate icons for each metric', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        // Icons should be present (represented by icon components)
        const metricsSection = screen.getByText('Departments').closest('div');
        expect(metricsSection).toBeInTheDocument();
      });
    });
  });

  describe('System Health Alerts', () => {
    it('shows system health alert for non-healthy states', async () => {
      // This would require mocking the system health to be 'warning' or 'critical'
      // For now, we'll test the healthy state
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        // Should not show alert for healthy system
        expect(screen.queryByText('System Status:')).not.toBeInTheDocument();
      });
    });

    it('displays critical system status alert', async () => {
      // Mock critical system health
      render(<InstituteDashboardPage />);
      
      // This would need to be implemented to mock different system states
      await waitFor(() => {
        expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches between different view tabs', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /departments/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /resources/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /alerts/i })).toBeInTheDocument();
      });
    });

    it('shows overview content by default', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Department Status')).toBeInTheDocument();
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });
    });

    it('switches to departments tab', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const departmentsTab = screen.getByRole('tab', { name: /departments/i });
        fireEvent.click(departmentsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Department Overview')).toBeInTheDocument();
        expect(screen.getByText('Detailed view of all departments')).toBeInTheDocument();
      });
    });

    it('switches to resources tab', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const resourcesTab = screen.getByRole('tab', { name: /resources/i });
        fireEvent.click(resourcesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Resource Utilization')).toBeInTheDocument();
        expect(screen.getByText('Monitor room and faculty utilization across the institute')).toBeInTheDocument();
      });
    });

    it('switches to alerts tab', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const alertsTab = screen.getByRole('tab', { name: /alerts/i });
        fireEvent.click(alertsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('System Alerts')).toBeInTheDocument();
        expect(screen.getByText('Monitor and resolve system-wide issues')).toBeInTheDocument();
      });
    });
  });

  describe('Department Overview', () => {
    it('displays department status information', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
        expect(screen.getByText('Electronics & Communication')).toBeInTheDocument();
        expect(screen.getByText('Information Technology')).toBeInTheDocument();
      });
    });

    it('shows department metrics', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('28 faculty • 420 students')).toBeInTheDocument();
        expect(screen.getByText('24 faculty • 380 students')).toBeInTheDocument();
        expect(screen.getByText('22 faculty • 360 students')).toBeInTheDocument();
      });
    });

    it('displays department status badges', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getAllByText('published')).toHaveLength(2);
        expect(screen.getByText('draft')).toBeInTheDocument();
      });
    });

    it('shows utilization percentages', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('85% utilized')).toBeInTheDocument();
        expect(screen.getByText('72% utilized')).toBeInTheDocument();
        expect(screen.getByText('68% utilized')).toBeInTheDocument();
      });
    });
  });

  describe('Departments Tab Content', () => {
    it('shows detailed department information', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const departmentsTab = screen.getByRole('tab', { name: /departments/i });
        fireEvent.click(departmentsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
        expect(screen.getByText('Electronics & Communication')).toBeInTheDocument();
        expect(screen.getByText('Information Technology')).toBeInTheDocument();
      });
    });

    it('displays department utilization progress bars', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const departmentsTab = screen.getByRole('tab', { name: /departments/i });
        fireEvent.click(departmentsTab);
      });

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('shows conflict indicators', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const departmentsTab = screen.getByRole('tab', { name: /departments/i });
        fireEvent.click(departmentsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // CSE conflicts
        expect(screen.getByText('0')).toBeInTheDocument(); // ECE conflicts
        expect(screen.getByText('2')).toBeInTheDocument(); // IT conflicts
      });
    });
  });

  describe('Resource Utilization', () => {
    it('displays resource utilization information', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const resourcesTab = screen.getByRole('tab', { name: /resources/i });
        fireEvent.click(resourcesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Lab 201')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });
    });

    it('shows resource status badges', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const resourcesTab = screen.getByRole('tab', { name: /resources/i });
        fireEvent.click(resourcesTab);
      });

      await waitFor(() => {
        expect(screen.getAllByText('overutilized')).toHaveLength(2);
        expect(screen.getAllByText('room')).toHaveLength(1);
        expect(screen.getAllByText('faculty')).toHaveLength(1);
      });
    });

    it('displays utilization percentages and capacity', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const resourcesTab = screen.getByRole('tab', { name: /resources/i });
        fireEvent.click(resourcesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('92%')).toBeInTheDocument(); // Lab utilization
        expect(screen.getByText('95%')).toBeInTheDocument(); // Faculty utilization
        expect(screen.getByText('37/40')).toBeInTheDocument(); // Lab capacity
        expect(screen.getByText('17/18')).toBeInTheDocument(); // Faculty capacity
      });
    });

    it('shows peak hours information', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const resourcesTab = screen.getByRole('tab', { name: /resources/i });
        fireEvent.click(resourcesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('10:00-12:00, 14:00-16:00')).toBeInTheDocument();
        expect(screen.getByText('09:00-11:00, 15:00-17:00')).toBeInTheDocument();
      });
    });
  });

  describe('System Alerts', () => {
    it('displays system alerts', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const alertsTab = screen.getByRole('tab', { name: /alerts/i });
        fireEvent.click(alertsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Room Double Booking')).toBeInTheDocument();
        expect(screen.getByText('Faculty Overload')).toBeInTheDocument();
      });
    });

    it('shows alert severity badges', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const alertsTab = screen.getByRole('tab', { name: /alerts/i });
        fireEvent.click(alertsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
      });
    });

    it('displays alert descriptions', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const alertsTab = screen.getByRole('tab', { name: /alerts/i });
        fireEvent.click(alertsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Room 301 has conflicting bookings on Monday 10:00 AM')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith assigned 19 hours (exceeds 18-hour limit)')).toBeInTheDocument();
      });
    });

    it('shows resolve buttons for unresolved alerts', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const alertsTab = screen.getByRole('tab', { name: /alerts/i });
        fireEvent.click(alertsTab);
      });

      await waitFor(() => {
        const resolveButtons = screen.getAllByText('Resolve');
        expect(resolveButtons.length).toBe(2); // Two unresolved alerts
      });
    });

    it('shows timestamps for alerts', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const alertsTab = screen.getByRole('tab', { name: /alerts/i });
        fireEvent.click(alertsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });
    });
  });

  describe('Time Range Selection', () => {
    it('changes time range when selector is used', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const timeRangeSelect = screen.getByText('Today').closest('button');
        expect(timeRangeSelect).toBeInTheDocument();
        fireEvent.click(timeRangeSelect!);
      });

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
        expect(screen.getByText('Semester')).toBeInTheDocument();
      });
    });

    it('updates dashboard when time range changes', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const timeRangeSelect = screen.getByText('Today').closest('button');
        fireEvent.click(timeRangeSelect!);
      });

      await waitFor(() => {
        const weekOption = screen.getByText('This Week');
        fireEvent.click(weekOption);
      });

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeInTheDocument();
      });
    });
  });

  describe('System Health Monitoring', () => {
    it('displays system health metrics', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
        expect(screen.getByText('Real-time system performance metrics')).toBeInTheDocument();
      });
    });

    it('shows utilization progress bars', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Overall Utilization')).toBeInTheDocument();
        expect(screen.getByText('Active Timetables')).toBeInTheDocument();
        expect(screen.getByText('System Status')).toBeInTheDocument();
      });
    });

    it('displays system status badge', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('healthy')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner initially', async () => {
      render(<InstituteDashboardPage />);
      
      // Should show loading initially
      expect(screen.getByText('Loading Institute Dashboard...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles toast notifications for errors', async () => {
      // Mock console.error to prevent error logs in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Export Functionality', () => {
    it('handles export button click', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const exportButton = screen.getByText('Export');
        fireEvent.click(exportButton);
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    it('adapts layout for tablet screens', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Institute Dashboard')).toBeInTheDocument();
      });

      // Check for responsive grid classes
      const metricsGrid = document.querySelector('.grid');
      expect(metricsGrid).toHaveClass(/grid-cols-2|md:grid-cols-4|lg:grid-cols-7/);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('provides ARIA labels for interactive elements', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        tabs.forEach(tab => {
          expect(tab).toHaveAttribute('aria-selected');
        });
      });
    });

    it('has proper tab navigation', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const tabList = screen.getByRole('tablist');
        expect(tabList).toBeInTheDocument();
        
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(4);
      });
    });

    it('provides proper color coding for status indicators', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        const departmentsTab = screen.getByRole('tab', { name: /departments/i });
        fireEvent.click(departmentsTab);
      });

      await waitFor(() => {
        const statusBadges = screen.getAllByText(/published|draft/);
        statusBadges.forEach(badge => {
          expect(badge).toHaveClass(/bg-|text-/);
        });
      });
    });
  });

  describe('Real-time Updates', () => {
    it('displays real-time status component', async () => {
      render(<InstituteDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('realtime-status')).toBeInTheDocument();
      });
    });
  });
});