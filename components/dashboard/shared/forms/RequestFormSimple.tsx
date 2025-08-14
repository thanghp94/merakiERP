import React, { useState, useEffect } from 'react';
import { FormGrid, FormField } from '../index';
import { RequestType, REQUEST_TYPE_LABELS } from '../types';

interface RequestFormProps {
  onSubmit: (data: any) => Promise<{ success: boolean; message?: string }>;
  onCancel: () => void;
  employees: any[];
  currentUserId?: string;
}

const RequestForm: React.FC<RequestFormProps> = ({
  onSubmit,
  onCancel,
  employees,
  currentUserId
}) => {
  const [requestType, setRequestType] = useState<RequestType>('nghi_phep');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    request_type: 'nghi_phep' as RequestType,
    title: 'Yêu cầu nghỉ phép',
    description: '',
    created_by_employee_id: '',
    // Leave request fields
    from_date: '',
    to_date: '',
    reason: '',
    // Schedule change fields
    original_date: '',
    new_date: '',
    class_affected: '',
    // Advance payment fields
    amount: '',
    repayment_plan: '',
    // Purchase/repair fields
    item_name: '',
    estimated_cost: '',
    vendor: '',
  });

  // Update form data when currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      setFormData(prev => ({
        ...prev,
        created_by_employee_id: currentUserId
      }));
    }
  }, [currentUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestTypeChange = (newType: RequestType) => {
    setRequestType(newType);
    
    // Generate default title based on request type
    const defaultTitles = {
      nghi_phep: 'Yêu cầu nghỉ phép',
      doi_lich: 'Yêu cầu đổi lịch dạy',
      tam_ung: 'Yêu cầu tạm ứng',
      mua_sam_sua_chua: 'Yêu cầu mua sắm/sửa chữa',
    };
    
    setFormData(prev => ({
      ...prev,
      request_type: newType,
      title: defaultTitles[newType]
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Tiêu đề là bắt buộc';
    if (!formData.created_by_employee_id) return 'Người tạo yêu cầu là bắt buộc';

    switch (requestType) {
      case 'nghi_phep':
        if (!formData.from_date) return 'Ngày bắt đầu là bắt buộc';
        if (!formData.to_date) return 'Ngày kết thúc là bắt buộc';
        if (!formData.reason.trim()) return 'Lý do nghỉ phép là bắt buộc';
        break;
      case 'doi_lich':
        if (!formData.original_date) return 'Ngày dạy gốc là bắt buộc';
        if (!formData.new_date) return 'Ngày dạy mới là bắt buộc';
        break;
      case 'tam_ung':
        if (!formData.amount || parseFloat(formData.amount) <= 0) return 'Số tiền tạm ứng phải lớn hơn 0';
        if (!formData.repayment_plan.trim()) return 'Kế hoạch trả lại là bắt buộc';
        break;
      case 'mua_sam_sua_chua':
        if (!formData.item_name.trim()) return 'Tên vật phẩm là bắt buộc';
        if (!formData.estimated_cost || parseFloat(formData.estimated_cost) <= 0) return 'Chi phí ước tính phải lớn hơn 0';
        break;
    }
    return null;
  };

  const getRequestSpecificData = () => {
    switch (requestType) {
      case 'nghi_phep':
        const fromDate = new Date(formData.from_date);
        const toDate = new Date(formData.to_date);
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        return {
          from_date: formData.from_date,
          to_date: formData.to_date,
          total_days: daysDiff,
          reason: formData.reason,
        };
      case 'doi_lich':
        return {
          original_date: formData.original_date,
          new_date: formData.new_date,
          class_affected: formData.class_affected,
        };
      case 'tam_ung':
        return {
          amount: parseFloat(formData.amount),
          repayment_plan: formData.repayment_plan,
        };
      case 'mua_sam_sua_chua':
        return {
          item_name: formData.item_name,
          estimated_cost: parseFloat(formData.estimated_cost),
          vendor: formData.vendor,
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestData = {
        request_type: formData.request_type,
        title: formData.title,
        description: formData.description,
        created_by_employee_id: formData.created_by_employee_id,
        request_data: getRequestSpecificData(),
      };

      const result = await onSubmit(requestData);
      if (!result.success) {
        setError(result.message || 'Có lỗi xảy ra khi tạo yêu cầu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRequestSpecificFields = () => {
    switch (requestType) {
      case 'nghi_phep':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Ngày bắt đầu" required>
              <input
                name="from_date"
                type="date"
                value={formData.from_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Ngày kết thúc" required>
              <input
                name="to_date"
                type="date"
                value={formData.to_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Lý do nghỉ phép" required>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Nhập lý do nghỉ phép..."
                />
              </FormField>
            </div>
          </FormGrid>
        );

      case 'doi_lich':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Ngày dạy gốc" required>
              <input
                name="original_date"
                type="date"
                value={formData.original_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Ngày dạy mới" required>
              <input
                name="new_date"
                type="date"
                value={formData.new_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Lớp học bị ảnh hưởng">
                <input
                  name="class_affected"
                  type="text"
                  value={formData.class_affected}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Tên lớp học..."
                />
              </FormField>
            </div>
          </FormGrid>
        );

      case 'tam_ung':
        return (
          <FormGrid columns={1} gap="md">
            <FormField label="Số tiền tạm ứng (VNĐ)" required>
              <input
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                min="0"
                step="100000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="5000000"
              />
            </FormField>

            <FormField label="Kế hoạch trả lại" required>
              <textarea
                name="repayment_plan"
                value={formData.repayment_plan}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả kế hoạch trả lại tiền tạm ứng..."
              />
            </FormField>
          </FormGrid>
        );

      case 'mua_sam_sua_chua':
        return (
          <FormGrid columns={2} gap="md">
            <FormField label="Tên vật phẩm/dịch vụ" required>
              <input
                name="item_name"
                type="text"
                value={formData.item_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên vật phẩm cần mua hoặc sửa chữa..."
              />
            </FormField>

            <FormField label="Chi phí ước tính (VNĐ)" required>
              <input
                name="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={handleInputChange}
                min="0"
                step="10000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="1000000"
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Nhà cung cấp">
                <input
                  name="vendor"
                  type="text"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Tên nhà cung cấp (nếu có)..."
                />
              </FormField>
            </div>
          </FormGrid>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
        <FormGrid columns={2} gap="md">
          <FormField label="Loại yêu cầu" required>
            <select
              value={requestType}
              onChange={(e) => handleRequestTypeChange(e.target.value as RequestType)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Người tạo yêu cầu" required>
            <select
              name="created_by_employee_id"
              value={formData.created_by_employee_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Chọn nhân viên</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} - {employee.position}
                </option>
              ))}
            </select>
          </FormField>

          <div className="col-span-2">
            <FormField label="Tiêu đề yêu cầu" required>
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập tiêu đề yêu cầu..."
              />
            </FormField>
          </div>

          <div className="col-span-2">
            <FormField label="Mô tả chi tiết">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả chi tiết về yêu cầu..."
              />
            </FormField>
          </div>
        </FormGrid>
      </div>

      {/* Request-specific fields */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Chi tiết yêu cầu</h3>
        {renderRequestSpecificFields()}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
        </button>
      </div>
    </form>
  );
};

export default RequestForm;
