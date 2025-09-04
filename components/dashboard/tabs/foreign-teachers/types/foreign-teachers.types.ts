import { Employee } from '@/shared/types';

export interface ForeignTeachersTabCrudProps {
  employees: Employee[];
  isLoading: boolean;
  onSubmit: (data: any, formType: string) => void;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onWorkSchedule?: (employee: Employee) => void;
}

export interface ForeignTeachersTableProps {
  employees: Employee[];
  isLoading: boolean;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onWorkSchedule?: (employee: Employee) => void;
  onCreateClick: () => void;
}

export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  employee: Employee | null;
}

export interface ForeignTeachersFormModalProps {
  modalState: ModalState;
  onClose: () => void;
  onSubmit: (data: any, formType: string) => void;
  positionOptions: Array<{value: string, label: string}>;
  departmentOptions: Array<{value: string, label: string}>;
  isLoadingEnums: boolean;
}

export const EMPLOYEE_STATUSES = {
  active: 'Đang làm việc',
  inactive: 'Tạm nghỉ',
  terminated: 'Đã nghỉ việc'
};

export const NATIONALITIES = {
  american: 'Mỹ',
  british: 'Anh',
  australian: 'Úc',
  canadian: 'Canada',
  french: 'Pháp',
  german: 'Đức',
  japanese: 'Nhật Bản',
  korean: 'Hàn Quốc',
  chinese: 'Trung Quốc',
  other: 'Khác'
};
