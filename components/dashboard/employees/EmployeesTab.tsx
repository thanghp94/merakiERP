import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import WorkScheduleModal from './WorkScheduleModal';
import { Employee } from '../shared/types';
import { formatDate, getStatusBadge } from '../shared/utils';
import { 
  DataTable, 
  TableColumn, 
  TableAction, 
  FilterBar, 
  FilterConfig, 
  FormModal, 
  FormGrid, 
  FormField,
  PositionSelector,
  DepartmentSelector,
  NationalitySelector
} from '../shared';
import { useFormWithValidation, commonSchemas, createFormData } from '../../../lib/hooks/useFormWithValidation';

interface EmployeesTabProps {
  showEmployeeForm: boolean;
  setShowEmployeeForm: (show: boolean) => void;
  employees: Employee[];
  isLoadingEmployees: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

// Employee form validation schema
const employeeSchema = z.object({
  full_name: commonSchemas.requiredString('Họ tên'),
  position: commonSchemas.requiredString('Chức vụ'),
  department: commonSchemas.requiredString('Phòng ban'),
  status: z.enum(['active', 'inactive', 'on_leave', 'suspended']),
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  address: commonSchemas.optionalString,
  date_of_birth: commonSchemas.date,
  hire_date: commonSchemas.date,
  salary: z.string().optional(),
  qualifications: commonSchemas.optionalString,
  nationality: commonSchemas.optionalString,
  customNationality: commonSchemas.optionalString,
  notes: commonSchemas.optionalString,
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeesTab({
  showEmployeeForm,
  setShowEmployeeForm,
  employees,
  isLoadingEmployees,
  handleFormSubmit
}: EmployeesTabProps) {
  const [workScheduleModal, setWorkScheduleModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null
  });

  // Filter state
  const [filters, setFilters] = useState({
    facility: 'all',
    department: 'all',
    position: 'all',
    nationality: 'all',
    status: 'all'
  });

  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(employees);
  const [showCustomNationality, setShowCustomNationality] = useState(false);

  // Use the new form hook
  const form = useFormWithValidation<EmployeeFormData>({
    schema: employeeSchema,
    defaultValues: {
      full_name: '',
      position: '',
      department: '',
      status: 'active',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      hire_date: '',
      salary: '',
      qualifications: '',
      nationality: '',
      customNationality: '',
      notes: '',
    },
    onSubmit: async (data) => {
      const submitData = createFormData(data, [
        'email', 'phone', 'address', 'date_of_birth', 'hire_date', 
        'salary', 'qualifications', 'nationality', 'notes'
      ]);

      // Handle custom nationality
      if (showCustomNationality && data.customNationality) {
        submitData.data.nationality = data.customNationality;
      }

      // Convert salary to number
      if (data.salary) {
        submitData.data.salary = parseFloat(data.salary);
      }

      await handleFormSubmit(submitData, 'Employee');
      setShowEmployeeForm(false);
      setShowCustomNationality(false);
    },
    onSuccess: () => {
      form.resetForm();
    }
  });

  // Apply filters when employees or filters change
  useEffect(() => {
    let filtered = employees;

    if (filters.facility !== 'all') {
      filtered = filtered.filter(emp => (emp.data as any)?.facility === filters.facility);
    }

    if (filters.department !== 'all') {
      filtered = filtered.filter(emp => emp.department === filters.department);
    }

    if (filters.position !== 'all') {
      filtered = filtered.filter(emp => emp.position === filters.position);
    }

    if (filters.nationality !== 'all') {
      filtered = filtered.filter(emp => (emp.data as any)?.nationality === filters.nationality);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(emp => emp.status === filters.status);
    }

    setFilteredEmployees(filtered);
  }, [employees, filters]);

  // Extract unique values for filter options
  const getFilterOptions = () => {
    const facilities = Array.from(new Set(employees.map(emp => (emp.data as any)?.facility).filter(Boolean)));
    const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)));
    const positions = Array.from(new Set(employees.map(emp => emp.position).filter(Boolean)));
    const nationalities = Array.from(new Set(employees.map(emp => (emp.data as any)?.nationality).filter(Boolean)));
    const statuses = Array.from(new Set(employees.map(emp => emp.status).filter(Boolean)));

    return {
      facilities,
      departments,
      positions,
      nationalities,
      statuses
    };
  };

  const filterOptions = getFilterOptions();

  // Filter configuration
  const getFilterConfig = (): FilterConfig[] => {
    return [
      {
        key: 'facility',
        label: 'Cơ sở',
        options: [
          { value: 'all', label: 'Tất cả cơ sở' },
          ...filterOptions.facilities.map(facility => ({
            value: facility,
            label: facility
          }))
        ]
      },
      {
        key: 'department',
        label: 'Bộ phận',
        options: [
          { value: 'all', label: 'Tất cả bộ phận' },
          ...filterOptions.departments.map(dept => ({
            value: dept,
            label: dept
          }))
        ]
      },
      {
        key: 'position',
        label: 'Chức vụ',
        options: [
          { value: 'all', label: 'Tất cả chức vụ' },
          ...filterOptions.positions.map(pos => ({
            value: pos,
            label: pos
          }))
        ]
      },
      {
        key: 'nationality',
        label: 'Quốc tịch',
        options: [
          { value: 'all', label: 'Tất cả quốc tịch' },
          ...filterOptions.nationalities.map(nat => ({
            value: nat,
            label: nat
          }))
        ]
      },
      {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { value: 'all', label: 'Tất cả trạng thái' },
          ...filterOptions.statuses.map(status => ({
            value: status,
            label: status
          }))
        ]
      }
    ];
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      facility: 'all',
      department: 'all',
      position: 'all',
      nationality: 'all',
      status: 'all'
    });
  };

  const handleOpenWorkSchedule = (employee: Employee) => {
    setWorkScheduleModal({
      isOpen: true,
      employee
    });
  };

  const handleCloseWorkSchedule = () => {
    setWorkScheduleModal({
      isOpen: false,
      employee: null
    });
  };

  const handleModalCancel = () => {
    form.resetForm();
    setShowCustomNationality(false);
    setShowEmployeeForm(false);
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
            {row.data?.qualifications && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {row.data.qualifications}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'position',
        label: 'Chức vụ',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {value || '-'}
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
        key: 'email',
        label: 'Email',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.email || '-'}
          </div>
        )
      },
      {
        key: 'phone',
        label: 'Điện thoại',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.phone || '-'}
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
        render: (value) => getStatusBadge(value)
      }
    ];
  };

  // Create table actions configuration
  const getTableActions = (): TableAction<Employee>[] => {
    return [
      {
        label: 'Lịch làm việc',
        icon: '📅',
        onClick: (employee) => handleOpenWorkSchedule(employee),
        variant: 'primary'
      }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
          {/* Filter Bar */}
        <FilterBar
          filters={filters}
          filterConfigs={getFilterConfig()}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          actionButton={{
            label: 'Thêm nhân viên',
            icon: '➕',
            onClick: () => setShowEmployeeForm(true),
            variant: 'primary'
          }}
          isLoading={isLoadingEmployees}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Danh sách nhân viên ({filteredEmployees.length})
            </h3>
          </div>
          
          <DataTable
            data={filteredEmployees}
            columns={getTableColumns()}
            actions={getTableActions()}
            isLoading={isLoadingEmployees}
            emptyState={{
              icon: (
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              ),
              title: 'Không có nhân viên nào',
              description: 'Chưa có nhân viên nào được tạo.'
            }}
            className="border-0 shadow-none"
          />
        </div>
      </div>

      {/* Employee Form Modal */}
      <FormModal
        isOpen={showEmployeeForm}
        onClose={() => setShowEmployeeForm(false)}
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
          <FormGrid columns={4} gap="md">
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

            <FormField label="Chức vụ" required>
              <PositionSelector
                {...form.register('position')}
                value={form.watch('position')}
                onChange={(value) => form.setValue('position', value)}
                required
              />
              {form.formState.errors.position && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.position.message}</p>
              )}
            </FormField>

            <FormField label="Phòng ban" required>
              <DepartmentSelector
                {...form.register('department')}
                value={form.watch('department')}
                onChange={(value) => form.setValue('department', value)}
                required
              />
              {form.formState.errors.department && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.department.message}</p>
              )}
            </FormField>

            <FormField label="Trạng thái">
              <select
                {...form.register('status')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="active">Đang làm việc</option>
                <option value="inactive">Nghỉ việc</option>
                <option value="on_leave">Nghỉ phép</option>
                <option value="suspended">Tạm nghỉ</option>
              </select>
            </FormField>
          </FormGrid>
        </div>

        {/* Contact Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin liên hệ</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2">
              <FormField label="Email">
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
            </div>

            <div className="col-span-2">
              <FormField label="Số điện thoại">
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
            </div>

            <div className="col-span-6">
              <FormField label="Địa chỉ">
                <textarea
                  {...form.register('address')}
                  rows={1}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Nhập địa chỉ"
                />
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField label="Quốc tịch">
                <NationalitySelector
                  value={form.watch('nationality') || ''}
                  onChange={(value) => {
                    form.setValue('nationality', value);
                    setShowCustomNationality(value === 'other');
                  }}
                  showCustomInput={showCustomNationality}
                  customValue={form.watch('customNationality') || ''}
                  onCustomChange={(value) => form.setValue('customNationality', value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin công việc</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Ngày sinh">
              <input
                {...form.register('date_of_birth')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Ngày vào làm">
              <input
                {...form.register('hire_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Lương (VNĐ)">
              <input
                {...form.register('salary')}
                type="number"
                min="0"
                step="100000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="15000000"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Additional Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormGrid columns={2} gap="md">
            <FormField label="Bằng cấp / Chứng chỉ">
              <textarea
                {...form.register('qualifications')}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Danh sách bằng cấp, chứng chỉ"
              />
            </FormField>

            <FormField label="Ghi chú">
              <textarea
                {...form.register('notes')}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ghi chú thêm về nhân viên"
              />
            </FormField>
          </FormGrid>
        </div>
      </FormModal>

      {/* Work Schedule Modal */}
      <WorkScheduleModal
        isOpen={workScheduleModal.isOpen}
        onClose={handleCloseWorkSchedule}
        employee={workScheduleModal.employee}
        canEdit={true} // Admin can edit work schedules
      />
    </div>
  );
}
