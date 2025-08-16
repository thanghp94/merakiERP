import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { Employee } from '@/shared/types';
import { formatDate, getStatusBadge } from '@/shared/utils';
import { 
  CrudTable, 
  TableColumn, 
  FilterConfig,
  FormGrid,
  FormField
} from '@/dashboard/shared';
import { useFormWithValidation, commonSchemas, createFormData } from '@/hooks/useFormWithValidation';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import FileUpload from '@/dashboard/shared/FileUpload';

interface EmployeesTabCrudProps {
  employees: Employee[];
  isLoading: boolean;
  onSubmit: (data: any, formType: string) => Promise<void>;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  onWorkSchedule?: (employee: Employee) => void;
}

// Employee form validation schema
const employeeSchema = z.object({
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

type EmployeeFormData = z.infer<typeof employeeSchema>;

const EMPLOYEE_STATUSES = {
  active: 'Đang làm việc',
  inactive: 'Tạm nghỉ',
  terminated: 'Đã nghỉ việc'
};

const POSITIONS = {
  teacher: 'Giáo viên',
  teaching_assistant: 'Trợ giảng',
  manager: 'Quản lý',
  admin: 'Quản trị viên',
  receptionist: 'Lễ tân',
  accountant: 'Kế toán',
  other: 'Khác'
};

const DEPARTMENTS = {
  teaching: 'Giảng dạy',
  administration: 'Hành chính',
  finance: 'Tài chính',
  marketing: 'Marketing',
  hr: 'Nhân sự',
  it: 'Công nghệ thông tin',
  other: 'Khác'
};

const NATIONALITIES = {
  vietnamese: 'Việt Nam',
  american: 'Mỹ',
  british: 'Anh',
  australian: 'Úc',
  canadian: 'Canada',
  other: 'Khác'
};

// Modal state interface
interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  employee: Employee | null;
}

export default function EmployeesTabCrud({
  employees,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onWorkSchedule
}: EmployeesTabCrudProps) {
  // Consolidated modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    employee: null
  });
  
  // State for enum values
  const [positionOptions, setPositionOptions] = useState<Array<{value: string, label: string}>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{value: string, label: string}>>([]);
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);

  // Other state
  const [showCustomNationality, setShowCustomNationality] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    position: 'all',
    department: 'all'
  });

  // ESC key handler for modal
  useEscapeKey(() => handleModalClose(), modalState.isOpen);

  // Load enum values on component mount
  useEffect(() => {
    loadEnumValues();
  }, []);

  const loadEnumValues = async () => {
    try {
      setIsLoadingEnums(true);
      
      // Fetch position enum values
      const [positionResponse, departmentResponse] = await Promise.all([
        fetch('/api/metadata/enums?type=position'),
        fetch('/api/metadata/enums?type=department')
      ]);
      
      const [positionData, departmentData] = await Promise.all([
        positionResponse.json(),
        departmentResponse.json()
      ]);
      
      // Set position options
      if (positionData.success && positionData.data) {
        setPositionOptions(positionData.data);
      } else {
        // Fallback to hardcoded values
        setPositionOptions(Object.entries(POSITIONS).map(([value, label]) => ({ value, label })));
      }
      
      // Set department options
      if (departmentData.success && departmentData.data) {
        setDepartmentOptions(departmentData.data);
      } else {
        // Fallback to hardcoded values
        setDepartmentOptions(Object.entries(DEPARTMENTS).map(([value, label]) => ({ value, label })));
      }
      
    } catch (error) {
      console.error('Error loading enum values:', error);
      // Fallback to hardcoded values
      setPositionOptions(Object.entries(POSITIONS).map(([value, label]) => ({ value, label })));
      setDepartmentOptions(Object.entries(DEPARTMENTS).map(([value, label]) => ({ value, label })));
    } finally {
      setIsLoadingEnums(false);
    }
  };

  // Use single form validation hook for all modes
  const form = useFormWithValidation<EmployeeFormData>({
    schema: employeeSchema,
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      position: '',
      department: '',
      hire_date: '',
      id_number: '',
      id_issue_date: '',
      id_expiry_date: '',
      avatar: '',
      experience: '',
      qualifications: '',
      date_of_birth: '',
      nationality: '',
      customNationality: '',
      notes: '',
    },
    onSubmit: async (data) => {
      if (modalState.mode === 'view') return; // No submission in view mode

      const submitData = createFormData(data, [
        'email', 'phone', 'address', 'hire_date', 'id_number', 'id_issue_date', 'id_expiry_date', 'experience', 'qualifications', 'date_of_birth', 'nationality', 'notes'
      ]);

      // Handle avatar file upload
      if (avatarFile) {
        submitData.files = { avatar: avatarFile };
      }

      // Handle custom nationality
      if (data.nationality === 'other' && data.customNationality) {
        submitData.data.nationality = data.customNationality;
      }

      if (modalState.mode === 'edit' && modalState.employee) {
        // Add the ID for editing
        submitData.id = modalState.employee.id;
      }

      await onSubmit(submitData, 'Employee');
      handleModalClose();
    },
    onSuccess: () => {
      form.resetForm();
      setShowCustomNationality(false);
      setAvatarFile(null);
    }
  });

  // Auto-populate form when modal opens in edit or view mode
  useEffect(() => {
    if (modalState.isOpen && (modalState.mode === 'edit' || modalState.mode === 'view') && modalState.employee) {
      const employee = modalState.employee;
      form.resetForm();
      form.setValue('full_name', employee.full_name);
      form.setValue('email', employee.data?.email || '');
      form.setValue('phone', employee.data?.phone || '');
      form.setValue('address', employee.data?.address || '');
      form.setValue('status', employee.status as 'active' | 'inactive' | 'terminated');
      form.setValue('position', employee.position || '');
      form.setValue('department', employee.department || '');
      form.setValue('hire_date', employee.data?.hire_date || '');
      form.setValue('id_number', employee.data?.id_number || '');
      form.setValue('id_issue_date', employee.data?.id_issue_date || '');
      form.setValue('id_expiry_date', employee.data?.id_expiry_date || '');
      form.setValue('avatar', employee.data?.avatar || '');
      form.setValue('experience', employee.data?.experience || '');
      form.setValue('qualifications', employee.data?.qualifications || '');
      form.setValue('date_of_birth', employee.data?.date_of_birth || '');
      form.setValue('nationality', employee.data?.nationality || '');
      form.setValue('notes', employee.data?.notes || '');
      
      // Set custom nationality visibility
      setShowCustomNationality(employee.data?.nationality === 'other');
    } else if (modalState.isOpen && modalState.mode === 'create') {
      form.resetForm();
      setShowCustomNationality(false);
    }
  }, [modalState.isOpen, modalState.mode, modalState.employee]);

  // Filter employees based on selected filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesStatus = filters.status === 'all' || employee.status === filters.status;
      const matchesPosition = filters.position === 'all' || employee.position === filters.position;
      const matchesDepartment = filters.department === 'all' || employee.department === filters.department;

      return matchesStatus && matchesPosition && matchesDepartment;
    });
  }, [employees, filters]);

  // Extract unique values for filter options
  const getFilterOptions = () => {
    const statuses = Array.from(new Set(employees.map(employee => employee.status).filter(Boolean)));
    const positions = Array.from(new Set(employees.map(employee => employee.position).filter(Boolean)));
    const departments = Array.from(new Set(employees.map(employee => employee.department).filter(Boolean)));

    return {
      statuses,
      positions,
      departments
    };
  };

  const filterOptions = getFilterOptions();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      position: 'all',
      department: 'all'
    });
  };

  // Consolidated modal handlers
  const handleModalClose = () => {
    form.resetForm();
    setModalState({
      isOpen: false,
      mode: 'create',
      employee: null
    });
    setShowCustomNationality(false);
    setAvatarFile(null);
  };

  const handleCreateClick = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      employee: null
    });
  };

  const handleEditEmployee = (employee: Employee) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      employee: employee
    });
  };

  const handleViewEmployee = (employee: Employee) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      employee: employee
    });
  };

  // Filter configuration
  const getFilterConfig = (): FilterConfig[] => {
    return [
      {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { value: 'all', label: 'Tất cả trạng thái' },
          ...filterOptions.statuses.map(status => ({
            value: status,
            label: EMPLOYEE_STATUSES[status as keyof typeof EMPLOYEE_STATUSES] || status
          }))
        ]
      },
      {
        key: 'position',
        label: 'Vị trí',
        options: [
          { value: 'all', label: 'Tất cả vị trí' },
          ...filterOptions.positions.map(position => ({
            value: position!,
            label: position!
          }))
        ]
      },
      {
        key: 'department',
        label: 'Phòng ban',
        options: [
          { value: 'all', label: 'Tất cả phòng ban' },
          ...filterOptions.departments.map(department => ({
            value: department!,
            label: department!
          }))
        ]
      }
    ];
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<Employee>[] => {
    return [
      {
        key: 'full_name',
        label: 'Họ và tên',
        render: (value, row) => (
          <div>
            <button
              onClick={() => handleViewEmployee(row)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
            >
              {value}
            </button>
            {row.position && (
              <div className="text-sm text-gray-500">{row.position}</div>
            )}
          </div>
        )
      },
      {
        key: 'contact',
        label: 'Liên hệ',
        render: (value, row) => (
          <div>
            {row.data?.email && (
              <div className="text-sm text-gray-900">{row.data.email}</div>
            )}
            {row.data?.phone && (
              <div className="text-sm text-gray-500">{row.data.phone}</div>
            )}
          </div>
        )
      },
      {
        key: 'department',
        label: 'Phòng ban',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {value || '-'}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => {
          const statusColors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-yellow-100 text-yellow-800',
            terminated: 'bg-red-100 text-red-800'
          };
          
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
              {EMPLOYEE_STATUSES[value as keyof typeof EMPLOYEE_STATUSES] || value}
            </span>
          );
        }
      }
    ];
  };

  const isReadOnly = modalState.mode === 'view';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleModalClose();
    }
  };

  return (
    <div className="space-y-6">
      <CrudTable
        data={filteredEmployees}
        columns={getTableColumns()}
        isLoading={isLoading}
        filters={filters}
        filterConfigs={getFilterConfig()}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onDelete={onDelete}
        customActions={onWorkSchedule ? [{
          label: 'Lịch làm việc',
          icon: '📅',
          onClick: onWorkSchedule,
          variant: 'secondary' as const,
          iconOnly: true,
          tooltip: 'Xem lịch làm việc'
        }] : []}
        title="Danh sách nhân viên"
        createButtonLabel="Thêm nhân viên"
        onCreateClick={handleCreateClick}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0z" />
            </svg>
          ),
          title: 'Không có nhân viên nào',
          description: 'Chưa có nhân viên nào được tạo.'
        }}
      />

      {/* Comprehensive Employee Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">👨‍💼</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {modalState.mode === 'create' ? 'Thêm nhân viên mới' :
                     modalState.mode === 'edit' ? 'Chỉnh sửa nhân viên' :
                     'Chi tiết nhân viên'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {modalState.mode === 'create' ? 'Nhập thông tin nhân viên mới' :
                     modalState.mode === 'edit' ? 'Cập nhật thông tin nhân viên' :
                     'Xem thông tin chi tiết về nhân viên'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {form.submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {form.submitError}
                </div>
              )}

              <form onSubmit={form.handleSubmit} className="space-y-6">
                {/* Basic Information - 3 Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Thông tin cá nhân
                    </h3>
                    
                    <FormField label="Họ và tên" required>
                      <input
                        {...form.register('full_name')}
                        type="text"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="Nhập họ và tên"
                      />
                      {form.formState.errors.full_name && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.full_name.message}</p>
                      )}
                    </FormField>

                    <FormField label="Email" required>
                      <input
                        {...form.register('email')}
                        type="email"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="email@example.com"
                      />
                      {form.formState.errors.email && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
                      )}
                    </FormField>

                    <FormField label="Số điện thoại" required>
                      <input
                        {...form.register('phone')}
                        type="tel"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="0901234567"
                      />
                      {form.formState.errors.phone && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.phone.message}</p>
                      )}
                    </FormField>

                    <FormField label="Ngày sinh">
                      <input
                        {...form.register('date_of_birth')}
                        type="date"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                    </FormField>

                    <FormField label="Địa chỉ">
                      <textarea
                        {...form.register('address')}
                        rows={2}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="Nhập địa chỉ"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Thông tin công việc
                    </h3>
                    
                    <FormField label="Chức vụ" required>
                      <select
                        {...form.register('position')}
                        disabled={isReadOnly || isLoadingEnums}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      >
                        <option value="">Chọn chức vụ</option>
                        {positionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.position && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.position.message}</p>
                      )}
                    </FormField>

                    <FormField label="Phòng ban" required>
                      <select
                        {...form.register('department')}
                        disabled={isReadOnly || isLoadingEnums}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      >
                        <option value="">Chọn phòng ban</option>
                        {departmentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.department && (
                        <p className="mt-1 text-xs text-red-600">{form.formState.errors.department.message}</p>
                      )}
                    </FormField>

                    <FormField label="Trạng thái">
                      <select
                        {...form.register('status')}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      >
                        {Object.entries(EMPLOYEE_STATUSES).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Ngày bắt đầu làm việc">
                      <input
                        {...form.register('hire_date')}
                        type="date"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                    </FormField>

                    <FormField label="Kinh nghiệm">
                      <textarea
                        {...form.register('experience')}
                        rows={3}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="Mô tả kinh nghiệm làm việc"
                      />
                    </FormField>
                  </div>

                  {/* Document Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Thông tin giấy tờ
                    </h3>
                    
                    <FormField label="Số CCCD/CMND">
                      <input
                        {...form.register('id_number')}
                        type="text"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="Số CCCD/CMND"
                      />
                    </FormField>

                    <FormField label="Ngày cấp CCCD">
                      <input
                        {...form.register('id_issue_date')}
                        type="date"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                    </FormField>

                    <FormField label="Ngày hết hạn CCCD">
                      <input
                        {...form.register('id_expiry_date')}
                        type="date"
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                    </FormField>

                    <FormField label="Trình độ">
                      <textarea
                        {...form.register('qualifications')}
                        rows={3}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="Mô tả bằng cấp, chứng chỉ"
                      />
                    </FormField>

                    <FormField label="Quốc tịch">
                      <select
                        {...form.register('nationality')}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        onChange={(e) => {
                          form.setValue('nationality', e.target.value);
                          setShowCustomNationality(e.target.value === 'other');
                        }}
                      >
                        <option value="">Chọn quốc tịch</option>
                        {Object.entries(NATIONALITIES).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {showCustomNationality && (
                        <input
                          {...form.register('customNationality')}
                          type="text"
                          disabled={isReadOnly}
                          className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mt-2 ${isReadOnly ? 'bg-gray-50' : ''}`}
                          placeholder="Nhập quốc tịch khác"
                        />
                      )}
                    </FormField>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Thông tin bổ sung
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!isReadOnly && (
                      <FormField label="Avatar">
                        <FileUpload
                          label="Chọn ảnh đại diện"
                          accept="image/*"
                          maxSize={5}
                          onFileSelect={setAvatarFile}
                          currentFile={modalState.employee?.data?.avatar}
                          error={form.formState.errors.avatar?.message}
                        />
                      </FormField>
                    )}
                    
                    <FormField label="Ghi chú" className={!isReadOnly ? "md:col-span-1" : "md:col-span-2"}>
                      <textarea
                        {...form.register('notes')}
                        rows={3}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                        placeholder="Ghi chú thêm về nhân viên"
                      />
                    </FormField>
                  </div>
                </div>

                {/* System Information - Only show in view mode */}
                {modalState.mode === 'view' && modalState.employee && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin hệ thống</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 text-gray-900 font-mono">{modalState.employee.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ngày tạo:</span>
                        <span className="ml-2 text-gray-900">
                          {modalState.employee.created_at ? formatDate(modalState.employee.created_at) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                💡 Nhấn <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">ESC</kbd> để đóng
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {modalState.mode === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                {modalState.mode !== 'view' && (
                  <button
                    type="submit"
                    onClick={form.handleSubmit}
                    disabled={form.isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {form.isSubmitting ? 'Đang xử lý...' : (modalState.mode === 'create' ? 'Thêm mới' : 'Cập nhật')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
