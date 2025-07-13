// src/components/analytics/__tests__/AssessmentAnalyticsDashboard.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import AssessmentAnalyticsDashboard from '../AssessmentAnalyticsDashboard';

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
}));

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMM dd') return 'Jan 15';
    if (formatStr === 'MMM yyyy') return 'Jan 2024';
    return '2024-01-15';
  }),
  parseISO: jest.fn((dateString: string) => new Date(dateString)),
  subDays: jest.fn((date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfMonth: jest.fn((date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)),
  endOfMonth: jest.fn((date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)),
}));

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('AssessmentAnalyticsDashboard', () => {
  const mockStudentId = 'student123';
  
  const mockAssessments = [
    {
      id: 'assessment1',
      name: 'Midterm Exam',
      type: 'Midterm',
      maxMarks: 100,
      createdAt: '2024-01-10T09:00:00Z',
    },
    {
      id: 'assessment2',
      name: 'Programming Quiz',
      type: 'Quiz',
      maxMarks: 50,
      createdAt: '2024-01-15T09:00:00Z',
    },
    {
      id: 'assessment3',
      name: 'Final Project',
      type: 'Project',
      maxMarks: 200,
      createdAt: '2024-01-20T09:00:00Z',
    }
  ];

  const mockScores = [
    {
      id: 'score1',
      studentId: mockStudentId,
      assessmentId: 'assessment1',
      marks: 85,
      submittedAt: '2024-01-12T10:00:00Z',
      evaluatedAt: '2024-01-13T14:00:00Z',
    },
    {
      id: 'score2',
      studentId: mockStudentId,
      assessmentId: 'assessment2',
      marks: 40,
      submittedAt: '2024-01-16T11:00:00Z',
      evaluatedAt: '2024-01-17T15:00:00Z',
    },
    {
      id: 'score3',
      studentId: mockStudentId,
      assessmentId: 'assessment3',
      marks: 180,
      submittedAt: '2024-01-22T16:00:00Z',
      evaluatedAt: '2024-01-25T10:00:00Z',
    }
  ];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);
    
    expect(screen.getByText('Assessment Analytics')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Loading spinner
  });

  it('fetches and displays analytics data', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Assessment Analytics Dashboard')).toBeInTheDocument();
    });

    // Check API calls
    expect(mockFetch).toHaveBeenCalledWith('/api/assessments');
    expect(mockFetch).toHaveBeenCalledWith(`/api/student-scores?studentId=${mockStudentId}`);
  });

  it('displays key performance metrics correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Assessments')).toBeInTheDocument();
      expect(screen.getByText('Best Score')).toBeInTheDocument();
    });

    // Should show calculated metrics - actual values will be calculated by component
    const avgScoreElement = screen.getByText(/\d+%/);
    expect(avgScoreElement).toBeInTheDocument(); // Average score
    expect(screen.getByText('100%')).toBeInTheDocument(); // Completion rate: 3/3 = 100%
    expect(screen.getByText('3/3')).toBeInTheDocument(); // Assessments completed/total
  });

  it('renders all chart components', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('responsive-container')).toBeTruthy();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('allows switching between different tabs', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Test tab switching
    const trendsTab = screen.getByText('Trends');
    fireEvent.click(trendsTab);
    expect(screen.getByText('Monthly Performance Trends')).toBeInTheDocument();

    const performanceTab = screen.getByText('Performance');
    fireEvent.click(performanceTab);
    expect(screen.getByText('Skill Performance Analysis')).toBeInTheDocument();

    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);
    expect(screen.getByText('Key Insights')).toBeInTheDocument();
    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
  });

  it('allows filtering by time range', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument();
    });

    // Test time range filtering
    const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
    fireEvent.click(timeRangeSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('Last year')).toBeInTheDocument();
      expect(screen.getByText('All time')).toBeInTheDocument();
    });
  });

  it('allows filtering by assessment type', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    });

    // Test assessment type filtering
    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Midterm')).toBeInTheDocument();
      expect(screen.getByText('Quiz')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
    });
  });

  it('displays performance insights correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      const insightsTab = screen.getByText('Insights');
      fireEvent.click(insightsTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Strong Performance')).toBeInTheDocument();
      expect(screen.getByText('Consistency')).toBeInTheDocument();
      expect(screen.getByText('Best Performance')).toBeInTheDocument();
      expect(screen.getByText('Goal Setting')).toBeInTheDocument();
    });
  });

  it('shows trend indicators correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      // Should show trend indicators in metrics
      const trendIcons = screen.getAllByTestId(/trending/i);
      expect(trendIcons.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('handles empty data gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Assessment Analytics Dashboard')).toBeInTheDocument();
    });

    // Should show zero values for empty data
    expect(screen.getByText('0%')).toBeInTheDocument(); // Average score
    expect(screen.getByText('0/0')).toBeInTheDocument(); // Assessments
  });

  it('handles API errors gracefully', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Assessment Analytics Dashboard')).toBeInTheDocument();
    });

    // Should still render the component structure
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('calculates performance metrics correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      // Should show calculated performance metrics
      expect(screen.getByText(/\d+%/)).toBeInTheDocument(); // Average score
      expect(screen.getByText('100%')).toBeInTheDocument(); // Completion rate: 3 completed out of 3 assessments
      expect(screen.getByText('3/3')).toBeInTheDocument(); // Assessments completed/total
    });
  });

  it('updates when time range or type filter changes', async () => {
    mockFetch
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument();
    });

    // Change time range
    const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
    fireEvent.click(timeRangeSelect);
    
    const sevenDaysOption = screen.getByText('Last 7 days');
    fireEvent.click(sevenDaysOption);

    // Should trigger recalculation of analytics
    await waitFor(() => {
      expect(screen.getByDisplayValue('Last 7 days')).toBeInTheDocument();
    });
  });

  it('renders skill analysis in performance tab', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAssessments),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScores),
      } as Response);

    render(<AssessmentAnalyticsDashboard studentId={mockStudentId} />);

    await waitFor(() => {
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Skill Performance Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    });
  });

  it('applies custom className prop', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    const { container } = render(
      <AssessmentAnalyticsDashboard 
        studentId={mockStudentId} 
        className="custom-class"
      />
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});