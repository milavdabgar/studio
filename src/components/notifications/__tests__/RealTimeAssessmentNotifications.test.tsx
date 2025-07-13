// src/components/notifications/__tests__/RealTimeAssessmentNotifications.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import RealTimeAssessmentNotifications from '../RealTimeAssessmentNotifications';

// Mock the useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock date-fns functions
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
  parseISO: jest.fn((dateString) => new Date(dateString)),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('RealTimeAssessmentNotifications', () => {
  const mockStudentId = 'student123';
  
  const mockUpcomingAssessments = [
    {
      id: 'assessment1',
      name: 'Midterm Exam',
      courseName: 'Computer Science 101',
      type: 'Midterm',
      status: 'Published',
      dueDate: '2024-07-20T09:00:00Z',
      createdAt: '2024-07-10T09:00:00Z',
      maxMarks: 100,
    },
    {
      id: 'assessment2',
      name: 'Programming Assignment',
      courseName: 'Data Structures',
      type: 'Assignment',
      status: 'Published',
      dueDate: '2024-07-25T23:59:00Z',
      createdAt: '2024-07-15T09:00:00Z',
      maxMarks: 50,
    }
  ];

  const mockRecentNotifications = [
    {
      id: 'notif1',
      userId: mockStudentId,
      message: 'Your assignment "Programming Assignment" has been graded.',
      type: 'assignment_graded',
      isRead: false,
      link: '/student/results?assessmentId=assessment1',
      createdAt: '2024-07-13T10:00:00Z',
      updatedAt: '2024-07-13T10:00:00Z',
    },
    {
      id: 'notif2',
      userId: mockStudentId,
      message: 'New assessment "Midterm Exam" has been assigned in Computer Science 101.',
      type: 'assignment_new',
      isRead: true,
      link: '/student/assessments?id=assessment1',
      createdAt: '2024-07-12T14:00:00Z',
      updatedAt: '2024-07-12T14:00:00Z',
    }
  ];

  beforeEach(() => {
    mockFetch.mockClear();
    mockToast.mockClear();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);
    
    expect(screen.getByText('Assessment Notifications')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Loading spinner
  });

  it('fetches and displays upcoming assessments', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUpcomingAssessments),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecentNotifications),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
      expect(screen.getByText('Programming Assignment')).toBeInTheDocument();
    });

    expect(screen.getByText('Computer Science 101 • Due 2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('Data Structures • Due 2 hours ago')).toBeInTheDocument();
  });

  it('fetches and displays recent notifications', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecentNotifications),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Your assignment "Programming Assignment" has been graded.')).toBeInTheDocument();
      expect(screen.getByText('New assessment "Midterm Exam" has been assigned in Computer Science 101.')).toBeInTheDocument();
    });
  });

  it('displays correct urgency badges for assessments', async () => {
    const urgentAssessment = {
      ...mockUpcomingAssessments[0],
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Due in 2 hours
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([urgentAssessment]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
    });

    // Should show high urgency badge since it's due soon
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows progress bars for assessments', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUpcomingAssessments),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
    });

    // Should show progress percentages
    const progressElements = screen.getAllByText(/%$/);
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('displays appropriate notification icons', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecentNotifications),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Your assignment "Programming Assignment" has been graded.')).toBeInTheDocument();
    });

    // Should have notification icons (we can't easily test specific icons, but we can verify they exist)
    const notifications = screen.getAllByRole('link');
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('handles empty states correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('No upcoming assessments')).toBeInTheDocument();
      expect(screen.getByText('No recent notifications')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      // Should still render the component structure
      expect(screen.getByText('Assessment Notifications')).toBeInTheDocument();
      // Wait for loading to complete
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Should show empty states when errors occur
    await waitFor(() => {
      expect(screen.getByText('No upcoming assessments')).toBeInTheDocument();
      expect(screen.getByText('No recent notifications')).toBeInTheDocument();
    });
  });

  it('refreshes data automatically', async () => {
    jest.useFakeTimers();
    
    mockFetch
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} refreshInterval={1000} />);

    // Initial fetch calls (2 calls: assessments + notifications)
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Should have made additional calls after interval
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    jest.useRealTimers();
  });

  it('makes correct API calls with proper parameters', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/assessments?studentId=${mockStudentId}&status=pending&upcoming=true`
      );
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/notifications?userId=${mockStudentId}&type=assessment&recent=true&limit=5`
      );
    });
  });

  it('shows live indicator and last refresh time', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText(/Updated 2 hours ago/)).toBeInTheDocument();
    });
  });

  it('renders action buttons correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RealTimeAssessmentNotifications studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('View All Assessments')).toBeInTheDocument();
      expect(screen.getByText('All Notifications')).toBeInTheDocument();
    });

    // Check that links are correct
    const assessmentsLink = screen.getByText('View All Assessments').closest('a');
    const notificationsLink = screen.getByText('All Notifications').closest('a');
    
    expect(assessmentsLink).toHaveAttribute('href', '/student/assessments');
    expect(notificationsLink).toHaveAttribute('href', '/notifications');
  });
});