import React, { useState } from 'react';
import { FormModal, FormGrid, FormField } from './dashboard/shared';

interface AdmissionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const AdmissionForm: React.FC<AdmissionFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    student_name: initialData?.student_name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    parent_name: initialData?.parent_name || '',
    location: initialData?.location || '',
    status: initialData?.status || 'pending',
    data: {
      source: initialData?.data?.source || '',
      notes: initialData?.data?.notes || '',
      interested_program: initialData?.data?.interested_program || '',
      budget: initialData?.data?.budget || '',
      urgency: initialData?.data?.urgency || 'medium',
      zalo_id: initialData?.data?.zalo_id || '',
      facebook_profile: initialData?.data?.facebook_profile || '',
      referral_source: initialData?.data?.referral_source || ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('data.')) {
      const dataField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          [dataField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    onCancel();
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onCancel}
      title={initialData ? 'Cập nhật thông tin khách hàng' : 'Thêm khách hàng tiềm năng'}
      onSubmit={handleModalSubmit}
      onCancel={handleModalCancel}
      submitLabel={initialData ? 'Cập nhật' : 'Thêm mới'}
      cancelLabel="Hủy"
      isSubmitting={isSubmitting}
      maxWidth="5xl"
    >
      {/* Basic Information */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
        <FormGrid columns={3} gap="md">
          <FormField label="Tên học sinh" required>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập tên học sinh"
            />
          </FormField>

          <FormField label="Số điện thoại" required>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0901234567"
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="email@example.com"
            />
          </FormField>

          <FormField label="Tên phụ huynh">
            <input
              type="text"
              name="parent_name"
              value={formData.parent_name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập tên phụ huynh"
            />
          </FormField>

          <FormField label="Khu vực">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="VD: Quận 1, TP.HCM"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>

          <FormField label="Trạng thái">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="pending">Chờ xử lý</option>
              <option value="fanpage_inquiry">Hỏi Fanpage</option>
              <option value="zalo_consultation">Tư vấn Zalo</option>
              <option value="trial_class">Học thử</option>
              <option value="enrolled">Đã đăng ký</option>
              <option value="follow_up">Theo sát</option>
              <option value="rejected">Từ chối</option>
            </select>
          </FormField>
        </FormGrid>
      </div>

      {/* Marketing & Program Information */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin chương trình & tiếp thị</h3>
        <FormGrid columns={4} gap="md">
          <FormField label="Nguồn khách hàng">
            <select
              name="data.source"
              value={formData.data.source}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Chọn nguồn</option>
              <option value="facebook">Facebook</option>
              <option value="zalo">Zalo</option>
              <option value="website">Website</option>
              <option value="referral">Giới thiệu</option>
              <option value="walk_in">Đến trực tiếp</option>
              <option value="other">Khác</option>
            </select>
          </FormField>

          <FormField label="Chương trình quan tâm">
            <select
              name="data.interested_program"
              value={formData.data.interested_program}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Chọn chương trình</option>
              <option value="grapeseed">GrapeSEED</option>
              <option value="ielts">IELTS</option>
              <option value="toeic">TOEIC</option>
              <option value="general_english">Tiếng Anh Giao Tiếp</option>
              <option value="kids">Tiếng Anh Trẻ Em</option>
            </select>
          </FormField>

          <FormField label="Ngân sách dự kiến">
            <input
              type="number"
              name="data.budget"
              value={formData.data.budget}
              onChange={handleChange}
              placeholder="VND"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>

          <FormField label="Mức độ ưu tiên">
            <select
              name="data.urgency"
              value={formData.data.urgency}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </FormField>
        </FormGrid>
      </div>

      {/* Contact & Social Information */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin liên hệ & mạng xã hội</h3>
        <FormGrid columns={3} gap="md">
          <FormField label="Zalo ID">
            <input
              type="text"
              name="data.zalo_id"
              value={formData.data.zalo_id}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập Zalo ID"
            />
          </FormField>

          <FormField label="Facebook Profile">
            <input
              type="text"
              name="data.facebook_profile"
              value={formData.data.facebook_profile}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Link Facebook"
            />
          </FormField>

          <FormField label="Nguồn giới thiệu">
            <input
              type="text"
              name="data.referral_source"
              value={formData.data.referral_source}
              onChange={handleChange}
              placeholder="Tên người giới thiệu"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>
        </FormGrid>
      </div>

      {/* Additional Notes */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Ghi chú bổ sung</h3>
        <FormGrid columns={1} gap="md">
          <FormField label="Ghi chú">
            <textarea
              name="data.notes"
              value={formData.data.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Ghi chú về khách hàng, nhu cầu, tình hình..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>
        </FormGrid>
      </div>
    </FormModal>
  );
};

export default AdmissionForm;
