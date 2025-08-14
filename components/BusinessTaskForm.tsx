import React, { useState, useEffect } from 'react';
import { 
  BusinessTaskType, 
  TaskCategory, 
  TaskPriority,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_LABELS
} from './dashboard/shared/types';
import FormModal, { FormGrid, FormField } from './dashboard/shared/FormModal';

interface BusinessTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const BusinessTaskForm: React.FC<BusinessTaskFormProps> = ({ 
  isOpen,
  onClose,
  onSubmit, 
  initialData = {}, 
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    task_type: (initialData.task_type as BusinessTaskType) || 'custom',
    category: (initialData.meta_data?.category as TaskCategory) || 'hành_chính',
    priority: (initialData.meta_data?.priority as TaskPriority) || 'trung_bình',
    estimated_hours: initialData.meta_data?.estimated_hours || '',
    estimated_minutes: initialData.meta_data?.estimated_minutes || '',
    created_by_employee_id: initialData.created_by_employee_id || '',
    
    // Frequency fields for repeated tasks
    repeat_type: initialData.frequency?.repeat || 'weekly',
    repeat_days: initialData.frequency?.days || [],
    repeat_day_of_month: initialData.frequency?.day_of_month || '',
    repeat_time: initialData.frequency?.time || '',
    
    // Additional metadata fields
    class_name: initialData.meta_data?.class_name || '',
    student_name: initialData.meta_data?.student_name || '',
    parent_phone: initialData.meta_data?.parent_phone || '',
    department: initialData.meta_data?.department || '',
    materials: initialData.meta_data?.materials?.join(', ') || '',
    notes: initialData.meta_data?.notes || ''
  });

  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const weekDays = [
    'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 
    'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'
  ];

  const departments = [
    'Hành chính nhân sự',
    'Vận hành', 
    'Chăm sóc khách hàng',
    'Tài chính',
    'Ban giám đốc'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();

      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDaysChange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      repeat_days: prev.repeat_days.includes(day)
        ? prev.repeat_days.filter((d: string) => d !== day)
        : [...prev.repeat_days, day]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Build frequency object for repeated tasks
      let frequency: any = null;
      if (formData.task_type === 'repeated') {
        frequency = {
          repeat: formData.repeat_type as 'daily' | 'weekly' | 'monthly'
        };

        if (formData.repeat_type === 'weekly' && formData.repeat_days.length > 0) {
          frequency.days = formData.repeat_days;
        }
        if (formData.repeat_type === 'monthly' && formData.repeat_day_of_month) {
          frequency.day_of_month = parseInt(formData.repeat_day_of_month);
        }
        if (formData.repeat_type === 'daily' && formData.repeat_time) {
          frequency.time = formData.repeat_time;
        }
      }

      // Build metadata object
      const meta_data: any = {
        category: formData.category,
        priority: formData.priority
      };

      if (formData.estimated_hours) meta_data.estimated_hours = parseFloat(formData.estimated_hours);
      if (formData.estimated_minutes) meta_data.estimated_minutes = parseFloat(formData.estimated_minutes);
      if (formData.class_name) meta_data.class_name = formData.class_name;
      if (formData.student_name) meta_data.student_name = formData.student_name;
      if (formData.parent_phone) meta_data.parent_phone = formData.parent_phone;
      if (formData.department) meta_data.department = formData.department;
      if (formData.materials) meta_data.materials = formData.materials.split(',').map((m: string) => m.trim());
      if (formData.notes) meta_data.notes = formData.notes;

      const submitData = {
        title: formData.title,
        description: formData.description,
        task_type: formData.task_type,
        frequency,
        meta_data,
        created_by_employee_id: formData.created_by_employee_id || null
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          title: '',
          description: '',
          task_type: 'custom',
          category: 'hành_chính',
          priority: 'trung_bình',
          estimated_hours: '',
          estimated_minutes: '',
          created_by_employee_id: '',
          repeat_type: 'weekly',
          repeat_days: [],
          repeat_day_of_month: '',
          repeat_time: '',
          class_name: '',
          student_name: '',
          parent_phone: '',
          department: '',
          materials: '',
          notes: ''
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa mẫu công việc' : 'Tạo mẫu công việc mới'}
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel={isEditing ? 'Cập nhật' : 'Tạo mẫu'}
      isSubmitting={isSubmitting}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
          <FormGrid columns={2}>
            <FormField label="Tiêu đề công việc" required>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="Nhập tiêu đề công việc"
              />
            </FormField>

            <FormField label="Loại công việc" required>
              <select
                name="task_type"
                value={formData.task_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="custom">Một lần</option>
                <option value="repeated">Lặp lại</option>
              </select>
            </FormField>
          </FormGrid>

          <FormField label="Mô tả công việc" className="mt-4">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              placeholder="Mô tả chi tiết về công việc"
            />
          </FormField>
        </div>

        {/* Category and Priority */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Phân loại</h3>
          <FormGrid columns={3}>
            <FormField label="Danh mục" required>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Mức độ ưu tiên">
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Người tạo">
              <select
                name="created_by_employee_id"
                value={formData.created_by_employee_id}
                onChange={handleChange}
                disabled={isLoadingData}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="">Chọn nhân viên</option>
                {employees.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} - {employee.position}
                  </option>
                ))}
              </select>
            </FormField>
          </FormGrid>
        </div>

        {/* Time Estimation */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thời gian ước tính</h3>
          <FormGrid columns={2}>
            <FormField label="Số giờ">
              <input
                type="number"
                name="estimated_hours"
                value={formData.estimated_hours}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="0"
              />
            </FormField>

            <FormField label="Số phút">
              <input
                type="number"
                name="estimated_minutes"
                value={formData.estimated_minutes}
                onChange={handleChange}
                min="0"
                max="59"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="0"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Frequency Settings for Repeated Tasks */}
        {formData.task_type === 'repeated' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt lặp lại</h3>
            <FormGrid columns={2}>
              <FormField label="Loại lặp lại" required>
                <select
                  name="repeat_type"
                  value={formData.repeat_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="daily">Hàng ngày</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="monthly">Hàng tháng</option>
                </select>
              </FormField>

              {formData.repeat_type === 'monthly' && (
                <FormField label="Ngày trong tháng">
                  <input
                    type="number"
                    name="repeat_day_of_month"
                    value={formData.repeat_day_of_month}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="25"
                  />
                </FormField>
              )}

              {formData.repeat_type === 'daily' && (
                <FormField label="Thời gian">
                  <input
                    type="time"
                    name="repeat_time"
                    value={formData.repeat_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </FormField>
              )}
            </FormGrid>

            {formData.repeat_type === 'weekly' && (
              <FormField label="Các ngày trong tuần" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.repeat_days.includes(day)}
                        onChange={() => handleDaysChange(day)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </FormField>
            )}
          </div>
        )}

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin bổ sung</h3>
          <FormGrid columns={2}>
            <FormField label="Tên lớp học">
              <input
                type="text"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="VD: GrapeSEED A1"
              />
            </FormField>

            <FormField label="Tên học sinh">
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="VD: Nguyễn Văn A"
              />
            </FormField>

            <FormField label="Số điện thoại phụ huynh">
              <input
                type="tel"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="0987654321"
              />
            </FormField>

            <FormField label="Phòng ban">
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </FormField>
          </FormGrid>

          <FormField label="Vật liệu cần thiết" className="mt-4">
            <input
              type="text"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              placeholder="VD: giấy A4, bút màu, máy chiếu (cách nhau bằng dấu phẩy)"
            />
          </FormField>

          <FormField label="Ghi chú" className="mt-4">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              placeholder="Ghi chú thêm về công việc"
            />
          </FormField>
        </div>
      </div>
    </FormModal>
  );
};

export default BusinessTaskForm;
