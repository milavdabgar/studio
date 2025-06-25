import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../ContactForm';
import '@testing-library/jest-dom';

describe('ContactForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  const renderForm = () => {
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    return {
      nameInput,
      emailInput,
      messageInput,
      submitButton,
    };
  };

  it('renders all form fields', () => {
    const { nameInput, emailInput, messageInput, submitButton } = renderForm();
    
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(messageInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const { submitButton } = renderForm();
    
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/message is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const { emailInput, submitButton } = renderForm();
    
    userEvent.type(emailInput, 'invalid-email');
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    const { nameInput, emailInput, messageInput, submitButton } = renderForm();
    
    const formData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    };
    
    await userEvent.type(nameInput, formData.name);
    await userEvent.type(emailInput, formData.email);
    await userEvent.type(messageInput, formData.message);
    
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith(formData, expect.any(Function));
  });

  it('shows loading state when submitting', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    const { submitButton } = renderForm();
    
    fireEvent.click(submitButton);
    
    expect(await screen.findByRole('button', { name: /submitting.../i })).toBeDisabled();
  });

  it('shows success message after successful submission', async () => {
    mockOnSubmit.mockResolvedValueOnce({ success: true });
    
    const { nameInput, emailInput, messageInput, submitButton } = renderForm();
    
    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(emailInput, 'john@example.com');
    await userEvent.type(messageInput, 'Test message');
    
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/thank you for your message/i)).toBeInTheDocument();
  });
});
