import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './checkbox';

describe('Checkbox Component', () => {
  it('should render checkbox', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should be unchecked by default', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should be checked when checked prop is true', () => {
    render(<Checkbox checked={true} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should be unchecked when checked prop is false', () => {
    render(<Checkbox checked={false} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    render(<Checkbox onCheckedChange={onCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should handle keyboard interaction', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    render(<Checkbox onCheckedChange={onCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    
    // Use user.type with space to simulate pressing space key on focused element
    await user.type(checkbox, ' ');
    
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should not respond to clicks when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    render(<Checkbox disabled onCheckedChange={onCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Checkbox className="custom-class" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should handle indeterminate state', () => {
    render(<Checkbox checked="indeterminate" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
  });

  it('should show check icon when checked', () => {
    render(<Checkbox checked={true} />);
    
    // The Check icon should be present when checked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    
    // Check if indicator element exists within the checkbox
    const indicator = checkbox.querySelector('span'); // CheckboxPrimitive.Indicator renders as span
    expect(indicator).toBeInTheDocument();
  });

  it('should show minus icon when indeterminate', () => {
    render(<Checkbox checked="indeterminate" />);
    
    // The checkbox should have indeterminate state
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    
    // Check if indicator element exists within the checkbox
    const indicator = checkbox.querySelector('span'); // CheckboxPrimitive.Indicator renders as span
    expect(indicator).toBeInTheDocument();
  });

  it('should have proper aria attributes', () => {
    render(<Checkbox aria-label="Accept terms" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Accept terms');
  });

  it('should support controlled mode', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    
    const { rerender } = render(
      <Checkbox checked={false} onCheckedChange={onCheckedChange} />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    
    await user.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    
    // Simulate parent component updating the checked state
    rerender(<Checkbox checked={true} onCheckedChange={onCheckedChange} />);
    expect(checkbox).toBeChecked();
  });

  it('should support uncontrolled mode', async () => {
    const user = userEvent.setup();
    
    render(<Checkbox defaultChecked={false} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('should have focus styles', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    
    expect(checkbox).toHaveFocus();
  });

  it('should support required attribute', () => {
    render(<Checkbox required />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
  });
});