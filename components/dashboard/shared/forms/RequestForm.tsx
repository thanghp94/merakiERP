import React, { useState } from 'react';
import { z } from 'zod';
import { useFormWithValidation, commonSchemas } from '../../../../lib/hooks/useFormWithValidation';
import { FormGrid, FormField, EmployeeSelector } from '../index';
import { RequestType, REQUEST_TYPE_LABELS } from '../types';

// Request form validation schemas - comprehensive schema with all possible fields
const requestFormSchema = z.object({
  request_type: z.enum(['nghi_phep', 'doi_lich', 'tam_ung', 'mua_sam_sua_chua']),
  title: commonSchemas.requiredString('Tiêu đề'),
  description: commonSchemas.optionalString,
  created_by_employee_id: commonSchemas.requiredString('Nhân viên'),
  // Leave request fields
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  reason: z.string().optional(),
  // Schedule change fields
  original_date: z.string().optional(),
  new_date: z.string().optional(),
  class_affected: z.string().optional(),
  // Advance payment fields
  amount: z.number().optional(),
  repayment_plan: z.string().optional(),
  // Purchase/repair fields
  item_name: z.string().optional(),
  estimated_cost: z.number().optional(),
  vendor: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation based on request type
  switch (data.request_type) {
    case 'nghi_phep':
      if (!data.from_date) ctx.addIssue({ code: 'custom', message: 'Ngày bắt đầu là bắt buộc', path: ['from_date'] });
      if (!data.to_date) ctx.addIssue({ code: 'custom', message: 'Ngày kết thúc là bắt buộc', path: ['to_date'] });
      if (!data.reason) ctx.addIssue({ code: 'custom', message: 'Lý do nghỉ phép là bắt buộc', path: ['reason'] });
      break;
    case 'doi_lich':
      if (!data.original_date) ctx.addIssue({ code: 'custom', message: 'Ngày gốc là bắt buộc', path: ['original_date'] });
      if (!data.new_date) ctx.addIssue({ code: 'custom', message: 'Ngày mới là bắt buộc', path: ['new_date'] });
      break;
    case 'tam_ung':
      if (!data.amount || data.amount <= 0) ctx.addIssue({ code: 'custom', message: 'Số tiền phải lớn hơn 0', path: ['amount'] });
      if (!data.repayment_plan) ctx.addIssue({ code: 'custom', message: 'Kế hoạch trả lại là bắt buộc', path: ['repayment_plan'] });
      break;
    case 'mua_sam_sua_chua':
      if (!data.item_name) ctx.addIssue({ code: 'custom', message: 'Tên vật phẩm là bắt buộc', path: ['item_name'] });
      if (!data.estimated_cost || data.estimated_cost <= 0) ctx.addIssue({ code: 'custom', message: 'Chi phí ước tính phải lớn hơn 0', path: ['estimated_cost'] });
      break;
  }
});

interface RequestFormProps {
  onSubmit: (data: any) => Promise<{ success: boolean; message?: string }>;
  onCancel: () => void;
  employees: any[];
  currentUserId?: string;
}

const RequestForm: React.FC<RequestFormProps> = ({
  onSubmit,
  onCancel,
  employees,
  currentUserId
}) => {
  const [requestType, setRequestType] = useState<RequestType>('nghi_phep');

  // Get the comprehensive schema (includes all fields with conditional validation)
  const getSchema = () => {
    return requestFormSchema;
  };

  const getDefaultValues = () => {
    const baseValues = {
      request_type: requestType,
      title: '',
      description: '',
      created_by_employee_id: currentUserId || '',
    };

    switch (requestType) {
      case 'nghi_phep':
        return {
          ...baseValues,
          from_date: '',
          to_date: '',
          reason: '',
        };
      case 'doi_lich':
        return {
          ...baseValues,
          original_date: '',
          new_date: '',
          class_affected: '',
        };
      case 'tam_ung':
        return {
          ...baseValues,
          amount: 0,
          repayment_plan: '',
        };
      case 'mua_sam_sua_chua':
        return {
          ...baseValues,
          item_name: '',
          estimated_cost: 0,
          vendor: '',
        };
      default:
        return baseValues;
    }
  };

  const form = useFormWithValidation({
    schema: getSchema(),
    defaultValues: getDefaultValues(),
    onSubmit: async (data: any) => {
      // Calculate total days for leave requests
      if (requestType === 'nghi_phep' && data.from_date && data.to_date) {
        const fromDate = new Date(data.from_date);
        const toDate = new Date(data.to_date);
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        (data as any).total_days = daysDiff;
      }

      // Structure the request data
      const requestData = {
        request_type: data.request_type,
        title: data.title,
        description: data.description,
        created_by_employee_id: data.created_by_employee_id,
        request_data: getRequestSpecificData(data),
      };

      // Call the onSubmit function but don't return its result
      await onSubmit(requestData);
    },
  });

  const getRequestSpecificData = (data: any) => {
    switch (requestType) {
      case 'nghi_phep':
        return {
          from_date: data.from_date,
          to_date: data.to_date,
          total_days: data.total_days,
          reason: data.reason,
        };
      case 'doi_lich':
        return {
          original_date: data.original_date,
          new_date: data.new_date,
          class_affected: data.class_affected,
        };
      case 'tam_ung':
        return {
          amount: data.amount,
          repayment_plan: data.repayment_plan,
        };
      case 'mua_sam_sua_chua':
        return {
          item_name: data.item_name,
          estimated_cost: data.estimated_cost,
          vendor: data.vendor,
        };
      default:
        return {};
    }
  };

  const handleRequestTypeChange = (newType: RequestType) => {
    setRequestType(newType);
    form.setValue('request_type', newType);
    
    // Generate default title based on request type
    const defaultTitles = {
      nghi_phep: 'Yêu cầu nghỉ phép',
      doi_lich: 'Yêu cầu đổi lịch dạy',
      tam_ung: 'Yêu cầu tạm ứng',
      mua_sam_sua_chua: 'Yêu cầu mua sắm/sửa chữa',
    };
    form.setValue('title', defaultTitles[newType]);
  };

  const renderRequestSpecificFields = () => {
    switch (requestType) {
      case 'nghi_phep':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Ngày bắt đầu" required>
              <input
                {...form.register('from_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {form.formState.errors.from_date && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.from_date.message}</p>
              )}
            </FormField>

            <FormField label="Ngày kết thúc" required>
              <input
                {...form.register('to_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {form.formState.errors.to_date && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.to_date.message}</p>
              )}
            </FormField>

            <div className="col-span-2">
              <FormField label="Lý do nghỉ phép" required>
                <textarea
                  {...form.register('reason')}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Nhập lý do nghỉ phép..."
                />
                {form.formState.errors.reason && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.reason.message}</p>
                )}
              </FormField>
            </div>
          </FormGrid>
        );

      case 'doi_lich':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Ngày dạy gốc" required>
              <input
                {...form.register('original_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {form.formState.errors.original_date && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.original_date.message}</p>
              )}
            </FormField>

            <FormField label="Ngày dạy mới" required>
              <input
                {...form.register('new_date')}
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {form.formState.errors.new_date && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.new_date.message}</p>
              )}
            </FormField>

            <div className="col-span-2">
              <FormField label="Lớp học bị ảnh hưởng">
                <input
                  {...form.register('class_affected')}
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Tên lớp học..."
                />
              </FormField>
            </div>
          </FormGrid>
        );

      case 'tam_ung':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Số tiền tạm ứng (VNĐ)" required>
              <input
                {...form.register('amount', { valueAsNumber: true })}
                type="number"
                min="0"
                step="100000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="5000000"
              />
              {form.formState.errors.amount && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.amount.message}</p>
              )}
            </FormField>

            <div className="col-span-2">
              <FormField label="Kế hoạch trả lại" required>
                <textarea
                  {...form.register('repayment_plan')}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Mô tả kế hoạch trả lại tiền tạm ứng..."
                />
                {form.formState.errors.repayment_plan && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.repayment_plan.message}</p>
                )}
              </FormField>
            </div>
          </FormGrid>
        );

      case 'mua_sam_sua_chua':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Tên vật phẩm/dịch vụ" required>
              <input
                {...form.register('item_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên vật phẩm cần mua hoặc sửa chữa..."
              />
              {form.formState.errors.item_name && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.item_name.message}</p>
              )}
            </FormField>

            <FormField label="Chi phí ước tính (VNĐ)" required>
              <input
                {...form.register('estimated_cost', { valueAsNumber: true })}
                type="number"
                min="0"
                step="10000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="1000000"
              />
              {form.formState.errors.estimated_cost && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.estimated_cost.message}</p>
              )}
            </FormField>

            <div className="col-span-2">
              <FormField label="Nhà cung cấp">
                <input
                  {...form.register('vendor')}
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Tên nhà cung cấp (nếu có)..."
                />
              </FormField>
            </div>
          </FormGrid>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {form.submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {form.submitError}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
        <FormGrid columns={2} gap="md">
          <FormField label="Loại yêu cầu" required>
            <select
              value={requestType}
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
            <EmployeeSelector
              value={form.watch('created_by_employee_id')}
              onChange={(value) => form.setValue('created_by_employee_id', value)}
              employees={employees}
              required
            />
            {form.formState.errors.created_by_employee_id && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.created_by_employee_id.message}</p>
            )}
          </FormField>

          <div className="col-span-2">
            <FormField label="Tiêu đề yêu cầu" required>
              <input
                {...form.register('title')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập tiêu đề yêu cầu..."
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </FormField>
          </div>

          <div className="col-span-2">
            <FormField label="Mô tả chi tiết">
              <textarea
                {...form.register('description')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả chi tiết về yêu cầu..."
              />
            </FormField>
          </div>
        </FormGrid>
      </div>

      {/* Request-specific fields */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Chi tiết yêu cầu</h3>
        {renderRequestSpecificFields()}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={form.handleSubmit}
          disabled={form.isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {form.isSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
        </button>
      </div>
    </div>
  );
};

export default RequestForm;
