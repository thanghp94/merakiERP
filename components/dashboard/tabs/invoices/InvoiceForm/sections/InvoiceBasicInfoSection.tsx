import React from 'react';
import { InvoiceFormData } from '../../types/invoice.types';

interface InvoiceBasicInfoSectionProps {
  form: any; // Accept any form object to avoid TypeScript conflicts
  onIncomeTypeChange: (isIncome: boolean) => void;
}

export const InvoiceBasicInfoSection: React.FC<InvoiceBasicInfoSectionProps> = ({
  form,
  onIncomeTypeChange,
}) => {
  const { register, watch, formState: { errors } } = form;
  const isIncome = watch('is_income');

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Income/Expense Type Toggle */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại hóa đơn *
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => onIncomeTypeChange(true)}
              className={`flex-1 px-3 py-2 border rounded-md text-sm transition-colors ${
                isIncome
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Thu nhập
            </button>
            <button
              type="button"
              onClick={() => onIncomeTypeChange(false)}
              className={`flex-1 px-3 py-2 border rounded-md text-sm transition-colors ${
                !isIncome
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Chi phí
            </button>
          </div>
        </div>

        {/* Invoice Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại chi tiết *
          </label>
          <select
            {...register('invoice_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isIncome ? (
              <>
                <option value="tuition">Học phí</option>
                <option value="standard">Phí dịch vụ</option>
              </>
            ) : (
              <>
                <option value="payroll">Lương nhân viên</option>
                <option value="expense">Chi phí vận hành</option>
              </>
            )}
          </select>
          {errors.invoice_type && (
            <p className="mt-1 text-sm text-red-600">{errors.invoice_type.message}</p>
          )}
        </div>

        {/* Invoice Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày hóa đơn *
          </label>
          <input
            type="date"
            {...register('invoice_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.invoice_date && (
            <p className="mt-1 text-sm text-red-600">{errors.invoice_date.message}</p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hạn thanh toán
          </label>
          <input
            type="date"
            {...register('due_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả hóa đơn *
        </label>
        <input
          type="text"
          {...register('description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mô tả ngắn gọn về hóa đơn"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
    </div>
  );
};
