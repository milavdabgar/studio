import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './switch';

describe('Switch Component', () => {
  it('should render switch', () => {
    render(<Switch />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('should be unchecked by default', () => {
    render(<Switch />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });

  it('should be checked when checked prop is true', () => {
    render(<Switch checked={true} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    render(<Switch onCheckedChange={onCheckedChange} />);
    
    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should handle keyboard events', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    render(<Switch onCheckedChange={onCheckedChange} />);
    
    const switchElement = screen.getByRole('switch');
    
    // Use tab to focus and then space
    await user.tab();
    await user.keyboard(' ');
    
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
  });

  it('should not respond to clicks when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    render(<Switch disabled onCheckedChange={onCheckedChange} />);
    
    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Switch className="custom-class" />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('custom-class');
  });

  it('should apply default classes', () => {
    render(<Switch />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass(
      'peer',
      'inline-flex',
      'h-6',
      'w-11',
      'shrink-0',
      'cursor-pointer',
      'items-center',
      'rounded-full',
      'border-2',
      'border-transparent',
      'transition-colors'
    );
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should support controlled mode', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    const { rerender } = render(
      <Switch checked={false} onCheckedChange={onCheckedChange} />
    );
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
    
    await user.click(switchElement);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    
    // Simulate parent component updating the checked state
    rerender(<Switch checked={true} onCheckedChange={onCheckedChange} />);
    expect(switchElement).toBeChecked();
  });

  it('should support uncontrolled mode', async () => {
    const user = userEvent.setup();
    
    render(<Switch defaultChecked={false} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
    
    await user.click(switchElement);
    expect(switchElement).toBeChecked();
    
    await user.click(switchElement);
    expect(switchElement).not.toBeChecked();
  });

  it('should have proper aria attributes', () => {
    render(<Switch aria-label="Enable notifications" />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-label', 'Enable notifications');
  });

  it('should support required attribute', () => {
    render(<Switch required />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-required', 'true');
  });

  it('should have focus styles', () => {
    render(<Switch />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'focus-visible:ring-offset-background'
    );
  });

  it('should show checked state styling', () => {
    render(<Switch checked={true} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('data-[state=checked]:bg-primary');
  });

  it('should show unchecked state styling', () => {
    render(<Switch checked={false} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('data-[state=unchecked]:bg-input');
  });

  it('should contain thumb element', () => {
    const { container } = render(<Switch />);
    
    const thumb = container.querySelector('[data-state]')?.querySelector('span');
    expect(thumb).toBeInTheDocument();
    expect(thumb).toHaveClass(
      'pointer-events-none',
      'block',
      'h-5',
      'w-5',
      'rounded-full',
      'bg-background',
      'shadow-lg',
      'ring-0',
      'transition-transform'
    );
  });

  it('should support data attributes', () => {
    render(<Switch data-testid="toggle-switch" />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('data-testid', 'toggle-switch');
  });

  it('should work with form integration', () => {
    const { container } = render(
      <form>
        <Switch name="notifications" />
      </form>
    );
    
    // Just verify the component renders in a form context
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(container.querySelector('form')).toBeInTheDocument();
  });
});