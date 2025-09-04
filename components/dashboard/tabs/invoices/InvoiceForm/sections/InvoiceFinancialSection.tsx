import React from 'react';

interface InvoiceFinancialSectionProps {
  form: any; // Accept any form object to avoid TypeScript conflicts
}

export const InvoiceFinancialSection: React.FC<InvoiceFinancialSectionProps> = ({
  form,
}) => {
  const { register, watch, formState: { errors } } = form;
  const { subtotal, tax_amount, discount_amount, total_amount, tax_rate } = watch();

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tổng kết tài chính</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Tax Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thuế VAT (%)
          </label>
          <input
            type="number"
            {...register('tax_rate', { valueAsNumber: true })}
            min="0"
            max="100"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          {errors.tax_rate && (
            <p className="mt-1 text-sm text-red-600">{errors.tax_rate.message}</p>
          )}
        </div>
        
        {/* Discount Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giảm giá (₫)
          </label>
          <input
            type="number"
            {...register('discount_amount', { valueAsNumber: true })}
            min="0"
            step="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          {errors.discount_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.discount_amount.message}</p>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">Tóm tắt tài chính</h4>
        
        <div className="space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Tạm tính:</span>
            <span className="font-medium text-gray-900">
              {subtotal?.toLocaleString('vi-VN') || '0'} ₫
            </span>
          </div>
          
          {/* Tax Amount */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">
              Thuế VAT ({tax_rate || 0}%):
            </span>
            <span className="font-medium text-gray-900">
              {tax_amount?.toLocaleString('vi-VN') || '0'} ₫
            </span>
          </div>
          
          {/* Discount */}
          {discount_amount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Giảm giá:</span>
              <span className="font-medium text-red-600">
                -{discount_amount?.toLocaleString('vi-VN') || '0'} ₫
              </span>
            </div>
          )}
          
          {/* Divider */}
          <div className="border-t border-blue-200 my-2"></div>
          
          {/* Total Amount */}
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-blue-900">
              Tổng cộng:
            </span>
            <span className="text-lg font-bold text-blue-900">
              {total_amount?.toLocaleString('vi-VN') || '0'} ₫
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
            <div>
              <span className="font-medium">Tỷ lệ thuế:</span>
              <span className="ml-1">{tax_rate || 0}%</span>
            </div>
            <div>
              <span className="font-medium">Tiết kiệm:</span>
              <span className="ml-1">{discount_amount?.toLocaleString('vi-VN') || '0'} ₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {(errors.subtotal || errors.tax_amount || errors.total_amount) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            Có lỗi trong tính toán tài chính. Vui lòng kiểm tra lại.
          </p>
        </div>
      )}

      {/* Warning for negative total */}
      {total_amount < 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            ⚠️ Tổng tiền âm. Vui lòng kiểm tra lại giảm giá.
          </p>
        </div>
      )}
    </div>
  );
};
