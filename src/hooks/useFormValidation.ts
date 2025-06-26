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

export const useFormValidation = <T extends Record<string, any>>(
  options: UseFormValidationOptions<T>
) => {
  const [values, setValues] = useState<T>(options.initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): Record<string, string> => {
    return options.validate(values);
  }, [values, options.validate]);

  const resetForm = useCallback(() => {
    setValues(options.initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [options.initialValues]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setValues(prevValues => {
      const newValues = { ...prevValues, [name]: value };
      
      // Validate with the new values
      const validationErrors = options.validate(newValues);
      setErrors(validationErrors);
      
      return newValues;
    });
  }, [options]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur with current values
    setValues(currentValues => {
      const validationErrors = options.validate(currentValues);
      setErrors(validationErrors);
      return currentValues;
    });
  }, [options]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
        setIsSubmitting(false);
        return;
      }
    }

    // If we reach here, form is valid, call onSubmit
    try {
      if (options.onSubmit) {
        await options.onSubmit(values, resetForm);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, options, resetForm]);

  const setFieldValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldTouched = useCallback((name: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: touched }));
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
  };
};
