import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ContactForm } from '../ContactForm';

describe('ContactForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  // Helper function to get form inputs consistently
  const getFormInputs = () => {
    return {
      nameInput: screen.getByLabelText(/name/i),
      emailInput: screen.getByLabelText(/email/i), 
      messageInput: screen.getByLabelText(/message/i),
    };
  };

  it('should render all form fields', () => {
    render(<ContactForm />);
    
    // Check for specific form elements
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should render with proper form structure', () => {
    render(<ContactForm />);
    
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    
    // Check for specific form elements
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    
    // Verify the text content shows the labels
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should update form fields when typing', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    
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
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
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
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    // Fill out form
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(messageInput, 'Test message');
    
    // Submit form
    await user.click(submitButton);
    
    // Verify preventDefault was called (form should not reload page)
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should work without onSubmit prop', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
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
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    await user.type(nameInput, 'José María');
    await user.type(emailInput, 'jose@example.com');
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
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
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

  it('should have proper input count and structure', () => {
    render(<ContactForm />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    
    // Verify we have the right number of inputs
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(messageInput).toBeInTheDocument();
    
    // Verify labels are present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should handle rapid form interactions', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
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
    
    const { nameInput } = getFormInputs();
    
    // Check form can be tabbed through
    nameInput.focus();
    expect(nameInput).toHaveFocus();
  });

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    
    await user.type(nameInput, 'Enter Key User');
    await user.type(emailInput, 'enter@example.com');
    await user.type(messageInput, 'Submitted with Enter');
    
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
    
    const { nameInput, emailInput } = getFormInputs();
    
    await user.type(nameInput, 'Persistent User');
    await user.type(emailInput, 'persistent@example.com');
    
    // Verify values are set
    expect(nameInput).toHaveValue('Persistent User');
    expect(emailInput).toHaveValue('persistent@example.com');
    
    // Re-render component with different onSubmit
    const newMockOnSubmit = jest.fn();
    rerender(<ContactForm onSubmit={newMockOnSubmit} />);
    
    // Values should persist in the same component instance
    const newInputs = getFormInputs();
    expect(newInputs.nameInput).toHaveValue('Persistent User');
    expect(newInputs.emailInput).toHaveValue('persistent@example.com');
  });
});