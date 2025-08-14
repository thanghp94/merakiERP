import { useState, useCallback } from 'react';
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export interface UseFormWithValidationOptions<T extends FieldValues> extends UseFormProps<T> {
  schema?: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useFormWithValidation<T extends FieldValues>({
  schema,
  onSubmit,
  onSuccess,
  onError,
  ...formOptions
}: UseFormWithValidationOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<T>({
    ...formOptions,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  const handleSubmit = useCallback(async (data: T) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onSuccess, onError]);

  const resetForm = useCallback(() => {
    form.reset();
    setSubmitError(null);
    setIsSubmitting(false);
  }, [form]);

  return {
    ...form,
    handleSubmit: form.handleSubmit(handleSubmit),
    isSubmitting,
    submitError,
    resetForm,
  };
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 chữ số').optional().or(z.literal('')),
  requiredString: (fieldName: string, minLength = 2) => 
    z.string().min(minLength, `${fieldName} phải có ít nhất ${minLength} ký tự`),
  optionalString: z.string().optional(),
  positiveNumber: z.number().positive('Giá trị phải lớn hơn 0').optional(),
  date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'completed']).optional(),
};

// Helper function to create form data with nested structure
export function createFormData<T>(data: T, nestedFields: string[] = []): any {
  const result: any = {};
  const nestedData: any = {};

  Object.entries(data as any).forEach(([key, value]) => {
    if (nestedFields.includes(key)) {
      nestedData[key] = value;
    } else {
      result[key] = value;
    }
  });

  if (Object.keys(nestedData).length > 0) {
    result.data = nestedData;
  }

  return result;
}
