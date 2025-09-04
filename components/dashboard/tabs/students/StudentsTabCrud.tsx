import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { Student } from '../../shared/types';
import { formatDate, getStatusBadge } from '../../shared/utils';
import {
  CrudTable,
  TableColumn,
  TableAction,
  FilterConfig,
  FormModal,
  FormGrid,
  FormField
} from '../../shared';
import { useFormWithValidation, commonSchemas, createFormData } from '../../../../lib/hooks/useFormWithValidation';
import { useEscapeKey } from '../../../../lib/hooks/useEscapeKey';
import InvoiceDetailDrawer from '../invoices/InvoiceDetailDrawer';

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

// Student form fields configuration
interface StudentFormFieldConfig {
  name: keyof StudentFormData;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  section: 'basic' | 'academic' | 'parent' | 'additional';
  rows?: number;
}

const studentFormFields: StudentFormFieldConfig[] = [
  // Basic Information
  {
    name: 'full_name',
    label: 'Họ và tên',
    type: 'text',
    required: true,
    placeholder: 'Nhập họ và tên',
    section: 'basic'
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'email@example.com',
    section: 'basic'
  },
  {
    name: 'phone',
    label: 'Số điện thoại',
    type: 'tel',
    placeholder: '0901234567',
    section: 'basic'
  },
  {
    name: 'date_of_birth',
    label: 'Ngày sinh',
    type: 'date',
    section: 'basic'
  },
  {
    name: 'status',
    label: 'Trạng thái',
    type: 'select',
    options: Object.entries(STUDENT_STATUSES).map(([value, label]) => ({ value, label })),
    section: 'basic'
  },
  {
    name: 'address',
    label: 'Địa chỉ',
    type: 'textarea',
    placeholder: 'Nhập địa chỉ',
    rows: 1,
    section: 'basic'
  },
  // Academic Information
  {
    name: 'program',
    label: 'Chương trình mong muốn',
    type: 'select',
    options: [
      { value: '', label: 'Chọn chương trình' },
      ...Object.entries(PROGRAMS).map(([value, label]) => ({ value, label }))
    ],
    section: 'academic'
  },
  {
    name: 'current_english_level',
    label: 'Trình độ tiếng Anh hiện tại',
    type: 'select',
    options: [
      { value: '', label: 'Chọn trình độ' },
      ...Object.entries(ENGLISH_LEVELS).map(([value, label]) => ({ value, label }))
    ],
    section: 'academic'
  },
  {
    name: 'expected_campus',
    label: 'Cơ sở mong muốn',
    type: 'text',
    placeholder: 'Tên cơ sở',
    section: 'academic'
  },
  {
    name: 'student_description',
    label: 'Mô tả học sinh',
    type: 'textarea',
    placeholder: 'Mô tả về học sinh, mục tiêu học tập, v.v.',
    rows: 2,
    section: 'academic'
  },
  // Parent Information
  {
    name: 'parent_name',
    label: 'Tên phụ huynh',
    type: 'text',
    placeholder: 'Họ tên phụ huynh',
    section: 'parent'
  },
  {
    name: 'parent_phone',
    label: 'Số điện thoại phụ huynh',
    type: 'tel',
    placeholder: '0901234567',
    section: 'parent'
  },
  {
    name: 'parent_email',
    label: 'Email phụ huynh',
    type: 'email',
    placeholder: 'email@example.com',
    section: 'parent'
  },
  // Additional Information
  {
    name: 'notes',
    label: 'Ghi chú',
    type: 'textarea',
    placeholder: 'Ghi chú thêm về học sinh',
    rows: 2,
    section: 'additional'
  }
];

// Form field renderer helper function
const renderFormField = (field: StudentFormFieldConfig, form: any) => {
  const commonClasses = "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
  
  const renderInput = () => {
    switch (field.type) {
      case 'select':
        return (
          <select
            {...form.register(field.name)}
            className={commonClasses}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            {...form.register(field.name)}
            rows={field.rows || 2}
            className={commonClasses}
            placeholder={field.placeholder}
          />
        );
      default:
        return (
          <input
            {...form.register(field.name)}
            type={field.type}
            className={commonClasses}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <FormField
      key={field.name}
      label={field.label}
      required={field.required}
      layout="horizontal"
      error={form.formState.errors[field.name]?.message}
    >
      {renderInput()}
    </FormField>
  );
};

// Form fields renderer by section
const renderFormSection = (sectionName: string, sectionTitle: string, fields: StudentFormFieldConfig[], form: any, isFirstSection = false) => {
  const sectionFields = fields.filter(field => field.section === sectionName);
  
  if (sectionFields.length === 0) return null;

  return (
    <div className={`${isFirstSection ? 'mb-4' : 'mb-4 border-t border-gray-200 pt-4'}`}>
      <h3 className="text-sm font-medium text-gray-800 mb-3">{sectionTitle}</h3>
      <div className="space-y-2">
        {sectionFields.map(field => renderFormField(field, form))}
      </div>
    </div>
  );
};

// Modal state interface
interface ModalState {
  isOpen: boolean;
  formType: 'create' | 'edit';
  initialData: Student | null;
}

export default function StudentsTabCrud({
  students,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onEnroll
}: StudentsTabCrudProps) {
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [showAttendanceDrawer, setShowAttendanceDrawer] = useState(false);
  const [showTuitionDrawer, setShowTuitionDrawer] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

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
            <button
              onClick={() => handleRowClick(row)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
            >
              {value}
            </button>
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

    ];
  };

  const handleViewAttendance = (student: Student) => {
    setSelectedStudent(student);
    setShowAttendanceDrawer(true);
  };

  const handleViewTuition = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingInvoices(true);
    setShowTuitionDrawer(true);
    
    try {
      // Fetch invoices for this student
      const response = await fetch(`/api/invoices?student_id=${student.id}&limit=50`);
      const result = await response.json();
      
      if (result.success) {
        setStudentInvoices(result.data || []);
      } else {
        console.error('Failed to fetch student invoices:', result.message);
        setStudentInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching student invoices:', error);
      setStudentInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleViewInvoiceDetail = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800' },
      partial: { label: 'Thanh toán một phần', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
      overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getInvoiceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'tuition': 'Học phí',
      'standard': 'Dịch vụ',
      'payroll': 'Lương',
      'expense': 'Chi phí'
    };
    return labels[type] || type;
  };

  const handleRowClick = (student: Student) => {
    // Open the edit modal in read-only mode by populating it with student data
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
        customActions={[
          {
            label: 'Xem điểm danh',
            icon: '📋',
            onClick: handleViewAttendance,
            variant: 'secondary',
            iconOnly: true,
            tooltip: 'Xem điểm danh'
          },
          {
            label: 'Xem học phí',
            icon: '💰',
            onClick: handleViewTuition,
            variant: 'secondary',
            iconOnly: true,
            tooltip: 'Xem học phí'
          },
          ...(onEnroll ? [{
            label: 'Ghi danh',
            icon: '📝',
            onClick: onEnroll,
            variant: 'primary' as const,
            iconOnly: true,
            tooltip: 'Ghi danh vào lớp'
          }] : [])
        ]}
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

      {/* Student Attendance Drawer */}
      {showAttendanceDrawer && selectedStudent && (
        <StudentAttendanceDrawerComponent
          student={selectedStudent}
          onClose={() => setShowAttendanceDrawer(false)}
        />
      )}

      {/* Student Tuition Drawer */}
      {showTuitionDrawer && selectedStudent && (
        <StudentTuitionDrawer
          student={selectedStudent}
          invoices={studentInvoices}
          loading={loadingInvoices}
          onClose={() => setShowTuitionDrawer(false)}
          onViewInvoice={handleViewInvoiceDetail}
          formatCurrency={formatCurrency}
          getStatusBadge={getInvoiceStatusBadge}
          getTypeLabel={getInvoiceTypeLabel}
        />
      )}

      {/* Invoice Detail Drawer */}
      <InvoiceDetailDrawer
        isOpen={showInvoiceDetail}
        onClose={() => setShowInvoiceDetail(false)}
        invoice={selectedInvoice}
        onPaymentConfirmed={() => {
          // Refresh invoices when payment is confirmed
          if (selectedStudent) {
            handleViewTuition(selectedStudent);
          }
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
            <FormField 
              label="Họ và tên" 
              required 
              layout="horizontal"
              error={form.formState.errors.full_name?.message}
            >
              <input
                {...form.register('full_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập họ và tên"
              />
            </FormField>

            <FormField 
              label="Email" 
              layout="horizontal"
              error={form.formState.errors.email?.message}
            >
              <input
                {...form.register('email')}
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="email@example.com"
              />
            </FormField>

            <FormField 
              label="Số điện thoại" 
              layout="horizontal"
              error={form.formState.errors.phone?.message}
            >
              <input
                {...form.register('phone')}
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
            </FormField>

            <FormField label="Ngày sinh" layout="horizontal">
              <input
                {...form.register('date_of_birth')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Trạng thái" layout="horizontal">
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

            <FormField label="Địa chỉ" layout="horizontal">
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
          <div className="space-y-2">
            <FormField label="Chương trình mong muốn" layout="horizontal">
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

            <FormField label="Trình độ tiếng Anh hiện tại" layout="horizontal">
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

            <FormField label="Cơ sở mong muốn" layout="horizontal">
              <input
                {...form.register('expected_campus')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên cơ sở"
              />
            </FormField>

            <FormField label="Mô tả học sinh" layout="horizontal">
              <textarea
                {...form.register('student_description')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả về học sinh, mục tiêu học tập, v.v."
              />
            </FormField>
          </div>
        </div>

        {/* Parent Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin phụ huynh</h3>
          <div className="space-y-2">
            <FormField label="Tên phụ huynh" layout="horizontal">
              <input
                {...form.register('parent_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Họ tên phụ huynh"
              />
            </FormField>

            <FormField label="Số điện thoại phụ huynh" layout="horizontal">
              <input
                {...form.register('parent_phone')}
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
            </FormField>

            <FormField label="Email phụ huynh" layout="horizontal">
              <input
                {...form.register('parent_email')}
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="email@example.com"
              />
            </FormField>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormField label="Ghi chú" layout="horizontal">
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
        maxWidth="near-full"
      >
        {editForm.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {editForm.submitError}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
          <div className="space-y-2">
            <FormField 
              label="Họ và tên" 
              required 
              layout="horizontal"
              error={editForm.formState.errors.full_name?.message}
            >
              <input
                {...editForm.register('full_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập họ và tên"
              />
            </FormField>

            <FormField 
              label="Email" 
              layout="horizontal"
              error={editForm.formState.errors.email?.message}
            >
              <input
                {...editForm.register('email')}
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="email@example.com"
              />
            </FormField>

            <FormField 
              label="Số điện thoại" 
              layout="horizontal"
              error={editForm.formState.errors.phone?.message}
            >
              <input
                {...editForm.register('phone')}
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
            </FormField>

            <FormField label="Ngày sinh" layout="horizontal">
              <input
                {...editForm.register('date_of_birth')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Trạng thái" layout="horizontal">
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

            <FormField label="Địa chỉ" layout="horizontal">
              <textarea
                {...editForm.register('address')}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập địa chỉ"
              />
            </FormField>
          </div>
        </div>

        {/* Academic Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin học tập</h3>
          <div className="space-y-2">
            <FormField label="Chương trình mong muốn" layout="horizontal">
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

            <FormField label="Trình độ tiếng Anh hiện tại" layout="horizontal">
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

            <FormField label="Cơ sở mong muốn" layout="horizontal">
              <input
                {...editForm.register('expected_campus')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên cơ sở"
              />
            </FormField>

            <FormField label="Mô tả học sinh" layout="horizontal">
              <textarea
                {...editForm.register('student_description')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả về học sinh, mục tiêu học tập, v.v."
              />
            </FormField>
          </div>
        </div>

        {/* Parent Information */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin phụ huynh</h3>
          <div className="space-y-2">
            <FormField label="Tên phụ huynh" layout="horizontal">
              <input
                {...editForm.register('parent_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Họ tên phụ huynh"
              />
            </FormField>

            <FormField label="Số điện thoại phụ huynh" layout="horizontal">
              <input
                {...editForm.register('parent_phone')}
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0901234567"
              />
            </FormField>

            <FormField label="Email phụ huynh" layout="horizontal">
              <input
                {...editForm.register('parent_email')}
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="email@example.com"
              />
            </FormField>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormField label="Ghi chú" layout="horizontal">
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

// Student Tuition Drawer Component
interface StudentTuitionDrawerProps {
  student: any;
  invoices: any[];
  loading: boolean;
  onClose: () => void;
  onViewInvoice: (invoice: any) => void;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => JSX.Element;
  getTypeLabel: (type: string) => string;
}

function StudentTuitionDrawer({ 
  student, 
  invoices, 
  loading, 
  onClose, 
  onViewInvoice, 
  formatCurrency, 
  getStatusBadge, 
  getTypeLabel 
}: StudentTuitionDrawerProps) {
  // Add ESC key handler
  useEscapeKey(onClose, true);
  
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const paidAmount = invoices.reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-4xl">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="flex-1 py-6 px-4 sm:px-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Học phí và giao dịch
                    </h2>
                    <p className="text-sm text-gray-600">
                      {student?.full_name}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Đang tải dữ liệu học phí...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-1">Tổng học phí</h3>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-900 mb-1">Đã thanh toán</h3>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-orange-900 mb-1">Còn lại</h3>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</p>
                      </div>
                    </div>

                    {/* Invoices List */}
                    {invoices.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có hóa đơn nào</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Học sinh chưa có hóa đơn học phí nào.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium text-gray-900">Danh sách hóa đơn</h3>
                        {invoices.map((invoice, index) => (
                          <div key={invoice.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {invoice.invoice_number || `Hóa đơn #${invoice.id}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {getTypeLabel(invoice.invoice_type || 'standard')} - {
                                        invoice.issue_date ? 
                                        new Date(invoice.issue_date).toLocaleDateString('vi-VN') :
                                        new Date(invoice.created_at).toLocaleDateString('vi-VN')
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">{formatCurrency(invoice.total_amount || 0)}</span>
                                    {invoice.paid_amount > 0 && (
                                      <span className="ml-2 text-green-600">
                                        (Đã trả: {formatCurrency(invoice.paid_amount)})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {getStatusBadge(invoice.status)}
                                    <button
                                      onClick={() => onViewInvoice(invoice)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Xem chi tiết
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Student Attendance Drawer Component
interface StudentAttendanceDrawerProps {
  student: any;
  onClose: () => void;
}

function StudentAttendanceDrawerComponent({ student, onClose }: StudentAttendanceDrawerProps) {
  // Add ESC key handler
  useEscapeKey(onClose, true);
  
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student?.id) {
      fetchAttendanceData();
    }
  }, [student?.id]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the existing attendance API with student_id filter
      const response = await fetch(`/api/attendance?student_id=${student.id}&limit=20`);
      const result = await response.json();
      
      if (result.success) {
        setAttendanceData(result.data || []);
      } else {
        setError(result.message || 'Không thể tải dữ liệu điểm danh');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Lỗi khi tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Có mặt', color: 'bg-green-100 text-green-800' },
      absent: { label: 'Vắng mặt', color: 'bg-red-100 text-red-800' },
      late: { label: 'Đi muộn', color: 'bg-yellow-100 text-yellow-800' },
      excused: { label: 'Có phép', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-4xl">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="flex-1 py-6 px-4 sm:px-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Điểm danh học sinh
                    </h2>
                    <p className="text-sm text-gray-600">
                      {student?.full_name}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Đang tải dữ liệu điểm danh...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Lỗi tải dữ liệu</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                    <button
                      onClick={fetchAttendanceData}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : attendanceData.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dữ liệu điểm danh</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Học sinh chưa có bản ghi điểm danh nào.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Thống kê điểm danh</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Tổng số buổi:</span>
                          <span className="ml-2 font-medium">{attendanceData.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Có mặt:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {attendanceData.filter(a => a.status === 'present').length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {attendanceData.map((attendance, index) => (
                        <div key={attendance.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {attendance.main_sessions?.main_session_name || 'Buổi học'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {attendance.main_sessions?.scheduled_date ? 
                                      new Date(attendance.main_sessions.scheduled_date).toLocaleDateString('vi-VN') :
                                      new Date(attendance.created_at).toLocaleDateString('vi-VN')
                                    }
                                  </p>
                                </div>
                              </div>
                              {attendance.enrollments?.classes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Lớp: {attendance.enrollments.classes.class_name}
                                  {attendance.enrollments.classes.facilities && 
                                    ` - ${attendance.enrollments.classes.facilities.name}`
                                  }
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(attendance.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
