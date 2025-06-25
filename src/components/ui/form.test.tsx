import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './form';

// Mock component to test form functionality
const TestFormComponent = ({ onSubmit = jest.fn() }: { onSubmit?: jest.fn }) => {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          rules={{ required: 'Username is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <input {...field} placeholder="Enter username" />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          rules={{ 
            required: 'Email is required'
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input {...field} type="email" placeholder="Enter email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
};

// Component to test useFormField hook
const TestFormFieldComponent = () => {
  const form = useForm({
    defaultValues: { test: '' }
  });

  const FormFieldTest = () => {
    const fieldData = useFormField();
    return (
      <div data-testid="form-field-data">
        <span data-testid="field-name">{fieldData.name}</span>
        <span data-testid="field-id">{fieldData.id}</span>
        <span data-testid="form-item-id">{fieldData.formItemId}</span>
        <span data-testid="form-description-id">{fieldData.formDescriptionId}</span>
        <span data-testid="form-message-id">{fieldData.formMessageId}</span>
      </div>
    );
  };

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="test"
        render={() => (
          <FormItem>
            <FormFieldTest />
          </FormItem>
        )}
      />
    </Form>
  );
};

describe('Form Components', () => {
  describe('Form', () => {
    it('should render form with all components', () => {
      render(<TestFormComponent />);
      
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
      expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      render(<TestFormComponent onSubmit={onSubmit} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter username');
      const emailInput = screen.getByPlaceholderText('Enter email');
      const submitButton = screen.getByText('Submit');
      
      await user.type(usernameInput, 'testuser');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com'
        }, expect.any(Object));
      });
    });

    it('should display validation errors', async () => {
      const user = userEvent.setup();
      
      render(<TestFormComponent />);
      
      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });
  });

  describe('FormItem', () => {
    it('should render with default classes', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem data-testid="form-item">
                  <input />
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const formItem = screen.getByTestId('form-item');
      expect(formItem).toHaveClass('space-y-2');
    });

    it('should apply custom className', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem className="custom-form-item" data-testid="form-item">
                  <input />
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const formItem = screen.getByTestId('form-item');
      expect(formItem).toHaveClass('custom-form-item');
    });
  });

  describe('FormLabel', () => {
    it('should render with proper attributes', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormLabel>Test Label</FormLabel>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for');
    });

    it('should apply custom className', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormLabel className="custom-label">Test Label</FormLabel>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('custom-label');
    });
  });

  describe('FormControl', () => {
    it('should render with proper ARIA attributes', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input {...field} data-testid="form-input" />
                  </FormControl>
                  <FormDescription>Helper text</FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByTestId('form-input');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('id');
    });
  });

  describe('FormDescription', () => {
    it('should render with default classes', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormDescription data-testid="form-description">
                    Helper text
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const description = screen.getByTestId('form-description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
      expect(description).toHaveTextContent('Helper text');
      expect(description).toHaveAttribute('id');
    });

    it('should apply custom className', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormDescription className="custom-description" data-testid="form-description">
                    Helper text
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const description = screen.getByTestId('form-description');
      expect(description).toHaveClass('custom-description');
    });
  });

  describe('FormMessage', () => {
    it('should render error message', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => {})}>
              <FormField
                control={form.control}
                name="test"
                rules={{ required: 'This field is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <button type="submit">Submit</button>
            </form>
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      await user.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        const message = screen.getByText('This field is required');
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass('text-sm', 'font-medium', 'text-destructive');
        expect(message).toHaveAttribute('id');
      });
    });

    it('should render custom message', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage>Custom message</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const message = screen.getByText('Custom message');
      expect(message).toBeInTheDocument();
    });

    it('should not render when no error or message', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage data-testid="form-message" />
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      expect(screen.queryByTestId('form-message')).not.toBeInTheDocument();
    });
  });

  describe('useFormField', () => {
    it('should provide form field context data', () => {
      render(<TestFormFieldComponent />);
      
      expect(screen.getByTestId('field-name')).toHaveTextContent('test');
      expect(screen.getByTestId('field-id')).toHaveTextContent(/^:/);
      expect(screen.getByTestId('form-item-id')).toHaveTextContent(/-form-item$/);
      expect(screen.getByTestId('form-description-id')).toHaveTextContent(/-form-item-description$/);
      expect(screen.getByTestId('form-message-id')).toHaveTextContent(/-form-item-message$/);
    });

    it('should throw error when used outside FormField', () => {
      const TestComponent = () => {
        useFormField();
        return <div>Test</div>;
      };
      
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('FormField', () => {
    it('should provide field context to children', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: 'initial' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input {...field} data-testid="form-input" />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByTestId('form-input');
      expect(input).toHaveValue('initial');
    });

    it('should handle field value changes', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input {...field} data-testid="form-input" />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByTestId('form-input');
      await user.type(input, 'new value');
      
      expect(input).toHaveValue('new value');
    });
  });

  describe('Complete Form Example', () => {
    it('should work as a complete form with validation', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      render(<TestFormComponent onSubmit={onSubmit} />);
      
      // Test validation
      await user.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      
      // Fill form and submit successfully
      await user.type(screen.getByPlaceholderText('Enter username'), 'john');
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com');
      await user.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          username: 'john',
          email: 'john@example.com'
        }, expect.any(Object));
      });
    });
  });
});