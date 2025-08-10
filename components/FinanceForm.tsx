import React, { useState } from 'react';

interface FinanceFormProps {
  onSubmit: (financeData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const FinanceForm: React.FC<FinanceFormProps> = ({ 
  onSubmit, 
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

            <div>
              <label htmlFor="reference_id" className="block text-sm font-medium text-gray-700 mb-1">
                ID tham chiếu
              </label>
              <input
                type="text"
                id="reference_id"
                name="reference_id"
                value={formData.reference_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ID của đối tượng liên quan"
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Chi tiết thanh toán</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Chờ xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>

            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                Phương thức thanh toán
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Tiền mặt</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="credit_card">Thẻ tín dụng</option>
                <option value="e_wallet">Ví điện tử</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label htmlFor="receipt_number" className="block text-sm font-medium text-gray-700 mb-1">
                Số hóa đơn/biên lai
              </label>
              <input
                type="text"
                id="receipt_number"
                name="receipt_number"
                value={formData.receipt_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="HD001, BL001..."
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ghi chú thêm về giao dịch"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm giao dịch')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
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
            }}
          >
            {isEditing ? 'Hủy' : 'Xóa form'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinanceForm;
