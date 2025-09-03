import { z } from 'zod';
import { Employee } from '@/shared/types';
import { commonSchemas } from '@/hooks/useFormWithValidation';

// Employee form validation schema
export const employeeSchema = z.object({
  full_name: commonSchemas.requiredString('Họ tên'),
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  address: commonSchemas.optionalString,
  status: z.enum(['active', 'inactive', 'terminated']),
  position: commonSchemas.requiredString('Chức vụ'),
  department: commonSchemas.requiredString('Phòng ban'),
  hire_date: commonSchemas.date,
  id_number: commonSchemas.optionalString,
  id_issue_date: commonSchemas.date,
  id_expiry_date: commonSchemas.date,
  avatar: commonSchemas.optionalString,
  experience: commonSchemas.optionalString,
  qualifications: commonSchemas.optionalString,
  date_of_birth: commonSchemas.date,
  nationality: commonSchemas.optionalString,
  customNationality: commonSchemas.optionalString,
  notes: commonSchemas.optionalString,
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export const EMPLOYEE_STATUSES = {
  active: 'Đang làm việc',
  inactive: 'Tạm nghỉ',
  terminated: 'Đã nghỉ việc'
} as const;

export const POSITIONS = {
  teacher: 'Giáo viên',
  teaching_assistant: 'Trợ giảng',
  manager: 'Quản lý',
  admin: 'Quản trị viên',
  receptionist: 'Lễ tân',
  accountant: 'Kế toán',
  other: 'Khác'
} as const;

export const DEPARTMENTS = {
  teaching: 'Giảng dạy',
  administration: 'Hành chính',
  finance: 'Tài chính',
  marketing: 'Marketing',
  hr: 'Nhân sự',
  it: 'Công nghệ thông tin',
  other: 'Khác'
} as const;

export const NATIONALITIES = {
  vietnamese: 'Việt Nam',
  american: 'Mỹ',
  british: 'Anh',
  australian: 'Úc',
  canadian: 'Canada',
  other: 'Khác'
} as const;

// Modal state interface
export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  employee: Employee | null;
}

// Filter state interface
export interface EmployeeFilters {
  status: string;
  position: string;
  department: string;
}

// Enum option interface
export interface EnumOption {
  value: string;
  label: string;
}

// Props interfaces
export interface EmployeesTabCrudProps {
  employees: Employee[];
  isLoading: boolean;
  onSubmit: (data: any, formType: string) => Promise<void>;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  onWorkSchedule?: (employee: Employee) => void;
}

export interface EmployeesTableProps {
  employees: Employee[];
  isLoading: boolean;
  filters: EmployeeFilters;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onWorkSchedule?: (employee: Employee) => void;
  onCreateClick: () => void;
}

export interface EmployeesFormModalProps {
  modalState: ModalState;
  onClose: () => void;
  onSubmit: (data: any, formType: string) => Promise<void>;
  positionOptions: EnumOption[];
  departmentOptions: EnumOption[];
  isLoadingEnums: boolean;
}

export interface EmployeesFiltersProps {
  filters: EmployeeFilters;
  filterOptions: {
    statuses: string[];
    positions: string[];
    departments: string[];
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}
