import { z } from 'zod';

// Base interfaces
export interface InvoiceItem {
  item_name: string;
  item_description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface InvoiceFormData {
  // Invoice basic info
  invoice_type: 'standard' | 'tuition' | 'payroll' | 'expense';
  is_income: boolean;
  
  // Related entities
  student_id: string;
  employee_id: string;
  facility_id: string;
  class_id: string;
  
  // Invoice details
  invoice_date: string;
  due_date: string;
  description: string;
  notes: string;
  
  // Financial details
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  
  // Invoice items
  items: InvoiceItem[];
  
  // Payment info
  create_payment: boolean;
  payment_method: string;
  payment_amount: number;
  payment_date: string;
  reference_number: string;
}

// Reference data interfaces
export interface Student {
  id: string;
  full_name: string;
}

export interface Employee {
  id: string;
  full_name: string;
}

export interface Facility {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  class_name: string;
}

export interface Category {
  value: string;
  label_vi: string;
  label?: string;
  type: 'income' | 'expense';
}

export interface PaymentMethod {
  value: string;
  label_vi: string;
}

// Form props interfaces
export interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<InvoiceFormData>;
  mode?: 'create' | 'edit' | 'view';
}

// Modal state interface
export interface InvoiceModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  invoice?: any;
}

// Zod validation schemas
const invoiceItemSchema = z.object({
  item_name: z.string().min(1, 'Tên mục không được để trống'),
  item_description: z.string(),
  category: z.string().min(1, 'Danh mục không được để trống'),
  quantity: z.number().min(0.01, 'Số lượng phải lớn hơn 0'),
  unit_price: z.number().min(0, 'Đơn giá không được âm'),
  total_amount: z.number().min(0, 'Thành tiền không được âm'),
});

export const invoiceFormSchema = z.object({
  // Basic info
  invoice_type: z.enum(['standard', 'tuition', 'payroll', 'expense']),
  is_income: z.boolean(),
  
  // Related entities
  student_id: z.string(),
  employee_id: z.string(),
  facility_id: z.string(),
  class_id: z.string(),
  
  // Invoice details
  invoice_date: z.string().min(1, 'Ngày hóa đơn không được để trống'),
  due_date: z.string(),
  description: z.string().min(1, 'Mô tả không được để trống'),
  notes: z.string(),
  
  // Financial details
  subtotal: z.number().min(0),
  tax_rate: z.number().min(0).max(100),
  tax_amount: z.number().min(0),
  discount_amount: z.number().min(0),
  total_amount: z.number().min(0),
  
  // Items
  items: z.array(invoiceItemSchema).min(1, 'Phải có ít nhất một mục trong hóa đơn'),
  
  // Payment info
  create_payment: z.boolean(),
  payment_method: z.string(),
  payment_amount: z.number().min(0),
  payment_date: z.string(),
  reference_number: z.string(),
}).refine((data) => {
  // Conditional validation for income invoices
  if (data.is_income && !data.student_id) {
    return false;
  }
  // Conditional validation for expense invoices
  if (!data.is_income && !data.employee_id) {
    return false;
  }
  // Payment validation
  if (data.create_payment) {
    return data.payment_method && data.payment_amount && data.payment_date;
  }
  return true;
}, {
  message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
});

// Default values
export const defaultInvoiceFormData: InvoiceFormData = {
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
};

// Fallback data
export const fallbackCategories: Category[] = [
  // Income categories
  { value: 'tuition_fee', label_vi: 'Học phí', type: 'income' },
  { value: 'registration_fee', label_vi: 'Phí đăng ký', type: 'income' },
  { value: 'material_fee', label_vi: 'Phí tài liệu', type: 'income' },
  { value: 'exam_fee', label_vi: 'Phí thi', type: 'income' },
  { value: 'other_income', label_vi: 'Thu nhập khác', type: 'income' },
  // Expense categories
  { value: 'staff_salary', label_vi: 'Lương nhân viên', type: 'expense' },
  { value: 'teacher_bonus', label_vi: 'Thưởng giáo viên', type: 'expense' },
  { value: 'facility_rent', label_vi: 'Tiền thuê mặt bằng', type: 'expense' },
  { value: 'utilities', label_vi: 'Tiện ích', type: 'expense' },
  { value: 'equipment', label_vi: 'Thiết bị', type: 'expense' },
  { value: 'marketing', label_vi: 'Marketing', type: 'expense' },
  { value: 'other_expense', label_vi: 'Chi phí khác', type: 'expense' }
];

export const fallbackPaymentMethods: PaymentMethod[] = [
  { value: 'cash', label_vi: 'Tiền mặt' },
  { value: 'bank_transfer', label_vi: 'Chuyển khoản' },
  { value: 'credit_card', label_vi: 'Thẻ tín dụng' },
  { value: 'online_payment', label_vi: 'Thanh toán online' }
];
