import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm', () => {
  const initialValues = {
    name: '',
    email: '',
  };

  const validate = (values: typeof initialValues) => {
    const errors: Partial<typeof initialValues> = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    return errors;
  };

  it('should initialize with initial values', () => {
    const { result } = renderHook(() => useForm({ initialValues, validate }));
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update field value on change', () => {
    const { result } = renderHook(() => useForm({ initialValues, validate }));
    
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.values.name).toBe('John Doe');
  });

  it('should validate on blur', () => {
    const { result } = renderHook(() => useForm({ initialValues, validate }));
    
    act(() => {
      result.current.handleBlur({
        target: { name: 'name' },
      } as React.FocusEvent<HTMLInputElement>);
    });
    
    expect(result.current.errors.name).toBe('Name is required');
  });

  it('should submit the form if valid', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'John', email: 'john@example.com' },
        validate,
        onSubmit,
      })
    );
    
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });
    
    expect(onSubmit).toHaveBeenCalledWith(
      { name: 'John', email: 'john@example.com' },
      expect.any(Function)
    );
  });

  it('should not submit the form if validation fails', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validate,
        onSubmit,
      })
    );
    
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({
      name: 'Name is required',
      email: 'Email is required',
    });
  });
});
