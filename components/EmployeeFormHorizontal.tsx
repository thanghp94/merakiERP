import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { 
  FormModal, 
  FormGrid, 
  FormField 
} from './dashboard/shared';
import FileUpload from './dashboard/shared/FileUpload';
import { useFormWithValidation, commonSchemas, createFormData } from '../lib/hooks/useFormWithValidation';

interface EmployeeFormHorizontalProps {
  onSubmit: (employeeData: any) => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
  isOpen?: boolean;
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

const EmployeeFormHorizontal: React.FC<EmployeeFormHorizontalProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isEditing = false,
  isOpen = true
}) => {
  // State for enum values
  const [positionOptions, setPositionOptions] = useState<Array<{value: string, label: string}>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{value: string, label: string}>>([]);
  const [isLoadingEnums, setIsLoadingEnums] = useState(false);
  const [showCustomNationality, setShowCustomNationality] = useState(false);

  // Avatar file state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
      } else {
        // Fallback to hardcoded values
        setPositionOptions(Object.entries(POSITIONS).map(([value, label]) => ({ value, label })));
      }

      if (departmentResult.success && departmentResult.data) {
        setDepartmentOptions(departmentResult.data);
      } else {
        // Fallback to hardcoded values
        setDepartmentOptions(Object.entries(DEPARTMENTS).map(([value, label]) => ({ value, label })));
      }
    } catch (error) {
      console.error('Error fetching enum values:', error);
      // Fallback to hardcoded values
      setPositionOptions(Object.entries(POSITIONS).map(([value, label]) => ({ value, label })));
      setDepartmentOptions(Object.entries(DEPARTMENTS).map(([value, label]) => ({ value, label })));
    } finally {
      setIsLoadingEnums(false);
    }
  };

  // Use the form validation hook
  const form = useFormWithValidation<EmployeeFormData>({
    schema: employeeSchema,
    defaultValues: {
      full_name: initialData.full_name || '',
      email: initialData.data?.email || '',
      phone: initialData.data?.phone || '',
      address: initialData.data?.address || '',
      status: (initialData.status as 'active' | 'inactive' | 'terminated') || 'active',
      position: initialData.position || '',
      department: initialData.department || '',
      hire_date: initialData.data?.hire_date || '',
      id_number: initialData.data?.id_number || '',
      id_issue_date: initialData.data?.id_issue_date || '',
      id_expiry_date: initialData.data?.id_expiry_date || '',
      avatar: initialData.data?.avatar || '',
      experience: initialData.data?.experience || '',
      qualifications: initialData.data?.qualifications || '',
      date_of_birth: initialData.data?.date_of_birth || '',
      nationality: initialData.data?.nationality || '',
      customNationality: '',
      notes: initialData.data?.notes || '',
    },
    onSubmit: async (data) => {
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

      // Add the ID for editing
      if (isEditing && initialData.id) {
        submitData.id = initialData.id;
      }

      await onSubmit(submitData);
    },
    onSuccess: () => {
      if (!isEditing) {
        form.resetForm();
        setShowCustomNationality(false);
        setAvatarFile(null);
      }
    }
  });

  const handleModalCancel = () => {
    form.resetForm();
    setShowCustomNationality(false);
    setAvatarFile(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onCancel || (() => {})}
      title={isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
      onSubmit={form.handleSubmit}
      onCancel={handleModalCancel}
      submitLabel={form.isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
      cancelLabel="Hủy"
      isSubmitting={form.isSubmitting}
      maxWidth="near-full"
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

          <FormField label="Địa chỉ" className="md:col-span-3">
            <textarea
              {...form.register('address')}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập địa chỉ"
            />
          </FormField>
        </FormGrid>
      </div>

      {/* Employment Information */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin công việc</h3>
        <FormGrid columns={4} gap="md">
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

          <FormField label="Avatar" className="md:col-span-2">
            <FileUpload
              label="Chọn ảnh đại diện"
              accept="image/*"
              maxSize={5}
              onFileSelect={setAvatarFile}
              currentFile={initialData?.data?.avatar}
              error={form.formState.errors.avatar?.message}
            />
          </FormField>

          <FormField label="Kinh nghiệm" className="md:col-span-4">
            <textarea
              {...form.register('experience')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Mô tả kinh nghiệm làm việc"
            />
          </FormField>

          <FormField label="Bằng cấp" className="md:col-span-4">
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

          <FormField label="Quốc tịch" className="md:col-span-2">
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
  );
};

export default EmployeeFormHorizontal;
