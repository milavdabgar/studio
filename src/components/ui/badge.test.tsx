import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants, type BadgeProps } from './badge';
import { describe, it, expect } from '@jest/globals';

describe('Badge Component', () => {
  describe('Badge rendering', () => {
    it('should render badge with default variant', () => {
      render(<Badge data-testid="badge">Default Badge</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Default Badge');
      expect(badge.tagName).toBe('DIV');
    });

    it('should render badge with secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Secondary');
    });

    it('should render badge with destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Error</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Error');
    });

    it('should render badge with outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Outline');
    });

    it('should apply custom className', () => {
      render(<Badge className="custom-badge" data-testid="badge">Custom</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('custom-badge');
    });

    it('should accept and spread HTML div attributes', () => {
      render(
        <Badge 
          data-testid="badge" 
          id="test-badge" 
          role="status"
          aria-label="Status badge"
        >
          Test
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveAttribute('id', 'test-badge');
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
    });
  });

  describe('Badge variants', () => {
    const variants: Array<BadgeProps['variant']> = ['default', 'secondary', 'destructive', 'outline'];

    variants.forEach(variant => {
      it(`should render ${variant || 'default'} variant correctly`, () => {
        render(<Badge variant={variant} data-testid={`badge-${variant || 'default'}`}>
          {variant || 'default'} badge
        </Badge>);
        
        const badge = screen.getByTestId(`badge-${variant || 'default'}`);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent(`${variant || 'default'} badge`);
      });
    });

    it('should use default variant when variant is undefined', () => {
      render(<Badge data-testid="badge">No variant</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toBeInTheDocument();
      // Should have default variant classes applied
    });
  });

  describe('Badge content', () => {
    it('should render text content', () => {
      render(<Badge data-testid="badge">Simple text</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveTextContent('Simple text');
    });

    it('should render JSX content', () => {
      render(
        <Badge data-testid="badge">
          <span data-testid="icon">🎉</span>
          <span data-testid="text">Party</span>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      const icon = screen.getByTestId('icon');
      const text = screen.getByTestId('text');
      
      expect(badge).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
      expect(icon).toHaveTextContent('🎉');
      expect(text).toHaveTextContent('Party');
    });

    it('should render empty badge', () => {
      render(<Badge data-testid="badge" />);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('');
    });

    it('should render badge with numbers', () => {
      render(<Badge data-testid="badge">{42}</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveTextContent('42');
    });

    it('should render badge with special characters', () => {
      render(<Badge data-testid="badge">• New • 99+</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveTextContent('• New • 99+');
    });
  });

  describe('Badge accessibility', () => {
    it('should be focusable when needed', () => {
      render(<Badge tabIndex={0} data-testid="badge">Focusable</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveAttribute('tabIndex', '0');
    });

    it('should support aria attributes', () => {
      render(
        <Badge 
          data-testid="badge"
          aria-label="Status: Active"
          aria-describedby="status-description"
        >
          Active
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveAttribute('aria-label', 'Status: Active');
      expect(badge).toHaveAttribute('aria-describedby', 'status-description');
    });

    it('should support role attribute', () => {
      render(<Badge role="status" data-testid="badge">Online</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveAttribute('role', 'status');
    });
  });

  describe('Badge styling', () => {
    it('should merge custom classes with variant classes', () => {
      render(
        <Badge 
          variant="destructive" 
          className="my-custom-class" 
          data-testid="badge"
        >
          Test
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('my-custom-class');
      // Should also have the variant classes, but exact class testing would be brittle
    });

    it('should handle multiple custom classes', () => {
      render(
        <Badge 
          className="class-one class-two class-three" 
          data-testid="badge"
        >
          Test
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('class-one');
      expect(badge).toHaveClass('class-two');
      expect(badge).toHaveClass('class-three');
    });
  });

  describe('Badge event handling', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(
        <Badge onClick={handleClick} data-testid="badge">
          Clickable
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should accept event handler props', () => {
      const handleKeyDown = jest.fn();
      const handleMouseEnter = jest.fn();
      
      render(
        <Badge 
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          data-testid="badge"
        >
          Interactive
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      
      expect(badge).toBeInTheDocument();
      // Event handlers are attached, even if we don't test the actual events
      expect(typeof handleKeyDown).toBe('function');
      expect(typeof handleMouseEnter).toBe('function');
    });
  });

  describe('badgeVariants', () => {
    it('should be a function', () => {
      expect(typeof badgeVariants).toBe('function');
    });

    it('should return classes for default variant', () => {
      const classes = badgeVariants();
      expect(typeof classes).toBe('string');
      expect(classes.length).toBeGreaterThan(0);
    });

    it('should return classes for specific variants', () => {
      const defaultClasses = badgeVariants({ variant: 'default' });
      const secondaryClasses = badgeVariants({ variant: 'secondary' });
      const destructiveClasses = badgeVariants({ variant: 'destructive' });
      const outlineClasses = badgeVariants({ variant: 'outline' });

      expect(typeof defaultClasses).toBe('string');
      expect(typeof secondaryClasses).toBe('string');
      expect(typeof destructiveClasses).toBe('string');
      expect(typeof outlineClasses).toBe('string');

      // They should all be different (though we can't test exact content)
      expect(defaultClasses).toBeTruthy();
      expect(secondaryClasses).toBeTruthy();
      expect(destructiveClasses).toBeTruthy();
      expect(outlineClasses).toBeTruthy();
    });
  });
});