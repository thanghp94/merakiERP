import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { Finance } from '../shared/types';
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

interface FinancesTabCrudProps {
  finances: Finance[];
  students: any[];
  isLoading: boolean;
  onSubmit: (data: any, formType: string) => Promise<void>;
  onEdit?: (finance: Finance) => void;
  onDelete?: (finance: Finance) => void;
  onView?: (finance: Finance) => void;
}

// Finance form validation schema
const financeSchema = z.object({
  student_id: commonSchemas.requiredString('Học sinh'),
  type: z.enum(['tuition', 'fee', 'deposit', 'refund', 'other']),
  amount: commonSchemas.requiredString('Số tiền'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  due_date: commonSchemas.date,
  description: commonSchemas.optionalString,
  payment_method: commonSchemas.optionalString,
  notes: commonSchemas.optionalString,
});

type FinanceFormData = z.infer<typeof financeSchema>;

const FINANCE_TYPES = {
  tuition: 'Học phí',
  fee: 'Phí dịch vụ',
  deposit: 'Tiền đặt cọc',
  refund: 'Hoàn tiền',
  other: 'Khác'
};

const FINANCE_STATUSES = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
  cancelled: 'Đã hủy'
};

const PAYMENT_METHODS = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  credit_card: 'Thẻ tín dụng',
  e_wallet: 'Ví điện tử',
  other: 'Khác'
};

export default function FinancesTabCrud({
  finances,
  students,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView
}: FinancesTabCrudProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    student: 'all',
    type: 'all',
    status: 'all',
    payment_method: 'all'
  });

  // Use the form validation hook
  const form = useFormWithValidation<FinanceFormData>({
    schema: financeSchema,
    defaultValues: {
      student_id: '',
      type: 'tuition',
      amount: '',
      status: 'pending',
      due_date: '',
      description: '',
      payment_method: '',
      notes: '',
    },
    onSubmit: async (data) => {
      const submitData = createFormData(data, [
        'description', 'payment_method', 'notes'
      ]);

      // Convert amount to number
      submitData.amount = parseFloat(data.amount);

      await onSubmit(submitData, 'Finance');
      setShowCreateModal(false);
    },
    onSuccess: () => {
      form.resetForm();
    }
  });

  // Filter finances based on selected filters
  const filteredFinances = useMemo(() => {
    return finances.filter(finance => {
      const matchesStudent = filters.student === 'all' || finance.student_id === filters.student;
      const matchesType = filters.type === 'all' || finance.type === filters.type;
      const matchesStatus = filters.status === 'all' || finance.status === filters.status;
      const matchesPaymentMethod = filters.payment_method === 'all' || finance.data?.payment_method === filters.payment_method;

      return matchesStudent && matchesType && matchesStatus && matchesPaymentMethod;
    });
  }, [finances, filters]);

  // Extract unique values for filter options
  const getFilterOptions = () => {
    const studentIds = Array.from(new Set(finances.map(finance => finance.student_id).filter(Boolean)));
    const types = Array.from(new Set(finances.map(finance => finance.type).filter(Boolean)));
    const statuses = Array.from(new Set(finances.map(finance => finance.status).filter(Boolean)));
    const paymentMethods = Array.from(new Set(finances.map(finance => finance.data?.payment_method).filter(Boolean)));

    return {
      studentIds,
      types,
      statuses,
      paymentMethods
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
      student: 'all',
      type: 'all',
      status: 'all',
      payment_method: 'all'
    });
  };

  const handleModalCancel = () => {
    form.resetForm();
    setShowCreateModal(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Filter configuration
  const getFilterConfig = (): FilterConfig[] => {
    return [
      {
        key: 'student',
        label: 'Học sinh',
        options: [
          { value: 'all', label: 'Tất cả học sinh' },
          ...students.filter(student => filterOptions.studentIds.includes(student.id)).map(student => ({
            value: student.id,
            label: student.full_name
          }))
        ]
      },
      {
        key: 'type',
        label: 'Loại',
        options: [
          { value: 'all', label: 'Tất cả loại' },
          ...filterOptions.types.map(type => ({
            value: type,
            label: FINANCE_TYPES[type as keyof typeof FINANCE_TYPES] || type
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
            label: FINANCE_STATUSES[status as keyof typeof FINANCE_STATUSES] || status
          }))
        ]
      },
      {
        key: 'payment_method',
        label: 'Phương thức thanh toán',
        options: [
          { value: 'all', label: 'Tất cả phương thức' },
          ...filterOptions.paymentMethods.map(method => ({
            value: method,
            label: PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS] || method
          }))
        ]
      }
    ];
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<Finance>[] => {
    return [
      {
        key: 'student',
        label: 'Học sinh',
        render: (value, row) => (
          <div>
            <div className="font-medium text-gray-900">
              {row.students?.full_name || 'Không xác định'}
            </div>
            {row.data?.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {row.data.description}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'type',
        label: 'Loại',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {FINANCE_TYPES[value as keyof typeof FINANCE_TYPES] || value}
          </div>
        )
      },
      {
        key: 'amount',
        label: 'Số tiền',
        render: (value) => (
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(value)}
          </div>
        )
      },
      {
        key: 'due_date',
        label: 'Hạn thanh toán',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {formatDate(value)}
          </div>
        )
      },
      {
        key: 'payment_method',
        label: 'Phương thức',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.payment_method ? 
              PAYMENT_METHODS[row.data.payment_method as keyof typeof PAYMENT_METHODS] || row.data.payment_method 
              : '-'
            }
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => {
          const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800'
          };
          
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
              {FINANCE_STATUSES[value as keyof typeof FINANCE_STATUSES] || value}
            </span>
          );
        }
      }
    ];
  };

  // Create table actions configuration
  const getTableActions = (): TableAction<Finance>[] => {
    const actions: TableAction<Finance>[] = [];
    
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
    
    if (onEdit) {
      actions.push({
        label: 'Sửa',
        icon: '✏️',
        onClick: onEdit,
        variant: 'primary',
        iconOnly: true,
        tooltip: 'Chỉnh sửa'
      });
    }
    
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
        data={filteredFinances}
        columns={getTableColumns()}
        isLoading={isLoading}
        filters={filters}
        filterConfigs={getFilterConfig()}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        customActions={getTableActions()}
        title="Danh sách tài chính"
        createButtonLabel="Thêm khoản thu/chi"
        onCreateClick={() => setShowCreateModal(true)}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          ),
          title: 'Không có khoản tài chính nào',
          description: 'Chưa có khoản thu/chi nào được tạo.'
        }}
      />

      {/* Create Finance Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm khoản thu/chi mới"
        onSubmit={form.handleSubmit}
        onCancel={handleModalCancel}
        submitLabel="Thêm mới"
        cancelLabel="Hủy"
        isSubmitting={form.isSubmitting}
        maxWidth="4xl"
      >
        {form.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {form.submitError}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
          <FormGrid columns={2} gap="md">
            <FormField label="Học sinh" required>
              <select
                {...form.register('student_id')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn học sinh</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
              {form.formState.errors.student_id && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.student_id.message}</p>
              )}
            </FormField>

            <FormField label="Loại khoản" required>
              <select
                {...form.register('type')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.entries(FINANCE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Số tiền (VNĐ)" required>
              <input
                {...form.register('amount')}
                type="number"
                min="0"
                step="1000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập số tiền"
              />
              {form.formState.errors.amount && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.amount.message}</p>
              )}
            </FormField>

            <FormField label="Trạng thái" required>
              <select
                {...form.register('status')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.entries(FINANCE_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Hạn thanh toán" required>
              <input
                {...form.register('due_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {form.formState.errors.due_date && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.due_date.message}</p>
              )}
            </FormField>

            <FormField label="Phương thức thanh toán">
              <select
                {...form.register('payment_method')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn phương thức</option>
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Mô tả" className="md:col-span-2">
              <textarea
                {...form.register('description')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả chi tiết về khoản thu/chi"
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
              placeholder="Ghi chú thêm"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
