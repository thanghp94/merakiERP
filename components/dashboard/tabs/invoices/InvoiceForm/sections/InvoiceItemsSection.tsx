import React from 'react';
import { InvoiceItem, Category } from '../../types/invoice.types';

interface InvoiceItemsSectionProps {
  form: any; // Accept any form object to avoid TypeScript conflicts
  availableCategories: Category[];
  onAddItem: () => void;
  onUpdateItem: (index: number, field: keyof InvoiceItem, value: string | number) => void;
  onRemoveItem: (index: number) => void;
}

export const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  form,
  availableCategories,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}) => {
  const { watch, formState: { errors } } = form;
  const items = watch('items') || [];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Chi tiết hóa đơn</h3>
        <button
          type="button"
          onClick={onAddItem}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
        >
          <span>+</span>
          <span>Thêm mục</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Chưa có mục nào trong hóa đơn</p>
          <p className="text-sm">Nhấn "Thêm mục" để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-900">Mục {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                >
                  ✕ Xóa
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Item Name */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tên mục *
                  </label>
                  <input
                    type="text"
                    value={item.item_name}
                    onChange={(e) => onUpdateItem(index, 'item_name', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Tên mục"
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Danh mục *
                  </label>
                  <select
                    value={item.category}
                    onChange={(e) => onUpdateItem(index, 'category', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {availableCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label_vi || category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Số lượng *
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="SL"
                  />
                </div>
                
                {/* Unit Price */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Đơn giá *
                  </label>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => onUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Đơn giá"
                  />
                </div>
                
                {/* Total Amount */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Thành tiền
                  </label>
                  <input
                    type="number"
                    value={item.total_amount}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 cursor-not-allowed"
                    placeholder="Thành tiền"
                  />
                </div>
              </div>
              
              {/* Item Description */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mô tả chi tiết
                </label>
                <input
                  type="text"
                  value={item.item_description}
                  onChange={(e) => onUpdateItem(index, 'item_description', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Mô tả chi tiết về mục này..."
                />
              </div>

              {/* Item-level validation errors */}
              {errors.items?.[index] && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">
                    Vui lòng kiểm tra lại thông tin mục này
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Items validation error */}
      {errors.items && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.items.message}</p>
        </div>
      )}

      {/* Items Summary */}
      {items.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-blue-900">
              Tổng số mục: {items.length}
            </span>
            <span className="font-medium text-blue-900">
              Tạm tính: {items.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
