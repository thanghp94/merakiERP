import React from 'react';
import { useInvoiceFormRefactored } from '../hooks/useInvoiceFormRefactored';
import { useInvoiceReferenceData, useIncomeCategories, useExpenseCategories } from '../hooks/useInvoiceReferenceData';
import { InvoiceFormProps } from '../types/invoice.types';

export const InvoiceFormCompact: React.FC<InvoiceFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  mode = 'create',
}) => {
  // Load reference data
  const {
    students,
    employees,
    facilities,
    classes,
    categories,
    paymentMethods,
    isLoading: isLoadingData,
    error: dataError,
  } = useInvoiceReferenceData();

  // Initialize form
  const {
    form,
    formData,
    isSubmitting,
    submitError,
    handleSubmit,
    handleIncomeTypeChange,
    addItem,
    updateItem,
    removeItem,
    filterCategories,
  } = useInvoiceFormRefactored({
    initialData,
    onSubmit,
    onSuccess: () => {
      // Form will be reset automatically by the hook
    },
  });

  // Filter categories based on income type
  const incomeCategories = useIncomeCategories(categories);
  const expenseCategories = useExpenseCategories(categories);
  const availableCategories = formData.is_income ? incomeCategories : expenseCategories;

  // Update available categories when income type changes
  React.useEffect(() => {
    filterCategories(categories);
  }, [formData.is_income, categories, filterCategories]);

  // Loading state
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Lỗi tải dữ liệu: {dataError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-700 underline hover:text-red-900"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Invoice Type Selection - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="flex items-center space-x-2">
          <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
            Loại hóa đơn *
          </label>
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => handleIncomeTypeChange(true)}
              className={`flex-1 px-2 py-1 border rounded text-xs transition-colors ${
                formData.is_income
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Thu
            </button>
            <button
              type="button"
              onClick={() => handleIncomeTypeChange(false)}
              className={`flex-1 px-2 py-1 border rounded text-xs transition-colors ${
                !formData.is_income
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Chi
            </button>
          </div>
        </div>

        {/* Invoice Type */}
        <div className="flex items-center space-x-2">
          <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
            Loại chi tiết *
          </label>
          <select
            {...form.register('invoice_type')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {formData.is_income ? (
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
        </div>

        {/* Invoice Date */}
        <div className="flex items-center space-x-2">
          <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
            Ngày hóa đơn *
          </label>
          <input
            type="date"
            {...form.register('invoice_date')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Due Date */}
        <div className="flex items-center space-x-2">
          <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
            Hạn thanh toán
          </label>
          <input
            type="date"
            {...form.register('due_date')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {/* Related Entity Selection */}
        {formData.is_income && (
          <div className="flex items-center space-x-2">
            <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
              Học sinh
            </label>
            <select
              {...form.register('student_id')}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Chọn học sinh</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!formData.is_income && (
          <div className="flex items-center space-x-2">
            <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
              Nhân viên
            </label>
            <select
              {...form.register('employee_id')}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Chọn nhân viên</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Class Selection */}
        <div className="flex items-center space-x-2">
          <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
            Lớp học
          </label>
          <select
            {...form.register('class_id')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Chọn lớp</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        </div>

        {/* Facility Selection */}
        <div className="flex items-center space-x-2">
          <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
            Cơ sở
          </label>
          <select
            {...form.register('facility_id')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Chọn cơ sở</option>
            {facilities.map(facility => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex md:col-span-4 items-center space-x-2">
          <label className="block text-xs font-medium text-gray-700 whitespace-nowrap">
            Mô tả hóa đơn *
          </label>
          <input
            type="text"
            {...form.register('description')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Mô tả ngắn gọn về hóa đơn"
          />
        </div>
      </div>

      {/* Invoice Items */}
      <div className="border-t pt-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-900">Chi tiết hóa đơn</h4>
          <button
            type="button"
            onClick={addItem}
            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
          >
            <span>+</span>
            <span>Thêm</span>
          </button>
        </div>

        {formData.items.length > 0 && (
          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div key={index} className="bg-gray-50 p-2 rounded border">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="text-xs font-medium text-gray-900">Mục {index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
                  <div className="lg:col-span-2">
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      required
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Tên mục"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(index, 'category', e.target.value)}
                      required
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Danh mục</option>
                      {availableCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label_vi || category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="SL"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="1000"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Đơn giá"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="number"
                      value={item.total_amount}
                      readOnly
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Thành tiền"
                    />
                  </div>
                </div>
                
                <div className="mt-1">
                  <input
                    type="text"
                    value={item.item_description}
                    onChange={(e) => updateItem(index, 'item_description', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Mô tả chi tiết..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="border-t pt-2">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Tổng kết</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              {...form.register('tax_rate', { valueAsNumber: true })}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Thuế VAT (%)"
            />
          </div>
          
          <div>
            <input
              type="number"
              {...form.register('discount_amount', { valueAsNumber: true })}
              min="0"
              step="1000"
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Giảm giá"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-2 rounded border border-blue-200 mt-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formData.subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between">
              <span>Thuế VAT:</span>
              <span>{formData.tax_amount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between">
              <span>Giảm giá:</span>
              <span>-{formData.discount_amount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-blue-900 border-t pt-1">
              <span>Tổng cộng:</span>
              <span>{formData.total_amount.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="border-t pt-3">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            {...form.register('create_payment')}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">
            Tạo bản ghi thanh toán ngay
          </label>
        </div>

        {formData.create_payment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-2 rounded">
            <div>
              <select
                {...form.register('payment_method')}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Phương thức</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label_vi}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <input
                type="number"
                {...form.register('payment_amount', { valueAsNumber: true })}
                min="0"
                max={formData.total_amount}
                step="1000"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Số tiền"
              />
            </div>
            
            <div>
              <input
                type="date"
                {...form.register('payment_date')}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <input
                type="text"
                {...form.register('reference_number')}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Mã tham chiếu"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <textarea
          {...form.register('notes')}
          rows={2}
          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ghi chú thêm về hóa đơn..."
        />
      </div>

      {/* Form Errors */}
      {submitError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {submitError}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-1 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting || formData.items.length === 0}
          className={`px-4 py-1 text-white rounded text-sm transition-colors ${
            isSubmitting || formData.items.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Đang lưu...' : (mode === 'edit' ? 'Cập nhật' : 'Tạo hóa đơn')}
        </button>
      </div>
    </form>
  );
};

export default InvoiceFormCompact;
