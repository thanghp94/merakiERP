import React, { useState, useEffect } from 'react';

interface FinanceItem {
  item_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface FormData {
  transaction_type: 'income' | 'expense';
  category: string;
  student_id: string;
  employee_id: string;
  facility_id: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  transaction_date: string;
  due_date: string;
  description: string;
  notes: string;
  status: string;
  items: FinanceItem[];
}

interface FinanceFormNewProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function FinanceFormNew({ onSubmit, onCancel }: FinanceFormNewProps) {
  const [formData, setFormData] = useState<FormData>({
    transaction_type: 'income',
    category: '',
    student_id: '',
    employee_id: '',
    facility_id: '',
    amount: 0,
    payment_method: 'cash',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    notes: '',
    status: 'completed',
    items: []
  });

  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showItemsSection, setShowItemsSection] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    // Auto-calculate total amount from items
    const totalFromItems = formData.items.reduce((sum, item) => sum + item.total_amount, 0);
    if (totalFromItems > 0 && totalFromItems !== formData.amount) {
      setFormData(prev => ({ ...prev, amount: totalFromItems }));
    }
  }, [formData.items]);

  const loadFormData = async () => {
    try {
      // Load students
      const studentsResponse = await fetch('/api/students');
      const studentsResult = await studentsResponse.json();
      if (studentsResult.success) {
        setStudents(studentsResult.data || []);
      }

      // Load employees
      const employeesResponse = await fetch('/api/employees');
      const employeesResult = await employeesResponse.json();
      if (employeesResult.success) {
        setEmployees(employeesResult.data || []);
      }

      // Load facilities
      const facilitiesResponse = await fetch('/api/facilities');
      const facilitiesResult = await facilitiesResponse.json();
      if (facilitiesResult.success) {
        setFacilities(facilitiesResult.data || []);
      }

      // Load categories and payment methods from helper functions
      const categoriesResponse = await fetch('/api/finance-categories');
      const categoriesResult = await categoriesResponse.json();
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      }

      const paymentMethodsResponse = await fetch('/api/payment-methods');
      const paymentMethodsResult = await paymentMethodsResponse.json();
      if (paymentMethodsResult.success) {
        setPaymentMethods(paymentMethodsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTransactionTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      transaction_type: type,
      category: '', // Reset category when changing type
      student_id: type === 'expense' ? '' : prev.student_id,
      employee_id: type === 'income' ? '' : prev.employee_id,
      facility_id: type === 'income' ? '' : prev.facility_id
    }));
  };

  const addItem = () => {
    const newItem: FinanceItem = {
      item_name: '',
      item_description: '',
      quantity: 1,
      unit_price: 0,
      total_amount: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowItemsSection(true);
  };

  const updateItem = (index: number, field: keyof FinanceItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Auto-calculate total_amount when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_amount = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        is_income: formData.transaction_type === 'income',
        // Only include relevant IDs based on transaction type
        student_id: formData.transaction_type === 'income' ? formData.student_id || null : null,
        employee_id: formData.transaction_type === 'expense' ? formData.employee_id || null : null,
        facility_id: formData.transaction_type === 'expense' ? formData.facility_id || null : null
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const availableCategories = formData.transaction_type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Thêm giao dịch tài chính mới
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Loại giao dịch *
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleTransactionTypeChange('income')}
              className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                formData.transaction_type === 'income'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-2">📈</div>
              <div className="font-medium">Thu nhập</div>
              <div className="text-sm text-gray-600">Học phí, phí đăng ký, etc.</div>
            </button>
            <button
              type="button"
              onClick={() => handleTransactionTypeChange('expense')}
              className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                formData.transaction_type === 'expense'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-2">📉</div>
              <div className="font-medium">Chi phí</div>
              <div className="text-sm text-gray-600">Lương, thuê mặt bằng, etc.</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn danh mục</option>
              {availableCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label_vi}
                </option>
              ))}
            </select>
          </div>

          {/* Related Entity */}
          {formData.transaction_type === 'income' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Học sinh
              </label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn học sinh (tùy chọn)</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.transaction_type === 'expense' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhân viên
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn nhân viên (tùy chọn)</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cơ sở
                </label>
                <select
                  name="facility_id"
                  value={formData.facility_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn cơ sở (tùy chọn)</option>
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán *
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label_vi}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã tham chiếu
            </label>
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: TF001, SAL001"
            />
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày giao dịch *
            </label>
            <input
              type="date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn thanh toán
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="completed">Hoàn thành</option>
              <option value="pending">Chờ xử lý</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả *
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mô tả ngắn gọn về giao dịch"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ghi chú thêm về giao dịch..."
          />
        </div>

        {/* Items Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">Chi tiết các khoản mục</h4>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
            >
              <span>➕</span>
              <span>Thêm mục</span>
            </button>
          </div>

          {formData.items.length > 0 && (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-medium text-gray-900">Mục {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕ Xóa
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tên mục *
                      </label>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        required
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="VD: Sách giáo khoa"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Đơn giá
                      </label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1000"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Thành tiền
                      </label>
                      <input
                        type="number"
                        value={item.total_amount}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <input
                      type="text"
                      value={item.item_description}
                      onChange={(e) => updateItem(index, 'item_description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Mô tả chi tiết về mục này..."
                    />
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">Tổng cộng:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formData.items.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 text-white rounded-md transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu giao dịch'}
          </button>
        </div>
      </form>
    </div>
  );
}
