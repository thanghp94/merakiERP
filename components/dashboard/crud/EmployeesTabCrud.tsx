import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { Employee } from '@/shared/types';
import { 
  CrudTable, 
  TableColumn, 
  FilterConfig, 
  FormModal 
} from '@/dashboard/shared';
import { useFormWithValidation, commonSchemas, createFormData } from '@/hooks/useFormWithValidation';
import EmployeeDetailModal from '@/dashboard/tabs/employees/EmployeeDetailModal';

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
  position: commonSchemas.optionalString,
  department: commonSchemas.optionalString,
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

  // Load enum values on component mount
  useEffect(() => {
    loadEnumValues();
  }, []);

  const loadEnumValues = async () => {
    try {
      setIsLoadingEnums(true);
      const response = await fetch('/api/metadata/enums');
      const data = await response.json();
      
      if (data.success) {
        setPositionOptions(data.data.positions || []);
        setDepartmentOptions(data.data.departments || []);
      }
    } catch (error) {
      console.error('Error loading enum values:', error);
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
    } else if (modalState.isOpen && modalState.mode === 'create') {
      form.resetForm();
    }
  }, [modalState.isOpen, modalState.mode, modalState.employee, form]);

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
        title="Danh sách nhân viên"
        createButtonLabel="Thêm nhân viên"
        onCreateClick={handleCreateClick}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          title: 'Không có nhân viên nào',
          description: 'Chưa có nhân viên nào được tạo.'
        }}
      />

      {/* View Mode: Employee Detail Modal */}
      <EmployeeDetailModal
        isOpen={modalState.isOpen && modalState.mode === 'view'}
        onClose={handleModalClose}
        employee={modalState.employee}
      />

      {/* Create/Edit Mode: Form Modal */}
      {modalState.mode !== 'view' && (
        <FormModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          title={
            modalState.mode === 'create' ? 'Thêm nhân viên mới' :
            modalState.mode === 'edit' ? 'Chỉnh sửa nhân viên' :
            'Chi tiết nhân viên'
          }
          onSubmit={form.handleSubmit}
          onCancel={handleModalClose}
          submitLabel={
            modalState.mode === 'create' ? 'Thêm mới' :
            modalState.mode === 'edit' ? 'Cập nhật' :
            undefined
          }
          cancelLabel={'Hủy'}
          isSubmitting={form.isSubmitting}
          maxWidth="near-full"
        >
          {form.submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {form.submitError}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...form.register('full_name')}
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                    placeholder="Nhập họ và tên"
                  />
                  {form.formState.errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...form.register('email')}
                    type="email"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                    placeholder="email@example.com"
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    {...form.register('phone')}
                    type="tel"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                    placeholder="0901234567"
                  />
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    {...form.register('status')}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                  >
                    {Object.entries(EMPLOYEE_STATUSES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.status && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.status.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                  <select
                    {...form.register('position')}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                  >
                    <option value="">Chọn vị trí</option>
                    {positionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.position && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.position.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                  <select
                    {...form.register('department')}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                  >
                    <option value="">Chọn phòng ban</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.department && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.department.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional fields can be added here following the same pattern */}
          </div>
        </FormModal>
      )}
    </div>
  );
}
