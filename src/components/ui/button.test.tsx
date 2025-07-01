import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from './button';
import { describe, it, expect, jest } from '@jest/globals';

describe('Button', () => {
  describe('basic rendering', () => {
    it('should render a button element by default', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render button text correctly', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should be enabled by default', () => {
      render(<Button>Enabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeEnabled();
    });
  });

  describe('variants', () => {
    it('should apply default variant classes', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('text-primary-foreground');
    });

    it('should apply destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
      expect(button.className).toContain('text-destructive-foreground');
    });

    it('should apply outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
      expect(button.className).toContain('border-input');
      expect(button.className).toContain('bg-background');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-secondary');
      expect(button.className).toContain('text-secondary-foreground');
    });

    it('should apply ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-accent');
      expect(button.className).toContain('hover:text-accent-foreground');
    });

    it('should apply link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-primary');
      expect(button.className).toContain('underline-offset-4');
      expect(button.className).toContain('hover:underline');
    });
  });

  describe('sizes', () => {
    it('should apply default size classes', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('px-4');
      expect(button.className).toContain('py-2');
    });

    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-9');
      expect(button.className).toContain('px-3');
    });

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-11');
      expect(button.className).toContain('px-8');
    });

    it('should apply extra small size', () => {
      render(<Button size="xs">Extra Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('px-2');
      expect(button.className).toContain('text-xs');
    });

    it('should apply icon size', () => {
      render(<Button size="icon">📱</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('w-10');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled classes', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:pointer-events-none');
      expect(button.className).toContain('disabled:opacity-50');
    });

    it('should not trigger onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should support onMouseEnter and onMouseLeave', () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      render(
        <Button onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Hover me
        </Button>
      );
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      
      fireEvent.mouseLeave(button);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('asChild prop', () => {
    it('should render as a Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toBe('/link');
      expect(link.textContent).toBe('Link Button');
    });

    it('should apply button classes to child element when asChild is true', () => {
      render(
        <Button asChild variant="destructive" size="lg">
          <a href="/link">Destructive Link</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link.className).toContain('bg-destructive');
      expect(link.className).toContain('h-11');
      expect(link.className).toContain('px-8');
    });
  });

  describe('custom styling', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('should merge custom className with variant classes', () => {
      render(<Button className="custom-class" variant="outline">Custom Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
      expect(button.className).toContain('border-input');
    });

    it('should accept custom styles', () => {
      render(<Button style={{ backgroundColor: 'red' }}>Styled</Button>);
      const button = screen.getByRole('button');
      expect(button.style.backgroundColor).toBe('red');
    });
  });

  describe('HTML attributes', () => {
    it('should accept type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button.getAttribute('type')).toBe('submit');
    });

    it('should accept id attribute', () => {
      render(<Button id="test-button">Test</Button>);
      const button = screen.getByRole('button');
      expect(button.id).toBe('test-button');
    });

    it('should accept data attributes', () => {
      render(<Button data-testid="custom-test-id">Test</Button>);
      const button = screen.getByTestId('custom-test-id');
      expect(button).toBeInTheDocument();
    });

    it('should accept aria attributes', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByLabelText('Close dialog');
      expect(button).toBeInTheDocument();
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Ref Button');
    });

    it('should forward ref when using asChild', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      render(
        <Button asChild>
          <a href="/test" ref={ref}>Link with ref</a>
        </Button>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      expect(ref.current?.href).toContain('/test');
    });
  });

  describe('combination of props', () => {
    it('should handle multiple variant and size combinations', () => {
      const combinations = [
        { variant: 'default' as const, size: 'sm' as const },
        { variant: 'destructive' as const, size: 'lg' as const },
        { variant: 'outline' as const, size: 'icon' as const },
        { variant: 'secondary' as const, size: 'xs' as const },
        { variant: 'ghost' as const, size: 'default' as const },
        { variant: 'link' as const, size: 'sm' as const },
      ];

      combinations.forEach(({ variant, size }, index) => {
        const { unmount } = render(
          <Button variant={variant} size={size}>
            Button {index}
          </Button>
        );
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('display name', () => {
    it('should have correct display name', () => {
      expect(Button.displayName).toBe('Button');
    });
  });
});

describe('buttonVariants', () => {
  describe('variant styles', () => {
    it('should generate correct classes for default variant', () => {
      const classes = buttonVariants({ variant: 'default' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
      expect(classes).toContain('hover:bg-primary/90');
    });

    it('should generate correct classes for all variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
      
      variants.forEach(variant => {
        const classes = buttonVariants({ variant });
        expect(typeof classes).toBe('string');
        expect(classes.length).toBeGreaterThan(0);
      });
    });

    it('should generate correct classes for all sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'xs', 'icon'] as const;
      
      sizes.forEach(size => {
        const classes = buttonVariants({ size });
        expect(typeof classes).toBe('string');
        expect(classes.length).toBeGreaterThan(0);
      });
    });

    it('should include base classes', () => {
      const classes = buttonVariants();
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('rounded-md');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('font-medium');
    });

    it('should handle custom className', () => {
      const classes = buttonVariants({ className: 'custom-button-class' });
      expect(classes).toContain('custom-button-class');
    });
  });
});