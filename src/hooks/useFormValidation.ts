// useFormValidation hook
import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((values: Record<string, any>) => {
    const newErrors: Record<string, string> = {};

    Object.entries(rules).forEach(([field, rule]) => {
      const value = values[field];

      if (rule.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = `${field} is required`;
        return;
      }

      if (value && rule.minLength && value.toString().length < rule.minLength) {
        newErrors[field] = `${field} must be at least ${rule.minLength} characters`;
        return;
      }

      if (value && rule.maxLength && value.toString().length > rule.maxLength) {
        newErrors[field] = `${field} must not exceed ${rule.maxLength} characters`;
        return;
      }

      if (value && rule.pattern && !rule.pattern.test(value.toString())) {
        newErrors[field] = `${field} format is invalid`;
        return;
      }

      if (value && rule.custom && !rule.custom(value)) {
        newErrors[field] = `${field} is invalid`;
        return;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return { errors, validate, clearErrors };
};
