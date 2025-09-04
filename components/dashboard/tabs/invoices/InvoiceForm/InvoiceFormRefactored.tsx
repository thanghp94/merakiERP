import React from 'react';
import { useInvoiceFormRefactored } from '../hooks/useInvoiceFormRefactored';
import { useInvoiceReferenceData, useIncomeCategories, useExpenseCategories } from '../hooks/useInvoiceReferenceData';
import { InvoiceFormProps } from '../types/invoice.types';
import {
  InvoiceBasicInfoSection,
  InvoiceEntitySection,
  InvoiceItemsSection,
  InvoiceFinancialSection,
  InvoicePaymentSection,
} from './sections';

export const InvoiceFormRefactored: React.FC<InvoiceFormProps> = ({
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

  // Extract form methods for sections
  const formMethods = {
    ...form,
    // Override handleSubmit to use our custom one
    handleSubmit: form.handleSubmit,
  };

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
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Tạo hóa đơn mới' : 
                 mode === 'edit' ? 'Chỉnh sửa hóa đơn' : 
                 'Xem hóa đơn'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formData.is_income ? 'Hóa đơn thu nhập' : 'Hóa đơn chi phí'}
              </p>
            </div>
            {mode === 'view' && (
              <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                Chỉ xem
              </div>
            )}
          </div>
        </div>

        {/* Basic Information Section */}
        <InvoiceBasicInfoSection
          form={formMethods}
          onIncomeTypeChange={handleIncomeTypeChange}
        />

        {/* Entity Relations Section */}
        <InvoiceEntitySection
          form={formMethods}
          students={students}
          employees={employees}
          facilities={facilities}
          classes={classes}
          isLoading={isLoadingData}
        />

        {/* Invoice Items Section */}
        <InvoiceItemsSection
          form={formMethods}
          availableCategories={availableCategories}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
        />

        {/* Financial Summary Section */}
        <InvoiceFinancialSection form={formMethods} />

        {/* Payment Section */}
        <InvoicePaymentSection
          form={formMethods}
          paymentMethods={paymentMethods}
        />

        {/* Form Errors */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">Lỗi: {submitError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {formData.items.length > 0 && (
                <span>
                  {formData.items.length} mục • Tổng: {formData.total_amount.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              
              {mode !== 'view' && (
                <button
                  type="submit"
                  disabled={isSubmitting || formData.items.length === 0}
                  className={`px-6 py-2 text-white rounded-md text-sm transition-colors ${
                    isSubmitting || formData.items.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang lưu...
                    </span>
                  ) : (
                    mode === 'edit' ? 'Cập nhật hóa đơn' : 'Tạo hóa đơn'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceFormRefactored;
