import React, { useState } from 'react';

interface FinanceFormProps {
  onSubmit: (financeData: any) => void;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
}

const FinanceForm: React.FC<FinanceFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    type: initialData.type || 'income',
    category: initialData.category || '',
    amount: initialData.amount || '',
    description: initialData.description || '',
    reference_id: initialData.reference_id || '',
    reference_type: initialData.reference_type || '',
    transaction_date: initialData.transaction_date || new Date().toISOString().split('T')[0],
    status: initialData.status || 'completed',
    payment_method: initialData.data?.payment_method || 'cash',
    receipt_number: initialData.data?.receipt_number || '',
    notes: initialData.data?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        reference_id: formData.reference_id || null,
        reference_type: formData.reference_type || null,
        transaction_date: formData.transaction_date,
        status: formData.status,
        data: {
          payment_method: formData.payment_method,
          receipt_number: formData.receipt_number,
          notes: formData.notes
        }
      };

      await onSubmit(submitData);

      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          type: 'income',
          category: '',
          amount: '',
          description: '',
          reference_id: '',
          reference_type: '',
          transaction_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          payment_method: 'cash',
          receipt_number: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const incomeCategories = [
    'Học phí',
    'Phí đăng ký',
    'Phí thi cử',
    'Phí tài liệu',
    'Phí hoạt động',
    'Thu nhập khác'
  ];

  const expenseCategories = [
    'Lương nhân viên',
    'Tiền thuê mặt bằng',
    'Điện nước',
    'Tài liệu giảng dạy',
    'Thiết bị văn phòng',
    'Marketing',
    'Bảo trì sửa chữa',
    'Chi phí khác'
  ];

  const referenceTypes = [
    { value: 'student', label: 'Học sinh' },
    { value: 'employee', label: 'Nhân viên' },
    { value: 'facility', label: 'Cơ sở' },
    { value: 'class', label: 'Lớp học' },
    { value: 'other', label: 'Khác' }
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch tài chính'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Loại giao dịch *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getTypeColor(formData.type)}`}
            >
              <option value="income">Thu nhập</option>
              <option value="expense">Chi phí</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn danh mục</option>
              {(formData.type === 'income' ? incomeCategories : expenseCategories).map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền (VNĐ) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1000000"
            />
          </div>

          <div>
            <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-1">
              Ngày giao dịch *
            </label>
            <input
              type="date"
              id="transaction_date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả giao dịch *
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mô tả chi tiết về giao dịch"
          />
        </div>

        {/* Reference Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin tham chiếu (tùy chọn)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reference_type" className="block text-sm font-medium text-gray-700 mb-1">
                Loại tham chiếu
              </label>
              <select
                id="reference_type"
                name="reference_type"
                value={formData.reference_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Không có</option>
                {referenceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEditing ? 'Cập nhật' : 'Thêm giao dịch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinanceForm;
