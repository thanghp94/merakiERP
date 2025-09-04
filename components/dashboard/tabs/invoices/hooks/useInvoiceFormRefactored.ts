import { useState, useEffect, useCallback } from 'react';
import { useFormWithValidation } from '@/lib/hooks/useFormWithValidation';
import { 
  InvoiceFormData, 
  InvoiceItem, 
  invoiceFormSchema, 
  defaultInvoiceFormData 
} from '../types/invoice.types';

interface UseInvoiceFormOptions {
  initialData?: any; // Allow any structure for initial data from API
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onSuccess?: () => void;
}

export const useInvoiceFormRefactored = ({ 
  initialData, 
  onSubmit, 
  onSuccess 
}: UseInvoiceFormOptions) => {
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  // Use the standardized form validation hook
  const form = useFormWithValidation<InvoiceFormData>({
    schema: invoiceFormSchema,
    defaultValues: {
      ...defaultInvoiceFormData,
      ...initialData,
    },
    onSubmit: async (data) => {
      // Process the data before submission
      const processedData = {
        ...data,
        // Ensure proper entity relationships
        student_id: data.is_income ? data.student_id || '' : '',
        employee_id: !data.is_income ? data.employee_id || '' : '',
        facility_id: data.facility_id || '',
        class_id: data.class_id || '',
        // Ensure proper date formatting
        invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
        due_date: data.due_date || '',
        payment_date: data.create_payment ? 
          (data.payment_date || new Date().toISOString().split('T')[0]) : '',
      };

      await onSubmit(processedData);
    },
    onSuccess: () => {
      form.reset();
      onSuccess?.();
    }
  });

  // Watch form values for calculations and category filtering
  const watchedValues = form.watch();
  const { is_income, items, tax_rate, discount_amount } = watchedValues;

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      const mappedData: InvoiceFormData = {
        ...defaultInvoiceFormData,
        ...initialData,
        items: initialData.invoice_items || initialData.items || [],
        invoice_date: initialData.invoice_date ? 
          initialData.invoice_date.split('T')[0] : 
          new Date().toISOString().split('T')[0],
        due_date: initialData.due_date ? 
          initialData.due_date.split('T')[0] : '',
        student_id: initialData.student_id || '',
        employee_id: initialData.employee_id || '',
        facility_id: initialData.facility_id || '',
        class_id: initialData.class_id || '',
      };
      
      // Reset form with mapped data
      form.reset(mappedData);
    }
  }, [initialData, form]);

  // Auto-calculate totals when items or rates change
  useEffect(() => {
    const subtotal = items.reduce((sum: number, item: InvoiceItem) => sum + item.total_amount, 0);
    const tax_amount = (subtotal * tax_rate) / 100;
    const total_amount = Math.max(0, subtotal + tax_amount - discount_amount);

    // Update calculated fields
    form.setValue('subtotal', subtotal);
    form.setValue('tax_amount', tax_amount);
    form.setValue('total_amount', total_amount);

    // Update payment amount to match total if create_payment is enabled
    if (watchedValues.create_payment && watchedValues.payment_amount === 0) {
      form.setValue('payment_amount', total_amount);
    }
  }, [items, tax_rate, discount_amount, form, watchedValues.create_payment, watchedValues.payment_amount]);

  // Handle income type change
  const handleIncomeTypeChange = useCallback((newIsIncome: boolean) => {
    form.setValue('is_income', newIsIncome);
    form.setValue('invoice_type', newIsIncome ? 'tuition' : 'expense');
    
    // Clear opposite entity fields
    if (newIsIncome) {
      form.setValue('employee_id', '');
    } else {
      form.setValue('student_id', '');
    }
    
    // Clear items to avoid category conflicts
    form.setValue('items', []);
  }, [form]);

  // Item management functions
  const addItem = useCallback(() => {
    const currentItems = form.getValues('items');
    const newItem: InvoiceItem = {
      item_name: '',
      item_description: '',
      category: '',
      quantity: 1,
      unit_price: 0,
      total_amount: 0,
    };
    form.setValue('items', [...currentItems, newItem]);
  }, [form]);

  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
    const currentItems = form.getValues('items');
    const updatedItems = [...currentItems];
    
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-calculate total_amount when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_amount = 
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    form.setValue('items', updatedItems);
  }, [form]);

  const removeItem = useCallback((index: number) => {
    const currentItems = form.getValues('items');
    const updatedItems = currentItems.filter((_, i) => i !== index);
    form.setValue('items', updatedItems);
  }, [form]);

  // Filter categories based on income type
  const filterCategories = useCallback((categories: any[]) => {
    const filtered = categories.filter(cat => 
      cat.type === (is_income ? 'income' : 'expense')
    );
    setAvailableCategories(filtered);
    return filtered;
  }, [is_income]);

  return {
    form,
    // Form state
    formData: watchedValues,
    isSubmitting: form.isSubmitting,
    submitError: form.submitError,
    
    // Form actions
    handleSubmit: form.handleSubmit,
    handleIncomeTypeChange,
    
    // Item management
    addItem,
    updateItem,
    removeItem,
    
    // Category filtering
    availableCategories,
    filterCategories,
    
    // Utility functions
    resetForm: form.resetForm,
  };
};
