import React, { useState, useMemo, useEffect } from 'react';
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

    // Add attendance button
    actions.push({
      label: 'Xem điểm danh',
      icon: '📋',
      onClick: handleViewAttendance,
      variant: 'secondary',
      iconOnly: true,
      tooltip: 'Xem điểm danh'
    });

    // Add tuition fees button
    actions.push({
      label: 'Xem học phí',
      icon: '💰',
      onClick: handleViewTuition,
      variant: 'secondary',
      iconOnly: true,
      tooltip: 'Xem học phí'
    });
    
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

      {/* Student Attendance Drawer */}
      {showAttendanceDrawer && selectedStudent && (
        <StudentAttendanceDrawer
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

      {/* Create Student Modal - Simplified for brevity */}
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
        <div className="space-y-4">
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
          {/* Add other form fields as needed */}
        </div>
      </FormModal>

      {/* Edit Student Modal - Simplified for brevity */}
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
        <div className="space-y-4">
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
          {/* Add other form fields as needed */}
        </div>
      </FormModal>
    </div>
  );
}

// Student Attendance Drawer Component
interface StudentAttendanceDrawerProps {
  student: any;
  onClose: () => void;
}

function StudentAttendanceDrawer({ student, onClose }: StudentAttendanceDrawerProps) {
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
                    <p className="
