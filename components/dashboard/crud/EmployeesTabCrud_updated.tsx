import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { Employee } from '../shared/types';
import { formatDate, getStatusBadge } from '../shared/utils';
import { 
  CrudTable, 
  TableColumn, 
  TableAction, 
  FilterConfig, 
  FormModal, 
  FormGrid, 
  FormField 
} from '../shared';
import { useFormWithValidation, commonSchemas, createFormData } from '../../../lib/hooks/useFormWithValidation';

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

export default function EmployeesTabCrud({
  employees,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onWorkSchedule
}: EmployeesTabCrudProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // State for enum values
  const [positionOptions, setPositionOptions] = useState<Array<{value: string, label: string}>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{value: string, label: string}>>([]);
  const [isLoadingEnums, setIsLoadingEnums] = useState(false);
  const [showCustomNationality, setShowCustomNationality] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    position: 'all',
    department: 'all'
  });

  // Fetch enum values on component mount
  useEffect(() => {
    fetchEnumValues();
  }, []);

  const fetchEnumValues = async () => {
    setIsLoadingEnums(true);
    try {
      const [positionResponse, departmentResponse] = await Promise.all([
        fetch('/api/metadata/enums?type=position'),
        fetch('/api/metadata/enums?type=department')
      ]);

      const [positionResult, departmentResult] = await Promise.all([
        positionResponse.json(),
        departmentResponse.json()
      ]);

      if (positionResult.success && positionResult.data) {
        setPositionOptions(positionResult.data);
      }

      if (departmentResult.success && departmentResult.data) {
        setDepartmentOptions(departmentResult.data);
      }
    } catch (error) {
      console.error('Error fetching enum values:', error);
    } finally {
      setIsLoadingEnums(false);
    }
  };

  // Use the form validation hook for creating
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
      const submitData = createFormData(data, [
        'email', 'phone', 'address', 'hire_date', 'id_number', 'id_issue_date', 'id_expiry_date', 'avatar', 'experience', 'qualifications', 'date_of_birth', 'nationality', 'notes'
      ]);

      // Handle custom nationality
      if (data.nationality === 'other' && data.customNationality) {
        submitData.data.nationality = data.customNationality;
      }

      await onSubmit(submitData, 'Employee');
      setShowCreateModal(false);
    },
    onSuccess: () => {
      form.resetForm();
      setShowCustomNationality(false);
    }
  });

  // Use the form validation hook for editing
  const editForm = useFormWithValidation<EmployeeFormData>({
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
      if (!editingEmployee) return;

      const submitData = createFormData(data, [
        'email', 'phone', 'address', 'hire_date', 'id_number', 'id_issue_date', 'id_expiry_date', 'avatar', 'experience', 'qualifications', 'date_of_birth', 'nationality', 'notes'
      ]);

      // Handle custom nationality
      if (data.nationality === 'other' && data.customNationality) {
        submitData.data.nationality = data.customNationality;
      }

      // Add the ID for editing
      submitData.id = editingEmployee.id;

      await onSubmit(submitData, 'Employee');
      setShowEditModal(false);
      setEditingEmployee(null);
    },
    onSuccess: () => {
      editForm.resetForm();
      setShowCustomNationality(false);
    }
  });

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

  const handleModalCancel = () => {
    form.resetForm();
    setShowCreateModal(false);
    setShowCustomNationality(false);
  };

  const handleEditModalCancel = () => {
    editForm.resetForm();
    setShowEditModal(false);
    setEditingEmployee(null);
    setShowCustomNationality(false);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    
    // Populate the edit form with employee data
    editForm.setValue('full_name', employee.full_name);
    editForm.setValue('email', employee.data?.email || '');
    editForm.setValue('phone', employee.data?.phone || '');
    editForm.setValue('address', employee.data?.address || '');
    editForm.setValue('status', employee.status as 'active' | 'inactive' | 'terminated');
    editForm.setValue('position', employee.position || '');
    editForm.setValue('department', employee.department || '');
    editForm.setValue('hire_date', employee.data?.hire_date || '');
    editForm.setValue('id_number', employee.data?.id_number || '');
    editForm.setValue('id_issue_date', employee.data?.id_issue_date || '');
    editForm.setValue('id_expiry_date', employee.data?.id_expiry_date || '');
    editForm.setValue('avatar', employee.data?.avatar || '');
    editForm.setValue('experience', employee.data?.experience || '');
    editForm.setValue('qualifications', employee.data?.qualifications || '');
    editForm.setValue('date_of_birth', employee.data?.date_of_birth || '');
    editForm.setValue('nationality', employee.data?.nationality || '');
    editForm.setValue('notes', employee.data?.notes || '');
    
    setShowEditModal(true);
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
        label: 'Chức vụ',
        options: [
          { value: 'all', label: 'Tất cả chức vụ' },
          ...filterOptions.positions.filter(Boolean).map(position => ({
            value: position!,
            label: POSITIONS[position as keyof typeof POSITIONS] || position!
          }))
        ]
      },
      {
        key: 'department',
        label: 'Phòng ban',
        options: [
          { value: 'all', label: 'Tất cả phòng ban' },
          ...filterOptions.departments.filter(Boolean).map(department => ({
            value: department!,
            label: DEPARTMENTS[department as keyof typeof DEPARTMENTS] || department!
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
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {row.position && (
              <div className="text-sm text-gray-500">
                {POSITIONS[row.position as keyof typeof POSITIONS] || row.position}
              </div>
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
            {value ? DEPARTMENTS[value as keyof typeof DEPARTMENTS] || value : '-'}
          </div>
        )
      },
      {
        key: 'hire_date',
        label: 'Ngày vào làm',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.hire_date ? formatDate(row.data.hire_date) : '-'}
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

  // Create table actions configuration
  const getTableActions = (): TableAction<Employee>[] => {
    const actions: TableAction<Employee>[] = [];
    
    if (onView) {
      actions.push({
        label: 'Xem',
        icon: '👁️',
        onClick: onView,
        variant: 'secondary',
        iconOnly: true,
        tooltip: 'Xem chi tiết'
      });
    }
    
    // Use local edit handler instead of prop
    actions.push({
      label: 'Sửa',
      icon: '✏️',
      onClick: handleEditEmployee,
      variant: 'primary',
      iconOnly: true,
      tooltip: 'Chỉnh sửa'
    });
    
    if (onDelete) {
      actions.push({
        label: 'Xóa',
        icon: '🗑️',
        onClick: onDelete,
        variant: 'danger',
        iconOnly: true,
        tooltip: 'Xóa'
      });
    }
    
    return actions;
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
        customActions={getTableActions()}
        title="Danh sách nhân viên"
        createButtonLabel="Thêm nhân viên"
        onCreateClick={() => setShowCreateModal(true)}
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

      {/* Create Employee Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm nhân viên mới"
        onSubmit={form.handleSubmit}
        onCancel={handleModalCancel}
        submitLabel="Thêm mới"
        cancelLabel="Hủy"
        isSubmitting={form.isSubmitting}
        maxWidth="6xl"
      >
        {form.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {form.submitError}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Họ và tên" required>
              <input
                {...form.register('full_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
              {form.formState.errors.phone && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </FormField>

            <FormField label="Địa chỉ" className="md:col-span-3">
              <textarea
                {...form.register('address')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập địa chỉ"
              />
            </FormField>

            <FormField label="Chức vụ" required>
              <select
                {...form.register('position')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isLoadingEnums}
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isLoadingEnums}
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.entries(EMPLOYEE_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
          </FormGrid>
        </div>

        {/* Employment Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin công việc</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Ngày vào làm">
              <input
                {...form.register('hire_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="CMND/Passport">
              <input
                {...form.register('id_number')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Số CMND/Passport"
              />
            </FormField>

            <FormField label="Ngày cấp">
              <input
                {...form.register('id_issue_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Ngày hết hạn">
              <input
                {...form.register('id_expiry_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Avatar">
              <input
                {...form.register('avatar')}
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Kinh nghiệm" className="md:col-span-3">
              <textarea
                {...form.register('experience')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả kinh nghiệm làm việc"
              />
            </FormField>

            <FormField label="Bằng cấp" className="md:col-span-3">
              <textarea
                {...form.register('qualifications')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả bằng cấp, chứng chỉ"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Personal Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cá nhân</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Ngày sinh">
              <input
                {...form.register('date_of_birth')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Quốc tịch">
              <select
                {...form.register('nationality')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mt-2"
                  placeholder="Nhập quốc tịch khác"
                />
              )}
            </FormField>
          </FormGrid>
        </div>

        {/* Additional Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormField label="Ghi chú">
            <textarea
              {...form.register('notes')}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ghi chú thêm về nhân viên"
            />
          </FormField>
        </div>
      </FormModal>

      {/* Edit Employee Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Chỉnh sửa nhân viên"
        onSubmit={editForm.handleSubmit}
        onCancel={handleEditModalCancel}
        submitLabel="Cập nhật"
        cancelLabel="Hủy"
        isSubmitting={editForm.isSubmitting}
        maxWidth="6xl"
      >
        {editForm.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {editForm.submitError}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Họ và tên" required>
              <input
                {...editForm.register('full_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập họ và tên"
              />
              {editForm.formState.errors.full_name && (
                <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.full_name.message}</p>
              )}
