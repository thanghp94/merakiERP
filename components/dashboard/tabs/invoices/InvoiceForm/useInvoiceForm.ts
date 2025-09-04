import { useState, useEffect } from 'react';

interface InvoiceItem {
  item_name: string;
  item_description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface FormData {
  invoice_type: 'standard' | 'tuition' | 'payroll' | 'expense';
  is_income: boolean;
  student_id: string;
  employee_id: string;
  facility_id: string;
  class_id: string;
  invoice_date: string;
  due_date: string;
  description: string;
  notes: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  items: InvoiceItem[];
  create_payment: boolean;
  payment_method: string;
  payment_amount: number;
  payment_date: string;
  reference_number: string;
}

export function useInvoiceForm(initialData?: Partial<FormData>) {
  const [formData, setFormData] = useState<FormData>({
    invoice_type: 'standard',
    is_income: true,
    student_id: '',
    employee_id: '',
    facility_id: '',
    class_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    notes: '',
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    items: [],
    create_payment: false,
    payment_method: 'cash',
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.discount_amount]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_amount, 0);
    const tax_amount = (subtotal * formData.tax_rate) / 100;
    const total_amount = subtotal + tax_amount - formData.discount_amount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount: Math.max(0, total_amount),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleIncomeTypeChange = (is_income: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_income,
      invoice_type: is_income ? 'tuition' : 'expense',
      student_id: is_income ? prev.student_id : '',
      employee_id: is_income ? '' : prev.employee_id,
      items: [],
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      item_name: '',
      item_description: '',
      category: '',
      quantity: 1,
      unit_price: 0,
      total_amount: 0,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_amount = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, onSubmit: (data: FormData) => Promise<void>) => {
    e.preventDefault();

    const invoiceData = {
      ...formData,
      student_id: formData.is_income ? formData.student_id || '' : '',
      employee_id: !formData.is_income ? formData.employee_id || '' : '',
      facility_id: formData.facility_id || '',
      class_id: formData.class_id || '',
      invoice_date: formData.invoice_date || new Date().toISOString().split('T')[0],
      due_date: formData.due_date || '',
      payment_date: formData.create_payment ? (formData.payment_date || new Date().toISOString().split('T')[0]) : '',
    };

    await onSubmit(invoiceData);
  };

  const incomeCategories = (categories: any[]) => categories.filter(cat => cat.type === 'income');
  const expenseCategories = (categories: any[]) => categories.filter(cat => cat.type === 'expense');

  return {
    formData,
    setFormData,
    handleInputChange,
    handleIncomeTypeChange,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    incomeCategories,
    expenseCategories,
  };
}
