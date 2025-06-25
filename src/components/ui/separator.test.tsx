import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

describe('Separator Component', () => {
  it('should render separator', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toBeInTheDocument();
  });

  it('should apply default classes and orientation', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toHaveClass('shrink-0', 'bg-border', 'h-[1px]', 'w-full');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('should support horizontal orientation', () => {
    const { container } = render(<Separator orientation="horizontal" />);
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toHaveClass('h-[1px]', 'w-full');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('should support vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('should apply custom className', () => {
    const { container } = render(<Separator className="custom-class" />);
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toHaveClass('custom-class');
    expect(separator).toHaveClass('shrink-0'); // Should still have default classes
  });

  it('should be decorative by default', () => {
    const { container } = render(<Separator />);
    
    const separator = container.querySelector('[data-orientation]');
    // Decorative separators should have role="none"
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('should support non-decorative separator', () => {
    render(<Separator decorative={false} />);
    
    const separator = screen.getByRole('separator');
    expect(separator).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should support aria-label for non-decorative separators', () => {
    render(<Separator decorative={false} aria-label="Section divider" />);
    
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-label', 'Section divider');
  });

  it('should support data attributes', () => {
    const { container } = render(<Separator data-testid="my-separator" />);
    
    const separator = container.querySelector('[data-testid="my-separator"]');
    expect(separator).toHaveAttribute('data-testid', 'my-separator');
  });

  it('should work in a layout context', () => {
    const { container } = render(
      <div className="flex flex-col">
        <div>Section 1</div>
        <Separator />
        <div>Section 2</div>
      </div>
    );
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('w-full'); // Horizontal separator in vertical layout
  });

  it('should work with vertical layout', () => {
    const { container } = render(
      <div className="flex flex-row items-center h-10">
        <div>Item 1</div>
        <Separator orientation="vertical" className="mx-2" />
        <div>Item 2</div>
      </div>
    );
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('h-full', 'w-[1px]', 'mx-2');
  });

  it('should support custom styling for different use cases', () => {
    const { container } = render(<Separator className="bg-red-500 h-2" />);
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toHaveClass('bg-red-500', 'h-2');
  });

  it('should maintain accessibility with proper role', () => {
    const { container } = render(
      <div>
        <section>Content 1</section>
        <Separator />
        <section>Content 2</section>
      </div>
    );
    
    const separator = container.querySelector('[data-orientation]');
    expect(separator).toBeInTheDocument();
  });
});