// useFormValidation hook
import { useState, useCallback } from 'react';

interface UseFormValidationOptions<T> {
  initialValues: T;
  validate: (values: T) => Record<string, string>;
  asyncValidate?: (values: T) => Promise<Record<string, string>>;
  onSubmit?: (values: T, resetForm: () => void) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  setFieldValue: (name: string, value: unknown) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  setFieldError: (name: string, error: string) => void;
  clearFieldError: (name: string) => void;
  clearAllErrors: () => void;
}

export const useFormValidation = <T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): FormState<T> => {
  const [values, setValues] = useState<T>(options.initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): Record<string, string> => {
    return options.validate(values);
  }, [values, options]);

  const resetForm = useCallback(() => {
    setValues(options.initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [options.initialValues]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    let finalValue: unknown = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    
    setValues(prevValues => {
      const newValues = { ...prevValues, [name]: finalValue };
      
      // Only validate on change if validateOnChange is enabled
      if (options.validateOnChange) {
        const validationErrors = options.validate(newValues);
        setErrors(validationErrors);
      }
      
      return newValues;
    });
  }, [options]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Only validate on blur if validateOnBlur is enabled
    if (options.validateOnBlur) {
      const validationErrors = options.validate(values);
      setErrors(validationErrors);
    }
  }, [options, values]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validationErrors = validateForm();
      setErrors(validationErrors);

      // Check if there are any actual error messages (not just empty strings or undefined)
      const hasErrors = Object.values(validationErrors).some(error => error && error.trim().length > 0);

      if (hasErrors) {
        setIsSubmitting(false);
        return;
      }

      // Run async validation if provided
      if (options.asyncValidate) {
        try {
          const asyncErrors = await options.asyncValidate(values);
          setErrors(prev => ({ ...prev, ...asyncErrors }));
          
          const hasAsyncErrors = Object.values(asyncErrors).some(error => error && error.trim().length > 0);
          if (hasAsyncErrors) {
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error('Async validation error:', error);
          setErrors(prev => ({ ...prev, _asyncValidation: 'Validation failed. Please try again.' }));
          setIsSubmitting(false);
          return;
        }
      }

      // If we reach here, form is valid, call onSubmit
      if (options.onSubmit) {
        await options.onSubmit(values, resetForm);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({ ...prev, _submit: 'Submission failed. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, options, resetForm]);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setValues(prev => {
      const newValues = { ...prev, [name]: value };
      
      // Validate after setting field value if validateOnChange is enabled
      if (options.validateOnChange) {
        const validationErrors = options.validate(newValues);
        setErrors(validationErrors);
      }
      
      return newValues;
    });
  }, [options]);

  const setFieldTouched = useCallback((name: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: touched }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const isValid = !Object.values(validateForm()).some(error => error && error.trim().length > 0);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    clearAllErrors,
  };
};
