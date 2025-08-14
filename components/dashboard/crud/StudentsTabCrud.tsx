import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { Student } from '../shared/types';
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

interface StudentsTabCrudProps {
  students: Student[];
  isLoading: boolean;
  onSubmit: (data: any, formType: string) => Promise<void>;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onView?: (student: Student) => void;
  onEnroll?: (student: Student) => void;
}

// Student form validation schema
const studentSchema = z.object({
  full_name: commonSchemas.requiredString('Họ tên'),
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']),
  date_of_birth: commonSchemas.date,
  address: commonSchemas.optionalString,
  expected_campus: commonSchemas.optionalString,
  program: commonSchemas.optionalString,
  student_description: commonSchemas.optionalString,
  current_english_level: commonSchemas.optionalString,
  parent_name: commonSchemas.optionalString,
  parent_phone: commonSchemas.optionalString,
  parent_email: commonSchemas.optionalString,
  notes: commonSchemas.optionalString,
});

type StudentFormData = z.infer<typeof studentSchema>;

const STUDENT_STATUSES = {
  active: 'Đang học',
  inactive: 'Tạm nghỉ',
  graduated: 'Đã tốt nghiệp',
  suspended: 'Bị đình chỉ'
};

const ENGLISH_LEVELS = {
  beginner: 'Mới bắt đầu',
  elementary: 'Cơ bản',
  pre_intermediate: 'Trước trung cấp',
  intermediate: 'Trung cấp',
  upper_intermediate: 'Trung cấp cao',
  advanced: 'Nâng cao',
  proficient: 'Thành thạo'
};

const PROGRAMS = {
  general_english: 'Tiếng Anh tổng quát',
  business_english: 'Tiếng Anh thương mại',
  ielts: 'IELTS',
  toefl: 'TOEFL',
  toeic: 'TOEIC',
  kids_english: 'Tiếng Anh trẻ em',
  conversation: 'Giao tiếp',
  other: 'Khác'
};

export default function StudentsTabCrud({
  students,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onEnroll
}: StudentsTabCrudProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    program: 'all',
    english_level: 'all',
    expected_campus: 'all'
  });

  // Use the form validation hook for create
  const form = useFormWithValidation<StudentFormData>({
    schema: studentSchema,
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      status: 'active',
      date_of_birth: '',
      address: '',
      expected_campus: '',
      program: '',
      student_description: '',
      current_english_level: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      notes: '',
    },
    onSubmit: async (data) => {
      const submitData = createFormData(data, [
        'email', 'phone', 'date_of_birth', 'address', 'expected_campus', 
        'program', 'student_description', 'current_english_level', 'notes'
      ]);

      // Add parent information
      if (data.parent_name || data.parent_phone || data.parent_email) {
        submitData.data.parent = {
          name: data.parent_name || '',
          phone: data.parent_phone || '',
          email: data.parent_email || ''
        };
      }

      await onSubmit(submitData, 'Student');
      setShowCreateModal(false);
    },
    onSuccess: () => {
      form.resetForm();
    }
  });

  // Use the form validation hook for edit
  const editForm = useFormWithValidation<StudentFormData>({
    schema: studentSchema,
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      status: 'active',
      date_of_birth: '',
      address: '',
      expected_campus: '',
      program: '',
      student_description: '',
      current_english_level: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      notes: '',
    },
    onSubmit: async (data) => {
      if (!editingStudent) return;

      const submitData = createFormData(data, [
        'email', 'phone', 'date_of_birth', 'address', 'expected_campus', 
        'program', 'student_description', 'current_english_level', 'notes'
      ]);

      // Add parent information
      if (data.parent_name || data.parent_phone || data.parent_email) {
        submitData.data.parent = {
          name: data.parent_name || '',
          phone: data.parent_phone || '',
          email: data.parent_email || ''
        };
      }

      // Call the API to update the student
      try {
        const response = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });

        const result = await response.json();
        if (result.success) {
          setShowEditModal(false);
          setEditingStudent(null);
          // Refresh the students list by calling onSubmit with empty data
          await onSubmit({}, 'RefreshStudents');
        } else {
          throw new Error(result.message || 'Failed to update student');
        }
      } catch (error) {
        console.error('Error updating student:', error);
        throw error;
      }
    },
    onSuccess: () => {
      editForm.resetForm();
    }
  });

  // Filter students based on selected filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesStatus = filters.status === 'all' || student.status === filters.status;
      const matchesProgram = filters.program === 'all' || student.data?.program === filters.program;
      const matchesLevel = filters.english_level === 'all' || student.data?.current_english_level === filters.english_level;
      const matchesCampus = filters.expected_campus === 'all' || student.data?.expected_campus === filters.expected_campus;

      return matchesStatus && matchesProgram && matchesLevel && matchesCampus;
    });
  }, [students, filters]);

  // Extract unique values for filter options
  const getFilterOptions = () => {
    const statuses = Array.from(new Set(students.map(student => student.status).filter(Boolean)));
    const programs = Array.from(new Set(students.map(student => student.data?.program).filter(Boolean)));
    const levels = Array.from(new Set(students.map(student => student.data?.current_english_level).filter(Boolean)));
    const campuses = Array.from(new Set(students.map(student => student.data?.expected_campus).filter(Boolean)));

    return {
      statuses,
      programs,
      levels,
      campuses
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
      program: 'all',
      english_level: 'all',
      expected_campus: 'all'
    });
  };

  const handleModalCancel = () => {
    form.resetForm();
    setShowCreateModal(false);
  };

  const handleEditModalCancel = () => {
    editForm.resetForm();
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    
    // Populate the edit form with student data
    editForm.resetForm();
    editForm.setValue('full_name', student.full_name || '');
    editForm.setValue('email', student.email || '');
    editForm.setValue('phone', student.phone || '');
    editForm.setValue('status', (student.status as 'active' | 'inactive' | 'graduated' | 'suspended') || 'active');
    editForm.setValue('date_of_birth', student.data?.date_of_birth || '');
    editForm.setValue('address', student.data?.address || '');
    editForm.setValue('expected_campus', student.data?.expected_campus || '');
    editForm.setValue('program', student.data?.program || '');
    editForm.setValue('student_description', student.data?.student_description || '');
    editForm.setValue('current_english_level', student.data?.current_english_level || '');
    editForm.setValue('parent_name', student.data?.parent?.name || '');
    editForm.setValue('parent_phone', student.data?.parent?.phone || '');
    editForm.setValue('parent_email', student.data?.parent?.email || '');
    editForm.setValue('notes', student.data?.notes || '');
    
    setShowEditModal(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${student.full_name}"?`)) {
      try {
        const response = await fetch(`/api/students/${student.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();
        if (result.success) {
          // Refresh the students list
          await onSubmit({}, 'RefreshStudents');
        } else {
          alert('Không thể xóa học sinh: ' + result.message);
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Có lỗi xảy ra khi xóa học sinh');
      }
    }
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
            label: STUDENT_STATUSES[status as keyof typeof STUDENT_STATUSES] || status
          }))
        ]
      },
      {
        key: 'program',
        label: 'Chương trình',
        options: [
          { value: 'all', label: 'Tất cả chương trình' },
          ...filterOptions.programs.filter(Boolean).map(program => ({
            value: program!,
            label: PROGRAMS[program as keyof typeof PROGRAMS] || program!
          }))
        ]
      },
      {
        key: 'english_level',
        label: 'Trình độ tiếng Anh',
        options: [
          { value: 'all', label: 'Tất cả trình độ' },
          ...filterOptions.levels.filter(Boolean).map(level => ({
            value: level!,
            label: ENGLISH_LEVELS[level as keyof typeof ENGLISH_LEVELS] || level!
          }))
        ]
      },
      {
        key: 'expected_campus',
        label: 'Cơ sở mong muốn',
        options: [
          { value: 'all', label: 'Tất cả cơ sở' },
          ...filterOptions.campuses.filter(Boolean).map(campus => ({
            value: campus!,
            label: campus!
          }))
        ]
      }
    ];
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<Student>[] => {
    return [
      {
        key: 'full_name',
        label: 'Họ và tên',
        render: (value, row) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {row.data?.current_english_level && (
              <div className="text-sm text-gray-500">
                {ENGLISH_LEVELS[row.data.current_english_level as keyof typeof ENGLISH_LEVELS] || row.data.current_english_level}
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
            {row.email && (
              <div className="text-sm text-gray-900">{row.email}</div>
            )}
            {row.phone && (
              <div className="text-sm text-gray-500">{row.phone}</div>
            )}
          </div>
        )
      },
      {
        key: 'program',
        label: 'Chương trình',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.program ? 
              PROGRAMS[row.data.program as keyof typeof PROGRAMS] || row.data.program 
              : '-'
            }
          </div>
        )
      },
      {
        key: 'parent',
        label: 'Phụ huynh',
        render: (value, row) => (
          <div>
            {row.data?.parent?.name && (
              <div className="text-sm font-medium text-gray-900">{row.data.parent.name}</div>
            )}
            {row.data?.parent?.phone && (
              <div className="text-sm text-gray-500">{row.data.parent.phone}</div>
            )}
          </div>
        )
      },
      {
        key: 'expected_campus',
        label: 'Cơ sở mong muốn',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.expected_campus || '-'}
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
            graduated: 'bg-blue-100 text-blue-800',
            suspended: 'bg-red-100 text-red-800'
          };
          
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
              {STUDENT_STATUSES[value as keyof typeof STUDENT_STATUSES] || value}
            </span>
          );
        }
      }
    ];
  };

  // Create table actions configuration
  const getTableActions = (): TableAction<Student>[] => {
    const actions: TableAction<Student>[] = [];
    
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
    
    // Always add edit action
    actions.push({
      label: 'Sửa',
      icon: '✏️',
      onClick: handleEditStudent,
      variant: 'primary',
      iconOnly: true,
      tooltip: 'Chỉnh sửa'
    });

    if (onEnroll) {
      actions.push({
        label: 'Ghi danh',
        icon: '📝',
        onClick: onEnroll,
        variant: 'primary',
        iconOnly: true,
        tooltip: 'Ghi danh vào lớp'
      });
    }
    
    // Always add delete action
    actions.push({
      label: 'Xóa',
      icon: '🗑️',
      onClick: handleDeleteStudent,
      variant: 'danger',
      iconOnly: true,
      tooltip: 'Xóa'
    });
    
    return actions;
  };

  return (
    <div className="space-y-6">
      <CrudTable
        data={filteredStudents}
        columns={getTableColumns()}
        isLoading={isLoading}
        filters={filters}
        filterConfigs={getFilterConfig()}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onView={onView}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        customActions={getTableActions()}
        title="Danh sách học sinh"
        createButtonLabel="Thêm học sinh"
        onCreateClick={() => setShowCreateModal(true)}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          title: 'Không có học sinh nào',
          description: 'Chưa có học sinh nào được tạo.'
        }}
      />

      {/* Create Student Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm học sinh mới"
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

            <FormField label="Ngày sinh">
              <input
                {...form.register('date_of_birth')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Trạng thái">
              <select
                {...form.register('status')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.entries(STUDENT_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Địa chỉ" className="md:col-span-3">
              <textarea
                {...form.register('address')}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập địa chỉ"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Academic Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin học tập</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Chương trình mong muốn">
              <select
                {...form.register('program')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn chương trình</option>
                {Object.entries(PROGRAMS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Trình độ tiếng Anh hiện tại">
              <select
                {...form.register('current_english_level')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn trình độ</option>
                {Object.entries(ENGLISH_LEVELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Cơ sở mong muốn">
              <input
                {...form.register('expected_campus')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên cơ sở"
              />
            </FormField>

            <FormField label="Mô tả học sinh" className="md:col-span-3">
              <textarea
                {...form.register('student_description')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả về học sinh, mục tiêu học tập, v.v."
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Parent Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin phụ huynh</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Tên phụ huynh">
              <input
                {...form.register('parent_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Họ tên phụ huynh"
              />
            </FormField>

            <FormField label="Số điện thoại phụ huynh">
              <input
                {...form.register('parent_phone')}
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
            </FormField>

            <FormField label="Email phụ huynh">
              <input
                {...form.register('parent_email')}
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="email@example.com"
              />
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
              placeholder="Ghi chú thêm về học sinh"
            />
          </FormField>
        </div>
      </FormModal>

      {/* Edit Student Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Chỉnh sửa học sinh: ${editingStudent?.full_name}`}
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
            </FormField>

            <FormField label="Email">
              <input
                {...editForm.register('email')}
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="email@example.com"
              />
              {editForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.email.message}</p>
              )}
            </FormField>

            <FormField label="Số điện thoại">
              <input
                {...editForm.register('phone')}
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
              {editForm.formState.errors.phone && (
                <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.phone.message}</p>
              )}
            </FormField>

            <FormField label="Ngày sinh">
              <input
                {...editForm.register('date_of_birth')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Trạng thái">
              <select
                {...editForm.register('status')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.entries(STUDENT_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Địa chỉ" className="md:col-span-3">
              <textarea
                {...editForm.register('address')}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập địa chỉ"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Academic Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin học tập</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Chương trình mong muốn">
              <select
                {...editForm.register('program')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn chương trình</option>
                {Object.entries(PROGRAMS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Trình độ tiếng Anh hiện tại">
              <select
                {...editForm.register('current_english_level')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn trình độ</option>
                {Object.entries(ENGLISH_LEVELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Cơ sở mong muốn">
              <input
                {...editForm.register('expected_campus')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên cơ sở"
              />
            </FormField>

            <FormField label="Mô tả học sinh" className="md:col-span-3">
              <textarea
                {...editForm.register('student_description')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả về học sinh, mục tiêu học tập, v.v."
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Parent Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin phụ huynh</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Tên phụ huynh">
              <input
                {...editForm.register('parent_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Họ tên phụ huynh"
              />
            </FormField>

            <FormField label="Số điện thoại phụ huynh">
              <input
                {...editForm.register('parent_phone')}
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
            </FormField>

            <FormField label="Email phụ huynh">
              <input
                {...editForm.register('parent_email')}
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="email@example.com"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Additional Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormField label="Ghi chú">
            <textarea
              {...editForm.register('notes')}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ghi chú thêm về học sinh"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
