import React from 'react';
import { render } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton Component', () => {
  it('should render skeleton with default classes', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
    expect(skeleton).toHaveClass('bg-muted');
  });

  it('should apply custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).toHaveClass('animate-pulse'); // Should still have default classes
  });

  it('should render as a div element', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild;
    expect(skeleton?.nodeName).toBe('DIV');
  });

  it('should support custom dimensions through className', () => {
    const { container } = render(<Skeleton className="h-20 w-20" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-20');
    expect(skeleton).toHaveClass('w-20');
  });

  it('should pass through HTML attributes', () => {
    const { container } = render(<Skeleton data-testid="test-skeleton" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('data-testid', 'test-skeleton');
  });

  it('should support aria attributes for accessibility', () => {
    const { container } = render(<Skeleton aria-label="Loading content" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });
});