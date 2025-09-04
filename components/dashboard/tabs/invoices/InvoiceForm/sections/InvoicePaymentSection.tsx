import React from 'react';
import { PaymentMethod } from '../../types/invoice.types';

interface InvoicePaymentSectionProps {
  form: any; // Accept any form object to avoid TypeScript conflicts
  paymentMethods: PaymentMethod[];
}

export const InvoicePaymentSection: React.FC<InvoicePaymentSectionProps> = ({
  form,
  paymentMethods,
}) => {
  const { register, watch, formState: { errors } } = form;
  const { create_payment, total_amount } = watch();

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          {...register('create_payment')}
          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="text-lg font-medium text-gray-900">
          Tạo bản ghi thanh toán ngay
        </label>
      </div>

      {!create_payment && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">
            Hóa đơn sẽ được tạo ở trạng thái chưa thanh toán. Bạn có thể thêm thanh toán sau.
          </p>
        </div>
      )}

      {create_payment && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700 mb-3">
              ✓ Sẽ tạo bản ghi thanh toán cùng với hóa đơn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán *
              </label>
              <select
                {...register('payment_method')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn phương thức</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label_vi}
                  </option>
                ))}
              </select>
              {errors.payment_method && (
                <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
              )}
            </div>
            
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền thanh toán *
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('payment_amount', { valueAsNumber: true })}
                  min="0"
                  max={total_amount}
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₫</span>
                </div>
              </div>
              {errors.payment_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.payment_amount.message}</p>
              )}
              {total_amount > 0 && (
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Tối đa: {total_amount.toLocaleString('vi-VN')} ₫</span>
                  <button
                    type="button"
                    onClick={() => form.setValue('payment_amount', total_amount)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Thanh toán toàn bộ
                  </button>
                </div>
              )}
            </div>
            
            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày thanh toán *
              </label>
              <input
                type="date"
                {...register('payment_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.payment_date && (
                <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>
              )}
            </div>
            
            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã tham chiếu
              </label>
              <input
                type="text"
                {...register('reference_number')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: TF001, BANK123456"
              />
              {errors.reference_number && (
                <p className="mt-1 text-sm text-red-600">{errors.reference_number.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Mã giao dịch ngân hàng, số hóa đơn, hoặc mã tham chiếu khác
              </p>
            </div>
          </div>

          {/* Payment Summary */}
          {watch('payment_amount') > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Tóm tắt thanh toán</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Tổng hóa đơn:</span>
                  <span className="font-medium text-blue-900">
                    {total_amount?.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Thanh toán:</span>
                  <span className="font-medium text-blue-900">
                    {watch('payment_amount')?.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="text-blue-700 font-medium">Còn lại:</span>
                  <span className={`font-bold ${
                    (total_amount - watch('payment_amount')) === 0 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {(total_amount - watch('payment_amount')).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
              
              {(total_amount - watch('payment_amount')) === 0 && (
                <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-700">
                  ✓ Hóa đơn sẽ được đánh dấu là đã thanh toán đầy đủ
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
