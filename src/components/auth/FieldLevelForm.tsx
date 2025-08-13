/**
 * Field-Level Permission-Aware Form Component
 * Automatically handles field visibility, editing rights, and validation based on RBAC
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Shield, AlertTriangle } from 'lucide-react';
import { FieldLevelPermissions, type FieldPermissionContext } from '@/lib/auth/field-level-permissions';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

interface FieldLevelFormProps {
  context: Omit<FieldPermissionContext, 'operation'>;
  fields: FieldConfig[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  className?: string;
  showFieldPermissions?: boolean; // For debugging/admin view
}

export const FieldLevelForm: React.FC<FieldLevelFormProps> = ({
  context,
  fields,
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
  className = '',
  showFieldPermissions = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [fieldMetadata, setFieldMetadata] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSensitiveFields, setShowSensitiveFields] = useState<Record<string, boolean>>({});

  // Load field metadata on mount
  useEffect(() => {
    const metadata: Record<string, any> = {};
    
    fields.forEach(field => {
      metadata[field.name] = FieldLevelPermissions.getFieldMetadata(context, field.name);
    });
    
    setFieldMetadata(metadata);
  }, [context, fields]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    
    // Validate field permissions first
    const operation = isEditing ? 'edit' : 'create';
    const validation = await FieldLevelPermissions.validateFieldData(
      context,
      formData,
      operation
    );

    if (!validation.isValid) {
      validation.deniedFields.forEach(field => {
        newErrors[field] = 'You do not have permission to modify this field';
      });
      
      validation.requiredMissing.forEach(field => {
        newErrors[field] = 'This field is required';
      });
    }

    // Custom field validation
    fields.forEach(field => {
      const metadata = fieldMetadata[field.name];
      const value = formData[field.name];
      
      if (!metadata) return;
      
      // Skip validation for fields user can't edit
      if (operation === 'edit' && !metadata.canEdit) return;
      if (operation === 'create' && !metadata.canCreate) return;
      
      // Required field validation
      if (field.validation?.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }
      
      if (value) {
        // Min/Max length validation
        if (field.validation?.minLength && value.length < field.validation.minLength) {
          newErrors[field.name] = `${field.label} must be at least ${field.validation.minLength} characters`;
          return;
        }
        
        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
          newErrors[field.name] = `${field.label} must be no more than ${field.validation.maxLength} characters`;
          return;
        }
        
        // Pattern validation
        if (field.validation?.pattern && !field.validation.pattern.test(value)) {
          newErrors[field.name] = `${field.label} format is invalid`;
          return;
        }
        
        // Custom validation
        if (field.validation?.custom) {
          const customError = field.validation.custom(value);
          if (customError) {
            newErrors[field.name] = customError;
            return;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const isValid = await validateForm();
      if (!isValid) return;
      
      // Filter form data to only include allowed fields
      const operation = isEditing ? 'edit' : 'create';
      const validation = await FieldLevelPermissions.validateFieldData(
        context,
        formData,
        operation
      );
      
      await onSubmit(validation.allowedFields);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ _form: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSensitiveField = (fieldName: string) => {
    setShowSensitiveFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const renderField = (field: FieldConfig) => {
    const metadata = fieldMetadata[field.name];
    if (!metadata) return null;

    const operation = isEditing ? 'edit' : 'create';
    const canEdit = operation === 'edit' ? metadata.canEdit : metadata.canCreate;
    const canView = metadata.canView;
    
    if (!canView) return null;

    const value = formData[field.name] || '';
    const error = errors[field.name];
    const isSensitive = metadata.isSensitive;
    const isRequired = metadata.isRequired;
    const hasMasking = metadata.hasMasking;
    
    // Handle sensitive field masking
    let displayValue = value;
    if (isSensitive && hasMasking && !showSensitiveFields[field.name]) {
      displayValue = '••••••••';
    }

    const fieldProps = {
      id: field.name,
      name: field.name,
      value: canEdit ? value : displayValue,
      onChange: canEdit ? (e: any) => handleInputChange(field.name, e.target.value) : undefined,
      disabled: !canEdit,
      placeholder: field.placeholder,
      className: `${error ? 'border-red-500' : ''} ${!canEdit ? 'bg-gray-100' : ''}`,
      'aria-describedby': error ? `${field.name}-error` : undefined
    };

    return (
      <div key={field.name} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.name} className="flex items-center gap-1">
            {field.label}
            {isRequired && <span className="text-red-500">*</span>}
            {isSensitive && <Shield className="h-3 w-3 text-amber-500" />}
            {!canEdit && <Lock className="h-3 w-3 text-gray-500" />}
          </Label>
          
          {showFieldPermissions && (
            <div className="flex gap-1">
              <Badge variant={canView ? 'default' : 'secondary'} className="text-xs">
                V:{canView ? '✓' : '✗'}
              </Badge>
              <Badge variant={canEdit ? 'default' : 'secondary'} className="text-xs">
                E:{canEdit ? '✓' : '✗'}
              </Badge>
              {isSensitive && (
                <Badge variant="destructive" className="text-xs">S</Badge>
              )}
            </div>
          )}
          
          {isSensitive && canView && (
            <button
              type="button"
              onClick={() => toggleSensitiveField(field.name)}
              className="p-1 hover:bg-gray-100 rounded"
              title={showSensitiveFields[field.name] ? 'Hide sensitive data' : 'Show sensitive data'}
            >
              {showSensitiveFields[field.name] ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </button>
          )}
        </div>

        {field.type === 'textarea' && (
          <Textarea {...fieldProps} rows={3} />
        )}
        
        {field.type === 'select' && (
          <Select
            value={value}
            onValueChange={canEdit ? (val) => handleInputChange(field.name, val) : undefined}
            disabled={!canEdit}
          >
            <SelectTrigger className={fieldProps.className}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {field.type === 'checkbox' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={!!value}
              onCheckedChange={canEdit ? (checked) => handleInputChange(field.name, checked) : undefined}
              disabled={!canEdit}
            />
            <Label htmlFor={field.name} className="text-sm font-normal">
              {field.placeholder || field.label}
            </Label>
          </div>
        )}
        
        {!['textarea', 'select', 'checkbox'].includes(field.type) && (
          <Input
            {...fieldProps}
            type={field.type === 'password' && showSensitiveFields[field.name] ? 'text' : field.type}
          />
        )}

        {error && (
          <p id={`${field.name}-error`} className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {error}
          </p>
        )}
        
        {!canEdit && canView && (
          <p className="text-xs text-gray-500">Read-only field</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {errors._form && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors._form}</AlertDescription>
        </Alert>
      )}
      
      {fields.map(renderField)}
      
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : isEditing ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};