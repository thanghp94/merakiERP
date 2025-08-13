import React, { useState } from 'react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {initialData ? 'Cập nhật thông tin khách hàng' : 'Thêm khách hàng tiềm năng'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tên học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tên phụ huynh</label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Khu vực</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="VD: Quận 1, TP.HCM"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="fanpage_inquiry">Hỏi Fanpage</option>
                  <option value="zalo_consultation">Tư vấn Zalo</option>
                  <option value="trial_class">Học thử</option>
                  <option value="enrolled">Đã đăng ký</option>
                  <option value="follow_up">Theo sát</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Thông tin bổ sung</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nguồn khách hàng</label>
                  <select
                    name="data.source"
                    value={formData.data.source}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Chọn nguồn</option>
                    <option value="facebook">Facebook</option>
                    <option value="zalo">Zalo</option>
                    <option value="website">Website</option>
                    <option value="referral">Giới thiệu</option>
                    <option value="walk_in">Đến trực tiếp</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Chương trình quan tâm</label>
                  <select
                    name="data.interested_program"
                    value={formData.data.interested_program}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Chọn chương trình</option>
                    <option value="grapeseed">GrapeSEED</option>
                    <option value="ielts">IELTS</option>
                    <option value="toeic">TOEIC</option>
                    <option value="general_english">Tiếng Anh Giao Tiếp</option>
                    <option value="kids">Tiếng Anh Trẻ Em</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngân sách dự kiến</label>
                  <input
                    type="number"
                    name="data.budget"
                    value={formData.data.budget}
                    onChange={handleChange}
                    placeholder="VND"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mức độ ưu tiên</label>
                  <select
                    name="data.urgency"
                    value={formData.data.urgency}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Zalo ID</label>
                  <input
                    type="text"
                    name="data.zalo_id"
                    value={formData.data.zalo_id}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Facebook Profile</label>
                  <input
                    type="text"
                    name="data.facebook_profile"
                    value={formData.data.facebook_profile}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Nguồn giới thiệu</label>
                <input
                  type="text"
                  name="data.referral_source"
                  value={formData.data.referral_source}
                  onChange={handleChange}
                  placeholder="Tên người giới thiệu hoặc nguồn cụ thể"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea
                  name="data.notes"
                  value={formData.data.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ghi chú về khách hàng, nhu cầu, tình hình..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {initialData ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionForm;
