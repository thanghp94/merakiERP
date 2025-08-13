import React, { useState, useEffect } from 'react';

interface InvoiceItem {
  item_name: string;
  item_description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface FormData {
  // Invoice basic info
  invoice_type: 'standard' | 'tuition' | 'payroll' | 'expense';
  is_income: boolean;
  
  // Related entities
  student_id: string;
  employee_id: string;
  facility_id: string;
  class_id: string;
  
  // Invoice details
  invoice_date: string;
  due_date: string;
  description: string;
  notes: string;
  
  // Financial details
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  
  // Invoice items
  items: InvoiceItem[];
  
  // Payment info (for creating linked payment record)
  create_payment: boolean;
  payment_method: string;
  payment_amount: number;
  payment_date: string;
  reference_number: string;
}

interface InvoiceFormNewProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function InvoiceFormNew({ onSubmit, onCancel, initialData }: InvoiceFormNewProps) {
  const [formData, setFormData] = useState<FormData>({
    invoice_type: 'standard',
    is_income: true,
    student_id: '',
    employee_id: '',
    facility_id: '',
    class_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    notes: '',
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    items: [],
    create_payment: false,
    payment_method: 'cash',
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: ''
  });

  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFormData();
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.discount_amount]);

  const loadFormData = async () => {
    try {
      // Load all reference data
      const [studentsRes, employeesRes, facilitiesRes, classesRes, categoriesRes, paymentMethodsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/employees'),
        fetch('/api/facilities'),
        fetch('/api/classes'),
        fetch('/api/finance-categories'),
        fetch('/api/payment-methods')
      ]);

      const [studentsData, employeesData, facilitiesData, classesData, categoriesData, paymentMethodsData] = await Promise.all([
        studentsRes.json(),
        employeesRes.json(),
        facilitiesRes.json(),
        classesRes.json(),
        categoriesRes.json(),
        paymentMethodsRes.json()
      ]);

      if (studentsData.success) setStudents(studentsData.data || []);
      if (employeesData.success) setEmployees(employeesData.data || []);
      if (facilitiesData.success) setFacilities(facilitiesData.data || []);
      if (classesData.success) setClasses(classesData.data || []);
      
      // Set categories with fallback
      if (categoriesData.success && categoriesData.data?.length > 0) {
        setCategories(categoriesData.data);
      } else {
        // Fallback categories
        const fallbackCategories = [
          // Income categories
          { value: 'tuition_fee', label_vi: 'Học phí', type: 'income' },
          { value: 'registration_fee', label_vi: 'Phí đăng ký', type: 'income' },
          { value: 'material_fee', label_vi: 'Phí tài liệu', type: 'income' },
          { value: 'exam_fee', label_vi: 'Phí thi', type: 'income' },
          { value: 'other_income', label_vi: 'Thu nhập khác', type: 'income' },
          // Expense categories
          { value: 'staff_salary', label_vi: 'Lương nhân viên', type: 'expense' },
          { value: 'teacher_bonus', label_vi: 'Thưởng giáo viên', type: 'expense' },
          { value: 'facility_rent', label_vi: 'Tiền thuê mặt bằng', type: 'expense' },
          { value: 'utilities', label_vi: 'Tiện ích', type: 'expense' },
          { value: 'equipment', label_vi: 'Thiết bị', type: 'expense' },
          { value: 'marketing', label_vi: 'Marketing', type: 'expense' },
          { value: 'other_expense', label_vi: 'Chi phí khác', type: 'expense' }
        ];
        setCategories(fallbackCategories);
      }
      
      // Set payment methods with fallback
      if (paymentMethodsData.success && paymentMethodsData.data?.length > 0) {
        setPaymentMethods(paymentMethodsData.data);
      } else {
        // Fallback payment methods
        const fallbackPaymentMethods = [
          { value: 'cash', label_vi: 'Tiền mặt' },
          { value: 'bank_transfer', label_vi: 'Chuyển khoản' },
          { value: 'credit_card', label_vi: 'Thẻ tín dụng' },
          { value: 'online_payment', label_vi: 'Thanh toán online' }
        ];
        setPaymentMethods(fallbackPaymentMethods);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      // Set fallback data in case of error
      const fallbackCategories = [
        { value: 'tuition_fee', label_vi: 'Học phí', type: 'income' },
        { value: 'registration_fee', label_vi: 'Phí đăng ký', type: 'income' },
        { value: 'staff_salary', label_vi: 'Lương nhân viên', type: 'expense' },
        { value: 'other_expense', label_vi: 'Chi phí khác', type: 'expense' }
      ];
      const fallbackPaymentMethods = [
        { value: 'cash', label_vi: 'Tiền mặt' },
        { value: 'bank_transfer', label_vi: 'Chuyển khoản' }
      ];
      setCategories(fallbackCategories);
      setPaymentMethods(fallbackPaymentMethods);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_amount, 0);
    const tax_amount = (subtotal * formData.tax_rate) / 100;
    const total_amount = subtotal + tax_amount - formData.discount_amount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount: Math.max(0, total_amount)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleIncomeTypeChange = (is_income: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_income,
      invoice_type: is_income ? 'tuition' : 'expense',
      // Reset related fields
      student_id: is_income ? prev.student_id : '',
      employee_id: is_income ? '' : prev.employee_id,
      items: [] // Reset items when changing type
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      item_name: '',
      item_description: '',
      category: '',
      quantity: 1,
      unit_price: 0,
      total_amount: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
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
      // Prepare invoice data
      const invoiceData = {
        ...formData,
        // Only include relevant IDs based on income type
        student_id: formData.is_income ? formData.student_id || null : null,
        employee_id: !formData.is_income ? formData.employee_id || null : null,
        facility_id: formData.facility_id || null,
        class_id: formData.class_id || null,
      };

      await onSubmit(invoiceData);
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const availableCategories = formData.is_income ? incomeCategories : expenseCategories;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
        {/* Invoice Type Selection - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Loại chi tiết *
            </label>
            <select
              name="invoice_type"
              value={formData.invoice_type}
              onChange={handleInputChange}
              required
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ngày hóa đơn *
            </label>
            <input
              type="date"
              name="invoice_date"
              value={formData.invoice_date}
              onChange={handleInputChange}
              required
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hạn thanh toán
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Related Entity Selection */}
          {formData.is_income && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Học sinh
              </label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
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
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nhân viên
              </label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleInputChange}
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Lớp học
            </label>
            <select
              name="class_id"
              value={formData.class_id}
              onChange={handleInputChange}
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cơ sở
            </label>
            <select
              name="facility_id"
              value={formData.facility_id}
              onChange={handleInputChange}
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
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mô tả hóa đơn *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
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
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleInputChange}
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
                name="discount_amount"
                value={formData.discount_amount}
                onChange={handleInputChange}
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
        <div className="border-t pt-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              name="create_payment"
              checked={formData.create_payment}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Tạo bản ghi thanh toán ngay
            </label>
          </div>

          {formData.create_payment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phương thức thanh toán *
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required={formData.create_payment}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label_vi}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền thanh toán *
                </label>
                <input
                  type="number"
                  name="payment_amount"
                  value={formData.payment_amount}
                  onChange={handleInputChange}
                  required={formData.create_payment}
                  min="0"
                  max={formData.total_amount}
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày thanh toán *
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleInputChange}
                  required={formData.create_payment}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã tham chiếu
                </label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: TF001, BANK123456"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ghi chú thêm về hóa đơn..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading || formData.items.length === 0}
            className={`px-4 py-1 text-white rounded text-sm transition-colors ${
              isLoading || formData.items.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Tạo hóa đơn')}
          </button>
        </div>
      </form>
  );
}
