import React from 'react';
import { z } from 'zod';
import { 
  FormGrid, 
  FormField,
  NationalitySelector
} from '../shared';
import { useFormWithValidation, commonSchemas } from '../../../lib/hooks/useFormWithValidation';
import { usePositions, useDepartments } from '../../../lib/hooks/useApiData';

interface EmployeeFormProps {
  onSubmit: (employeeData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

// Employee validation schema
const employeeSchema = z.object({
  full_name: commonSchemas.requiredString('Họ và tên'),
  position: commonSchemas.requiredString('Chức vụ'),
  department: commonSchemas.requiredString('Phòng ban'),
  status: z.enum(['active', 'inactive', 'on_leave', 'suspended']),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: commonSchemas.optionalString,
  address: commonSchemas.optionalString,
  date_of_birth: commonSchemas.optionalString,
  hire_date: commonSchemas.optionalString,
  salary: z.string().optional(),
  qualifications: commonSchemas.optionalString,
  nationality: commonSchemas.optionalString,
  notes: commonSchemas.optionalString,
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false 
}) => {
  // Use API data hooks
  const { data: positions, isLoading: isLoadingPositions } = usePositions();
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();

  // Use the form validation hook
  const form = useFormWithValidation<EmployeeFormData>({
    schema: employeeSchema,
    defaultValues: {
      full_name: initialData.full_name || '',
      position: initialData.position || '',
      department: initialData.department || '',
      status: (initialData.status as any) || 'active',
      email: initialData.data?.email || '',
      phone: initialData.data?.phone || '',
      address: initialData.data?.address || '',
      date_of_birth: initialData.data?.date_of_birth || '',
      hire_date: initialData.data?.hire_date || '',
      salary: initialData.data?.salary?.toString() || '',
      qualifications: initialData.data?.qualifications || '',
      nationality: initialData.data?.nationality || '',
      notes: initialData.data?.notes || '',
    },
    onSubmit: async (data) => {
      const submitData = {
        full_name: data.full_name,
        position: data.position,
        department: data.department,
        status: data.status,
        data: {
          email: data.email,
          phone: data.phone,
          address: data.address,
          date_of_birth: data.date_of_birth,
          hire_date: data.hire_date,
          salary: data.salary ? parseFloat(data.salary) : null,
          qualifications: data.qualifications,
          nationality: data.nationality,
          notes: data.notes
        }
      };

      await onSubmit(submitData);
    },
    onSuccess: () => {
      if (!isEditing) {
        form.resetForm();
      }
    }
  });

  const statusOptions = [
    { value: 'active', label: 'Đang làm việc' },
    { value: 'inactive', label: 'Nghỉ việc' },
    { value: 'on_leave', label: 'Nghỉ phép' },
    { value: 'suspended', label: 'Tạm nghỉ' }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
      </h2>
      
      <form onSubmit={form.handleSubmit} className="space-y-6">
        {form.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {form.submitError}
          </div>
        )}

        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
          
          <FormGrid columns={2} gap="md">
            <FormField label="Họ và tên" required>
              <input
                {...form.register('full_name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập họ và tên"
              />
              {form.formState.errors.full_name && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.full_name.message}</p>
              )}
            </FormField>

            <FormField label="Trạng thái">
              <select
                {...form.register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </FormGrid>

          <FormGrid columns={2} gap="md" className="mt-4">
            <FormField label="Chức vụ" required>
              <select
                {...form.register('position')}
                disabled={isLoadingPositions}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingPositions ? 'Đang tải...' : 'Chọn chức vụ'}
                </option>
                {positions.map((position) => (
                  <option key={position.value} value={position.value}>
                    {position.label}
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
                disabled={isLoadingDepartments}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingDepartments ? 'Đang tải...' : 'Chọn phòng ban'}
                </option>
                {departments.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.department && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.department.message}</p>
              )}
            </FormField>
          </FormGrid>
        </div>

        {/* Contact Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên hệ</h3>
          
          <FormGrid columns={2} gap="md">
            <FormField label="Email">
              <input
                {...form.register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </FormField>

            <FormField label="Số điện thoại">
              <input
                {...form.register('phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0901234567"
              />
            </FormField>
          </FormGrid>

          <FormGrid columns={2} gap="md" className="mt-4">
            <FormField label="Quốc tịch">
              <NationalitySelector
                value={form.watch('nationality') || ''}
                onChange={(value) => form.setValue('nationality', value)}
              />
            </FormField>
            
            <div></div> {/* Empty div for grid alignment */}
          </FormGrid>

          <div className="mt-4">
            <FormField label="Địa chỉ">
              <textarea
                {...form.register('address')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập địa chỉ"
              />
            </FormField>
          </div>
        </div>

        {/* Employment Details */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin công việc</h3>
          
          <FormGrid columns={3} gap="md">
            <FormField label="Ngày sinh">
              <input
                {...form.register('date_of_birth')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Ngày vào làm">
              <input
                {...form.register('hire_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Lương (VNĐ)">
              <input
                {...form.register('salary')}
                type="number"
                min="0"
                step="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="15000000"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin bổ sung</h3>
          
          <div className="space-y-4">
            <FormField label="Bằng cấp / Chứng chỉ">
              <textarea
                {...form.register('qualifications')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Danh sách bằng cấp, chứng chỉ"
              />
            </FormField>

            <FormField label="Ghi chú">
              <textarea
                {...form.register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ghi chú thêm về nhân viên"
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={form.isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
                form.resetForm();
              }
            }}
          >
            {isEditing ? 'Hủy' : 'Xóa form'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
