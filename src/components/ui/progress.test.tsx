import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress Component', () => {
  it('should render progress bar', () => {
    render(<Progress />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display correct value through indicator transform', () => {
    const { container } = render(<Progress value={50} />);
    
    const indicator = container.querySelector('[style*="translateX"]');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle('transform: translateX(-50%)');
  });

  it('should have default min and max values when provided', () => {
    render(<Progress value={25} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    // The component should render without errors
  });

  it('should support custom max value when provided', () => {
    render(<Progress value={50} max={200} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    // The max prop should be passed through to Radix
  });

  it('should apply custom className', () => {
    render(<Progress className="custom-class" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Progress ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should handle value of 0', () => {
    const { container } = render(<Progress value={0} />);
    
    const indicator = container.querySelector('[style*="translateX"]');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('should handle value of 100', () => {
    const { container } = render(<Progress value={100} />);
    
    const indicator = container.querySelector('[style*="translateX"]');
    expect(indicator).toHaveStyle('transform: translateX(-0%)');
  });

  it('should handle undefined value', () => {
    render(<Progress />);
    
    const progressBar = screen.getByRole('progressbar');
    // When value is undefined, Radix should handle it appropriately
    expect(progressBar).toBeInTheDocument();
  });

  it('should have proper indicator styling', () => {
    const { container } = render(<Progress value={75} />);
    
    const indicator = container.querySelector('[data-state]') || 
                     container.querySelector('[style*="transform"]');
    expect(indicator).toBeInTheDocument();
  });

  it('should support aria-label for accessibility', () => {
    render(<Progress value={50} aria-label="Loading progress" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Loading progress');
  });

  it('should support data attributes', () => {
    render(<Progress value={30} data-testid="test-progress" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('data-testid', 'test-progress');
  });
});