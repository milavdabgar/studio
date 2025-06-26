import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation', () => {
  const initialValues = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const validate = (values: typeof initialValues) => {
    const errors: Partial<Record<keyof typeof initialValues, string>> = {};
    
    if (!values.username.trim()) {
      errors.username = 'Username is required';
    } else if (values.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  it('initializes with default values', () => {
    const { result } = renderHook(() => 
      useFormValidation({ initialValues, validate })
    );
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.touched).toEqual({});
  });

  it('validates on change', () => {
    const { result } = renderHook(() => 
      useFormValidation({ initialValues, validate, validateOnChange: true })
    );
    
    // Test username validation
    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'ab', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.values.username).toBe('ab');
    expect(result.current.errors.username).toBe('Username must be at least 3 characters');
    expect(result.current.isValid).toBe(false);
    
    // Fix the username
    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'validuser', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.errors.username).toBeUndefined();
  });

  it('validates on blur', () => {
    const { result } = renderHook(() => 
      useFormValidation({ initialValues, validate, validateOnBlur: true })
    );
    
    act(() => {
      result.current.handleBlur({
        target: { name: 'email' },
      } as React.FocusEvent<HTMLInputElement>);
    });
    
    expect(result.current.touched.email).toBe(true);
    expect(result.current.errors.email).toBe('Email is required');
  });

  it('validates on submit', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() => 
      useFormValidation({ 
        initialValues, 
        validate,
        onSubmit,
      })
    );
    
    // Try to submit with empty form
    await act(async () => {
      result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({
      username: 'Username is required',
      email: 'Email is required',
      password: 'Password is required',
    });
    
    // Fill in valid values
    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'testuser', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'password', value: 'password123', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'password123', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Submit again
    await act(async () => {
      result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });
    
    expect(onSubmit).toHaveBeenCalledWith(
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
      expect.any(Function)
    );
  });

  it('handles async validation', async () => {
    const asyncValidate = jest.fn().mockResolvedValue({
      username: 'Username is already taken',
    });
    
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validate,
        asyncValidate,
      })
    );
    
    // Fill in form
    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'existinguser', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'password', value: 'password123', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'password123', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });
    
    expect(asyncValidate).toHaveBeenCalledWith({
      username: 'existinguser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    
    expect(result.current.errors.username).toBe('Username is already taken');
  });

  it('resets the form', () => {
    const { result } = renderHook(() =>
      useFormValidation({ initialValues, validate })
    );
    
    // Make some changes
    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'test', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleBlur({
        target: { name: 'username' },
      } as React.FocusEvent<HTMLInputElement>);
    });
    
    // Reset the form
    act(() => {
      result.current.resetForm();
    });
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('sets field value programmatically', () => {
    const { result } = renderHook(() =>
      useFormValidation({ initialValues, validate })
    );
    
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
    });
    
    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.errors.email).toBeUndefined();
    
    // Should validate the field after setting
    act(() => {
      result.current.setFieldTouched('email', true);
    });
    
    expect(result.current.errors.email).toBeUndefined();
  });
});
