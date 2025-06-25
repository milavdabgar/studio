import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Label } from './label';

describe('Label Component', () => {
  it('should render label text', () => {
    render(<Label>Username</Label>);
    
    const label = screen.getByText('Username');
    expect(label).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<Label>Test Label</Label>);
    
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none', 'peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('should apply custom className', () => {
    render(<Label className="custom-class">Test Label</Label>);
    
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('custom-class');
    expect(label).toHaveClass('text-sm'); // Should still have default classes
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Test Label</Label>);
    
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('should associate with form control using htmlFor', () => {
    render(
      <div>
        <Label htmlFor="username">Username</Label>
        <input id="username" type="text" />
      </div>
    );
    
    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'username');
    expect(input).toHaveAttribute('id', 'username');
  });

  it('should work with click to focus associated input', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" />
      </div>
    );
    
    const label = screen.getByText('Email');
    const input = screen.getByRole('textbox');
    
    await user.click(label);
    expect(input).toHaveFocus();
  });

  it('should support aria attributes', () => {
    render(<Label aria-label="Required field">Password *</Label>);
    
    const label = screen.getByText('Password *');
    expect(label).toHaveAttribute('aria-label', 'Required field');
  });

  it('should support data attributes', () => {
    render(<Label data-testid="form-label">Test Label</Label>);
    
    const label = screen.getByText('Test Label');
    expect(label).toHaveAttribute('data-testid', 'form-label');
  });

  it('should render as label element by default', () => {
    render(<Label>Test Label</Label>);
    
    const label = screen.getByText('Test Label');
    expect(label.tagName).toBe('LABEL');
  });

  it('should support complex content', () => {
    render(
      <Label>
        Email Address <span className="text-red-500">*</span>
      </Label>
    );
    
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should work with nested form structure', () => {
    render(
      <form>
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea id="description" rows={3} />
        </div>
      </form>
    );
    
    const label = screen.getByText('Description');
    const textarea = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'description');
    expect(textarea).toHaveAttribute('id', 'description');
  });

  it('should handle disabled peer state styling', () => {
    render(
      <div>
        <Label htmlFor="disabled-input">Disabled Field</Label>
        <input id="disabled-input" type="text" disabled className="peer" />
      </div>
    );
    
    const label = screen.getByText('Disabled Field');
    // The peer-disabled classes should be present for CSS to apply when peer is disabled
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('should support onClick handler', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Label onClick={handleClick}>Clickable Label</Label>);
    
    const label = screen.getByText('Clickable Label');
    await user.click(label);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});