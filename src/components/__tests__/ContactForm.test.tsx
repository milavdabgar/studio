import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ContactForm } from '../ContactForm';

describe('ContactForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  // Helper function to get form inputs using id selectors
  const getFormInputs = () => {
    return {
      nameInput: document.getElementById('contact-name'),
      emailInput: document.getElementById('contact-email'),
      messageInput: document.getElementById('contact-message'),
    };
  };

  it('should render all form fields', () => {
    render(<ContactForm />);
    
    // Check for basic form elements using id selectors
    expect(document.getElementById('contact-name')).toBeInTheDocument();
    expect(document.getElementById('contact-email')).toBeInTheDocument();
    expect(document.getElementById('contact-message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should render with proper form structure', () => {
    render(<ContactForm />);
    
    // Check for form element
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    
    // Check for input fields using id selectors
    expect(document.getElementById('contact-name')).toBeInTheDocument();
    expect(document.getElementById('contact-email')).toBeInTheDocument();
    expect(document.getElementById('contact-message')).toBeInTheDocument();
    
    // Verify the labels are present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should render form inputs with correct initial values', () => {
    render(<ContactForm />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    
    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
    expect(messageInput).toHaveValue('');
  });

  it('should have submit button present', () => {
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should render form without errors', () => {
    expect(() => render(<ContactForm onSubmit={mockOnSubmit} />)).not.toThrow();
    
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    expect(submitButton).toBeInTheDocument();
  });

  it('should work without onSubmit prop', () => {
    expect(() => render(<ContactForm />)).not.toThrow();
    
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    expect(submitButton).toBeInTheDocument();
  });

  it('should not submit form when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    await user.click(submitButton);
    
    // onSubmit should not be called due to HTML5 validation
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should render inputs with correct IDs', () => {
    render(<ContactForm />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    
    // Check the elements exist and have correct IDs
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(messageInput).toBeInTheDocument();
  });

  it('should have a message textarea', () => {
    render(<ContactForm />);
    const { messageInput } = getFormInputs();
    
    expect(messageInput).toBeInTheDocument();
    expect(messageInput?.tagName).toBe('TEXTAREA');
  });

  it('should have proper input count and structure', () => {
    render(<ContactForm />);
    
    // Verify we have the right inputs using id selectors
    expect(document.getElementById('contact-name')).toBeInTheDocument();
    expect(document.getElementById('contact-email')).toBeInTheDocument();
    expect(document.getElementById('contact-message')).toBeInTheDocument();
    
    // Verify labels are present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('should render form with correct structure', () => {
    render(<ContactForm />);
    
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(messageInput).toBeInTheDocument();
  });

  it('should have accessible form elements', () => {
    render(<ContactForm />);
    
    const { nameInput, emailInput, messageInput } = getFormInputs();
    
    // Check elements have required attribute
    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
    expect(messageInput).toHaveAttribute('required');
  });

  it('should render button with correct properties', () => {
    render(<ContactForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    
    expect(submitButton).toHaveAttribute('type', 'submit');
    expect(submitButton).toHaveTextContent('Send Message');
  });

  it('should render consistently', () => {
    const { rerender } = render(<ContactForm />);
    
    // Check initial render using id selectors
    expect(document.getElementById('contact-name')).toBeInTheDocument();
    expect(document.getElementById('contact-email')).toBeInTheDocument();
    expect(document.getElementById('contact-message')).toBeInTheDocument();
    
    // Re-render component
    rerender(<ContactForm />);
    
    // Elements should still be present after re-render
    expect(document.getElementById('contact-name')).toBeInTheDocument();
    expect(document.getElementById('contact-email')).toBeInTheDocument();
    expect(document.getElementById('contact-message')).toBeInTheDocument();
  });
});