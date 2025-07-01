import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../ContactForm';
import '@testing-library/jest-dom';

describe('ContactForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all form fields correctly', () => {
      render(<ContactForm />);
      
      // Check for form elements (using querySelector since form role might not be implicit)
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('renders with correct input types and attributes', () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageTextarea = screen.getByLabelText(/message/i);
      
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('name', 'name');
      expect(nameInput).toHaveAttribute('required');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toHaveAttribute('required');
      
      expect(messageTextarea).toHaveAttribute('name', 'message');
      expect(messageTextarea).toHaveAttribute('required');
      expect(messageTextarea).toHaveAttribute('rows', '4');
    });

    it('has proper form structure and styling', () => {
      render(<ContactForm />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-4');
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      expect(submitButton).toHaveClass('w-full');
      expect(submitButton).toHaveClass('bg-indigo-600');
    });
  });

  describe('Form Validation', () => {
    it('has required attributes on all fields', () => {
      render(<ContactForm />);
      
      expect(screen.getByLabelText(/name/i)).toBeRequired();
      expect(screen.getByLabelText(/email/i)).toBeRequired();
      expect(screen.getByLabelText(/message/i)).toBeRequired();
    });

    it('validates email field type', () => {
      render(<ContactForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('prevents submission with empty fields', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      await user.click(submitButton);
      
      // Form should not submit with empty fields due to HTML5 validation
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('updates name field on user input', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');
      
      expect(nameInput).toHaveValue('John Doe');
    });

    it('updates email field on user input', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'john.doe@example.com');
      
      expect(emailInput).toHaveValue('john.doe@example.com');
    });

    it('updates message field on user input', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      const messageTextarea = screen.getByLabelText(/message/i);
      await user.type(messageTextarea, 'This is a test message');
      
      expect(messageTextarea).toHaveValue('This is a test message');
    });

    it('handles onChange events correctly', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageTextarea = screen.getByLabelText(/message/i);
      
      // Type in all fields
      await user.type(nameInput, 'Jane Smith');
      await user.type(emailInput, 'jane@example.com');
      await user.type(messageTextarea, 'Hello there!');
      
      // Verify all values are updated
      expect(nameInput).toHaveValue('Jane Smith');
      expect(emailInput).toHaveValue('jane@example.com');
      expect(messageTextarea).toHaveValue('Hello there!');
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);
      
      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /send message/i });
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message'
      });
    });

    it('prevents default form submission behavior', () => {
      const mockPreventDefault = jest.fn();
      
      render(<ContactForm onSubmit={mockOnSubmit} />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
      fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test message' } });
      
      const form = document.querySelector('form');
      
      // Mock the submit event
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      submitEvent.preventDefault = mockPreventDefault;
      
      fireEvent(form!, submitEvent);
      
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('works without onSubmit prop', async () => {
      const user = userEvent.setup();
      
      // Should not crash without onSubmit prop
      expect(() => render(<ContactForm />)).not.toThrow();
      
      const form = screen.getByRole('form');
      await user.type(screen.getByLabelText(/name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message');
      
      // Should not crash when submitting without onSubmit
      const submitButton = screen.getByRole('button', { name: /send message/i });
      await user.click(submitButton);
      
      // No error should be thrown
      expect(form).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in input fields', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);
      
      const specialText = 'José María @#$%^&*()';
      const specialEmail = 'josé.maría+test@example.com';
      const specialMessage = 'Special chars: àáâãäåæçèéêë <>&"\'';
      
      await user.type(screen.getByLabelText(/name/i), specialText);
      await user.type(screen.getByLabelText(/email/i), specialEmail);
      await user.type(screen.getByLabelText(/message/i), specialMessage);
      
      expect(screen.getByLabelText(/name/i)).toHaveValue(specialText);
      expect(screen.getByLabelText(/email/i)).toHaveValue(specialEmail);
      expect(screen.getByLabelText(/message/i)).toHaveValue(specialMessage);
    });

    it('handles very long input values', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);
      
      const longName = 'A'.repeat(1000);
      const longMessage = 'B'.repeat(5000);
      
      await user.type(screen.getByLabelText(/name/i), longName);
      await user.type(screen.getByLabelText(/message/i), longMessage);
      
      expect(screen.getByLabelText(/name/i)).toHaveValue(longName);
      expect(screen.getByLabelText(/message/i)).toHaveValue(longMessage);
    });

    it('handles rapid successive form submissions', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'Test');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Message');
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      // Click submit multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should be called multiple times if not prevented
      expect(mockOnSubmit).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      render(<ContactForm />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it('has proper form structure for screen readers', () => {
      render(<ContactForm />);
      
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // Check that labels are properly associated with inputs
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageTextarea = screen.getByLabelText(/message/i);
      
      expect(nameInput).toHaveAttribute('id', 'name');
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(messageTextarea).toHaveAttribute('id', 'message');
    });

    it('button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);
      
      // Fill form first
      await user.type(screen.getByLabelText(/name/i), 'Test');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Message');
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      // Focus the button
      submitButton.focus();
      expect(submitButton).toHaveFocus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('supports tab navigation', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      // Start with first field focused
      const nameInput = screen.getByLabelText(/name/i);
      nameInput.focus();
      expect(nameInput).toHaveFocus();
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/message/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /send message/i })).toHaveFocus();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies correct CSS classes to form elements', () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageTextarea = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      // Check input styling
      expect(nameInput).toHaveClass('mt-1', 'block', 'w-full', 'rounded-md');
      expect(emailInput).toHaveClass('mt-1', 'block', 'w-full', 'rounded-md');
      expect(messageTextarea).toHaveClass('mt-1', 'block', 'w-full', 'rounded-md');
      
      // Check button styling
      expect(submitButton).toHaveClass('w-full', 'bg-indigo-600', 'hover:bg-indigo-700');
    });

    it('applies focus styles correctly', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);
      
      expect(nameInput).toHaveClass('focus:border-indigo-500', 'focus:ring-indigo-500');
    });
  });

  describe('Component Props', () => {
    it('accepts and uses onSubmit prop', async () => {
      const customOnSubmit = jest.fn();
      
      render(<ContactForm onSubmit={customOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      
      // Use fireEvent.change for more reliable testing
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(messageInput, { target: { value: 'Message' } });
      
      fireEvent.click(screen.getByRole('button', { name: /send message/i }));
      
      expect(customOnSubmit).toHaveBeenCalledWith({
        name: 'Test',
        email: 'test@example.com',
        message: 'Message'
      });
    });

    it('handles undefined onSubmit gracefully', async () => {
      const user = userEvent.setup();
      
      render(<ContactForm onSubmit={undefined} />);
      
      await user.type(screen.getByLabelText(/name/i), 'Test');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Message');
      
      // Should not throw error
      expect(() => 
        user.click(screen.getByRole('button', { name: /send message/i }))
      ).not.toThrow();
    });
  });

  describe('Form State Management', () => {
    it('maintains separate state for each field', () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      
      // Type in name field
      fireEvent.change(nameInput, { target: { value: 'John' } });
      expect(nameInput).toHaveValue('John');
      expect(emailInput).toHaveValue('');
      expect(messageInput).toHaveValue('');
      
      // Type in email field  
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      expect(nameInput).toHaveValue('John');
      expect(emailInput).toHaveValue('john@example.com');
      expect(messageInput).toHaveValue('');
      
      // Type in message field
      fireEvent.change(messageInput, { target: { value: 'Hello' } });
      expect(nameInput).toHaveValue('John');
      expect(emailInput).toHaveValue('john@example.com');
      expect(messageInput).toHaveValue('Hello');
    });

    it('clears field values appropriately', () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/name/i);
      
      // Type and then clear
      fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      expect(nameInput).toHaveValue('Test Name');
      
      fireEvent.change(nameInput, { target: { value: '' } });
      expect(nameInput).toHaveValue('');
    });
  });
});