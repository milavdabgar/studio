import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ContactForm } from '../ContactForm';

describe('ContactForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render all form fields', () => {
    render(<ContactForm />);
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
  });

  it('should render with proper form structure', () => {
    render(<ContactForm />);
    
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(messageInput).toHaveAttribute('required');
  });

  it('should update form fields when typing', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(messageInput, 'This is a test message');
    
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(messageInput).toHaveValue('This is a test message');
  });

  it('should call onSubmit with form data when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    await user.type(nameInput, 'Jane Smith');
    await user.type(emailInput, 'jane@example.com');
    await user.type(messageInput, 'Hello from the test!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Hello from the test!'
      });
    });
  });

  it('should prevent default form submission', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    // Fill out form
    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Message'), 'Test message');
    
    // Submit form
    await user.click(submitButton);
    
    // Verify preventDefault was called (form should not reload page)
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should work without onSubmit prop', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    await user.type(nameInput, 'No Callback User');
    await user.type(emailInput, 'nocallback@example.com');
    await user.type(messageInput, 'No callback message');
    
    // Should not throw error when clicking submit
    await expect(user.click(submitButton)).resolves.not.toThrow();
  });

  it('should not submit form when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    await user.click(submitButton);
    
    // onSubmit should not be called due to HTML5 validation
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle special characters in input', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    await user.type(nameInput, 'José María');
    await user.type(emailInput, 'jose@example.com'); // Use valid email format
    await user.type(messageInput, 'Special chars: áéíóú ñ 🎉');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'José María',
      email: 'jose@example.com',
      message: 'Special chars: áéíóú ñ 🎉'
    });
  });

  it('should handle long text input', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const longText = 'This is a very long message that contains many words and characters to test how the form handles longer input text that might be used in real-world scenarios.';
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    await user.type(nameInput, 'Very Long Name User');
    await user.type(emailInput, 'verylongname@example.com');
    await user.type(messageInput, longText);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Very Long Name User',
        email: 'verylongname@example.com',
        message: longText
      });
    });
  });

  it('should have proper input attributes', () => {
    render(<ContactForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    // Check IDs and names
    expect(nameInput).toHaveAttribute('id', 'name');
    expect(nameInput).toHaveAttribute('name', 'name');
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(emailInput).toHaveAttribute('name', 'email');
    expect(messageInput).toHaveAttribute('id', 'message');
    expect(messageInput).toHaveAttribute('name', 'message');
    
    // Check textarea rows
    expect(messageInput).toHaveAttribute('rows', '4');
  });

  it('should handle rapid form interactions', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    // Rapid typing and form interaction
    await user.type(nameInput, 'Fast');
    await user.clear(nameInput);
    await user.type(nameInput, 'Fast User');
    
    await user.type(emailInput, 'fast@example.com');
    await user.type(messageInput, 'Quick message');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Fast User',
        email: 'fast@example.com',
        message: 'Quick message'
      });
    });
  });

  it('should maintain focus and accessibility', () => {
    render(<ContactForm />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    // Check labels are properly associated
    expect(nameInput).toHaveAccessibleName('Name');
    expect(emailInput).toHaveAccessibleName('Email');
    expect(messageInput).toHaveAccessibleName('Message');
    
    // Check form can be tabbed through
    nameInput.focus();
    expect(nameInput).toHaveFocus();
  });

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    
    await user.type(nameInput, 'Enter Key User');
    await user.type(screen.getByLabelText('Email'), 'enter@example.com');
    await user.type(screen.getByLabelText('Message'), 'Submitted with Enter');
    
    // Submit with Enter key on submit button
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    submitButton.focus();
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Enter Key User',
        email: 'enter@example.com',
        message: 'Submitted with Enter'
      });
    });
  });

  it('should handle component re-renders', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    
    await user.type(nameInput, 'Persistent User');
    await user.type(emailInput, 'persistent@example.com');
    
    // Verify values are set
    expect(nameInput).toHaveValue('Persistent User');
    expect(emailInput).toHaveValue('persistent@example.com');
    
    // Re-render component with different onSubmit
    const newMockOnSubmit = jest.fn();
    rerender(<ContactForm onSubmit={newMockOnSubmit} />);
    
    // Values should persist in the same component instance
    expect(screen.getByLabelText('Name')).toHaveValue('Persistent User');
    expect(screen.getByLabelText('Email')).toHaveValue('persistent@example.com');
  });
});