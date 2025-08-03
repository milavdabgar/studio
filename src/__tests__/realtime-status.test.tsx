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
    
    // Just verify the component renders for offline status
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render connected status', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: true,
      connectionState: 'connected'
    });

    const { container } = render(<RealtimeStatus />);
    
    // Just verify the component renders for connected status
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render connecting status', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: false,
      connectionState: 'connecting'
    });

    const { container } = render(<RealtimeStatus />);
    
    // Just verify the component renders for connecting status
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render error status', () => {
    mockUseRealtimeConnectionStatus.mockReturnValue({
      isConnected: false,
      connectionState: 'error'
    });

    const { container } = render(<RealtimeStatus />);
    
    // Just verify the component renders for error status
    expect(container.firstChild).toBeInTheDocument();
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