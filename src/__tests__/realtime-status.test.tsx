import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RealtimeStatus } from '@/components/RealtimeStatus';

// Mock the hook
jest.mock('@/hooks/useRealtimeTimetable', () => ({
  useRealtimeConnectionStatus: jest.fn()
}));

import { useRealtimeConnectionStatus } from '@/hooks/useRealtimeTimetable';

const mockUseRealtimeConnectionStatus = useRealtimeConnectionStatus as jest.MockedFunction<typeof useRealtimeConnectionStatus>;

describe('RealtimeStatus Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render offline status by default', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: false,
      connectionState: 'disconnected'
    });

    const { container } = render(<RealtimeStatus />);
    
    // Check for wifi-off icon which indicates offline status
    expect(container.querySelector('.lucide-wifi-off')).toBeInTheDocument();
  });

  it('should render connected status', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: true,
      connectionState: 'connected'
    });

    const { container } = render(<RealtimeStatus />);
    
    // Check for wifi icon which indicates connected status
    expect(container.querySelector('.lucide-wifi')).toBeInTheDocument();
  });

  it('should render connecting status', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: false,
      connectionState: 'connecting'
    });

    const { container } = render(<RealtimeStatus />);
    
    // Check for rotating icon which indicates connecting status
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render error status', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: false,
      connectionState: 'error'
    });

    const { container } = render(<RealtimeStatus />);
    
    // Check for alert icon which indicates error status
    expect(container.querySelector('.lucide-circle-alert')).toBeInTheDocument();
  });

  it('should render with label when showLabel is true', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: true,
      connectionState: 'connected'
    });

    render(<RealtimeStatus showLabel={true} />);
    
    expect(screen.getByText('Live Updates')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: false,
      connectionState: 'disconnected'
    });

    const { container } = render(<RealtimeStatus />);
    expect(container.firstChild).toBeInTheDocument();
  });
});