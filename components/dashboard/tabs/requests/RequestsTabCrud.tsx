import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { Request, RequestType, RequestStatus, REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '../shared/types';
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
import { Badge } from '../../ui';

interface RequestsTabCrudProps {
  requests: Request[];
  isLoading: boolean;
  employees: any[];
  currentUserId?: string;
  onSubmit: (data: any, formType: string) => Promise<void>;
  onEdit?: (request: Request) => void;
  onDelete?: (request: Request) => void;
  onView?: (request: Request) => void;
  onApprove?: (request: Request) => void;
  onReject?: (request: Request) => void;
}

// Request form validation schema
const requestSchema = z.object({
  request_type: z.enum(['nghi_phep', 'doi_lich', 'tam_ung', 'mua_sam_sua_chua']),
  title: commonSchemas.requiredString('Tiêu đề'),
  description: commonSchemas.optionalString,
  created_by_employee_id: commonSchemas.requiredString('Nhân viên tạo yêu cầu'),
  
  // Leave request fields
  from_date: commonSchemas.optionalString,
  to_date: commonSchemas.optionalString,
  total_days: z.string().optional(),
  reason: commonSchemas.optionalString,
  
  // Schedule change fields
  original_date: commonSchemas.optionalString,
  new_date: commonSchemas.optionalString,
  class_affected: commonSchemas.optionalString,
  
  // Advance payment fields
  amount: z.string().optional(),
  repayment_plan: commonSchemas.optionalString,
  
  // Purchase/Repair fields
  item_name: commonSchemas.optionalString,
  estimated_cost: z.string().optional(),
  vendor: commonSchemas.optionalString,
});

type RequestFormData = z.infer<typeof requestSchema>;

export default function RequestsTabCrud({
  requests,
  isLoading,
  employees,
  currentUserId,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject
}: RequestsTabCrudProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType>('nghi_phep');

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    request_type: 'all',
    created_by: 'all'
  });

  // Use the form validation hook
  const form = useFormWithValidation<RequestFormData>({
    schema: requestSchema,
    defaultValues: {
      request_type: 'nghi_phep',
      title: '',
      description: '',
      created_by_employee_id: currentUserId || '',
      from_date: '',
      to_date: '',
      total_days: '',
      reason: '',
      original_date: '',
      new_date: '',
      class_affected: '',
      amount: '',
      repayment_plan: '',
      item_name: '',
      estimated_cost: '',
      vendor: '',
    },
    onSubmit: async (data) => {
      const submitData = {
        request_type: data.request_type,
        title: data.title,
        description: data.description,
        created_by_employee_id: data.created_by_employee_id,
        request_data: {} as any
      };

      // Add type-specific data
      switch (data.request_type) {
        case 'nghi_phep':
          submitData.request_data = {
            from_date: data.from_date,
            to_date: data.to_date,
            total_days: data.total_days ? parseInt(data.total_days) : undefined,
            reason: data.reason
          };
          break;
        case 'doi_lich':
          submitData.request_data = {
            original_date: data.original_date,
            new_date: data.new_date,
            class_affected: data.class_affected
          };
          break;
        case 'tam_ung':
          submitData.request_data = {
            amount: data.amount ? parseFloat(data.amount) : undefined,
            repayment_plan: data.repayment_plan
          };
          break;
        case 'mua_sam_sua_chua':
          submitData.request_data = {
            item_name: data.item_name,
            estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : undefined,
            vendor: data.vendor
          };
          break;
      }

      await onSubmit(submitData, 'Request');
      setShowCreateModal(false);
    },
    onSuccess: () => {
      form.resetForm();
    }
  });

  // Filter requests based on selected filters
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesStatus = filters.status === 'all' || request.status === filters.status;
      const matchesType = filters.request_type === 'all' || request.request_type === filters.request_type;
      const matchesCreatedBy = filters.created_by === 'all' || request.created_by_employee_id === filters.created_by;

      return matchesStatus && matchesType && matchesCreatedBy;
    });
  }, [requests, filters]);

  // Extract unique values for filter options
  const getFilterOptions = () => {
    const statuses = Array.from(new Set(requests.map(req => req.status).filter(Boolean)));
    const types = Array.from(new Set(requests.map(req => req.request_type).filter(Boolean)));
    const creators = Array.from(new Set(requests.map(req => req.created_by_employee_id).filter(Boolean)));

    return {
      statuses,
      types,
      creators
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
      request_type: 'all',
      created_by: 'all'
    });
  };

  const handleModalCancel = () => {
    form.resetForm();
    setShowCreateModal(false);
  };

  const handleRequestTypeChange = (type: RequestType) => {
    setSelectedRequestType(type);
    form.setValue('request_type', type);
  };

  // Helper function to get request summary
  const getRequestSummary = (request: Request) => {
    const requestData = request.request_data;
    
    switch (request.request_type) {
      case 'nghi_phep':
        return `${formatDate(requestData.from_date || '')} - ${formatDate(requestData.to_date || '')} (${requestData.total_days || 0} ngày)`;
      case 'doi_lich':
        return `${formatDate(requestData.original_date || '')} → ${formatDate(requestData.new_date || '')}`;
      case 'tam_ung':
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(requestData.amount || 0);
      case 'mua_sam_sua_chua':
        return `${requestData.item_name || ''} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(requestData.estimated_cost || 0)}`;
      default:
        return requestData.description || '';
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
          ...Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({
            value,
            label
          }))
        ]
      },
      {
        key: 'request_type',
        label: 'Loại yêu cầu',
        options: [
          { value: 'all', label: 'Tất cả loại yêu cầu' },
          ...Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({
            value,
            label
          }))
        ]
      },
      {
        key: 'created_by',
        label: 'Người tạo',
        options: [
          { value: 'all', label: 'Tất cả người tạo' },
          ...employees.map(emp => ({
            value: emp.id,
            label: emp.full_name
          }))
        ]
      }
    ];
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<Request>[] => {
    return [
      {
        key: 'title',
        label: 'Tiêu đề',
        render: (value, row) => (
          <div>
            <div className="font-medium text-gray-900">{row.title}</div>
            <div className="text-sm text-gray-500">
              {REQUEST_TYPE_LABELS[row.request_type as RequestType] || 'Không xác định'}
            </div>
          </div>
        )
      },
      {
        key: 'summary',
        label: 'Chi tiết',
        render: (value, row) => (
          <div className="text-sm text-gray-600">
            {getRequestSummary(row)}
          </div>
        )
      },
      {
        key: 'created_by',
        label: 'Người tạo',
        render: (value, row) => (
          <div>
            <div className="font-medium">{row.created_by?.full_name || 'Không xác định'}</div>
            <div className="text-sm text-gray-500">{row.created_by?.position || ''}</div>
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => (
          <Badge className={REQUEST_STATUS_COLORS[value as RequestStatus]}>
            {REQUEST_STATUS_LABELS[value as RequestStatus]}
          </Badge>
        )
      },
      {
        key: 'created_at',
        label: 'Ngày tạo',
        render: (value) => formatDate(value)
      }
    ];
  };

  // Create table actions configuration
  const getTableActions = (): TableAction<Request>[] => {
    const actions: TableAction<Request>[] = [];
    
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

    if (onApprove) {
      actions.push({
        label: 'Duyệt',
        icon: '✅',
        onClick: onApprove,
        variant: 'primary',
        iconOnly: true,
        tooltip: 'Phê duyệt yêu cầu'
      });
    }

    if (onReject) {
      actions.push({
        label: 'Từ chối',
        icon: '❌',
        onClick: onReject,
        variant: 'danger',
        iconOnly: true,
        tooltip: 'Từ chối yêu cầu'
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

  // Render type-specific form fields
  const renderTypeSpecificFields = () => {
    switch (selectedRequestType) {
      case 'nghi_phep':
        return (
          <FormGrid columns={3} gap="md">
            <FormField label="Từ ngày" required>
              <input
                {...form.register('from_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>
            <FormField label="Đến ngày" required>
              <input
                {...form.register('to_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>
            <FormField label="Tổng số ngày">
              <input
                {...form.register('total_days')}
                type="number"
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Số ngày nghỉ"
              />
            </FormField>
            <FormField label="Lý do nghỉ phép" className="md:col-span-3">
              <textarea
                {...form.register('reason')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập lý do nghỉ phép"
              />
            </FormField>
          </FormGrid>
        );

      case 'doi_lich':
        return (
          <FormGrid columns={3} gap="md">
            <FormField label="Ngày gốc" required>
              <input
                {...form.register('original_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>
            <FormField label="Ngày mới" required>
              <input
                {...form.register('new_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>
            <FormField label="Lớp bị ảnh hưởng">
              <input
                {...form.register('class_affected')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên lớp học"
              />
            </FormField>
          </FormGrid>
        );

      case 'tam_ung':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Số tiền tạm ứng" required>
              <input
                {...form.register('amount')}
                type="number"
                min="0"
                step="10000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Số tiền (VNĐ)"
              />
            </FormField>
            <FormField label="Kế hoạch hoàn trả">
              <textarea
                {...form.register('repayment_plan')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả kế hoạch hoàn trả"
              />
            </FormField>
          </FormGrid>
        );

      case 'mua_sam_sua_chua':
        return (
          <FormGrid columns={3} gap="md">
            <FormField label="Tên vật phẩm" required>
              <input
                {...form.register('item_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên vật phẩm cần mua/sửa"
              />
            </FormField>
            <FormField label="Chi phí ước tính">
              <input
                {...form.register('estimated_cost')}
                type="number"
                min="0"
                step="10000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Chi phí (VNĐ)"
              />
            </FormField>
            <FormField label="Nhà cung cấp">
              <input
                {...form.register('vendor')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên nhà cung cấp"
              />
            </FormField>
          </FormGrid>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <CrudTable
        data={filteredRequests}
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
        title="Danh sách yêu cầu"
        createButtonLabel="Tạo yêu cầu mới"
        onCreateClick={() => setShowCreateModal(true)}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          title: 'Không có yêu cầu nào',
          description: 'Chưa có yêu cầu nào được tạo.'
        }}
      />

      {/* Create Request Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo yêu cầu mới"
        onSubmit={form.handleSubmit}
        onCancel={handleModalCancel}
        submitLabel="Tạo yêu cầu"
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
            <FormField label="Loại yêu cầu" required>
              <select
                {...form.register('request_type')}
                onChange={(e) => handleRequestTypeChange(e.target.value as RequestType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Người tạo yêu cầu" required>
              <select
                {...form.register('created_by_employee_id')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn nhân viên</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.position}
                  </option>
                ))}
              </select>
              {form.formState.errors.created_by_employee_id && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.created_by_employee_id.message}</p>
              )}
            </FormField>

            <FormField label="Tiêu đề" required className="md:col-span-2">
              <input
                {...form.register('title')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập tiêu đề yêu cầu"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </FormField>

            <FormField label="Mô tả" className="md:col-span-2">
              <textarea
                {...form.register('description')}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả chi tiết về yêu cầu"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Type-specific fields */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">
            Chi tiết {REQUEST_TYPE_LABELS[selectedRequestType]}
          </h3>
          {renderTypeSpecificFields()}
        </div>
      </FormModal>
    </div>
  );
}
