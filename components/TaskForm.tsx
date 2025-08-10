import React, { useState, useEffect } from 'react';

interface TaskFormProps {
  onSubmit: (taskData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    class_id: initialData.class_id || '',
    assigned_by: initialData.assigned_by || '',
    due_date: initialData.due_date || '',
    task_type: initialData.task_type || 'homework',
    status: initialData.status || 'active',
    max_score: initialData.data?.max_score || '',
    instructions: initialData.data?.instructions || '',
    attachments: initialData.data?.attachments || '',
    submission_format: initialData.data?.submission_format || 'text',
    notes: initialData.data?.notes || ''
  });

  const [classes, setClasses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesResponse, employeesResponse] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/employees')
      ]);

      const classesResult = await classesResponse.json();
      const employeesResult = await employeesResponse.json();

      if (classesResult.success) {
        setClasses(classesResult.data);
      }
      if (employeesResult.success) {
        // Filter only teachers
        const teachers = employeesResult.data.filter((emp: any) => 
          emp.position?.toLowerCase().includes('teacher') || 
          emp.position?.toLowerCase().includes('giáo viên')
        );
        setEmployees(teachers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        class_id: formData.class_id,
        assigned_by: formData.assigned_by || null,
        due_date: formData.due_date || null,
        task_type: formData.task_type,
        status: formData.status,
        data: {
          max_score: formData.max_score ? parseFloat(formData.max_score) : null,
          instructions: formData.instructions,
          attachments: formData.attachments,
          submission_format: formData.submission_format,
          notes: formData.notes
        }
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          title: '',
          description: '',
          class_id: '',
          assigned_by: '',
          due_date: '',
          task_type: 'homework',
          status: 'active',
          max_score: '',
          instructions: '',
          attachments: '',
          submission_format: 'text',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedClass = (): any => {
    return classes.find((cls: any) => cls.id === formData.class_id);
  };

  const getSelectedTeacher = (): any => {
    return employees.find((emp: any) => emp.id === formData.assigned_by);
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'homework': return 'text-blue-600 bg-blue-50';
      case 'project': return 'text-purple-600 bg-purple-50';
      case 'quiz': return 'text-green-600 bg-green-50';
      case 'exam': return 'text-red-600 bg-red-50';
      case 'assignment': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = formData.due_date && new Date(formData.due_date) < new Date();

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề bài tập *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tiêu đề bài tập"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về bài tập"
            />
          </div>
        </div>

        {/* Class and Teacher Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-1">
              Lớp học *
            </label>
            <select
              id="class_id"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              required
              disabled={isLoadingData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn lớp học</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} - {cls.facilities?.name || 'Không có cơ sở'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assigned_by" className="block text-sm font-medium text-gray-700 mb-1">
              Giáo viên giao bài
            </label>
            <select
              id="assigned_by"
              name="assigned_by"
              value={formData.assigned_by}
              onChange={handleChange}
              disabled={isLoadingData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn giáo viên</option>
              {employees.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} - {teacher.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Information Display */}
        {(getSelectedClass() || getSelectedTeacher()) && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin đã chọn:</h3>
            {getSelectedClass() && (
              <div className="text-sm text-gray-600 mb-2">
                <strong>Lớp học:</strong> {getSelectedClass()?.class_name} - 
                Bắt đầu: {new Date(getSelectedClass()?.start_date).toLocaleDateString('vi-VN')}
              </div>
            )}
            {getSelectedTeacher() && (
              <div className="text-sm text-gray-600">
                <strong>Giáo viên:</strong> {getSelectedTeacher()?.full_name} - {getSelectedTeacher()?.department}
              </div>
            )}
          </div>
        )}

        {/* Task Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="task_type" className="block text-sm font-medium text-gray-700 mb-1">
              Loại bài tập
            </label>
            <select
              id="task_type"
              name="task_type"
              value={formData.task_type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getTaskTypeColor(formData.task_type)}`}
            >
              <option value="homework">Bài tập về nhà</option>
              <option value="project">Dự án</option>
              <option value="quiz">Kiểm tra nhỏ</option>
              <option value="exam">Thi cử</option>
              <option value="assignment">Bài tập lớn</option>
            </select>
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Hạn nộp
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
            />
            {isOverdue && (
              <p className="text-xs text-red-600 mt-1">⚠️ Đã quá hạn</p>
            )}
          </div>

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
              <option value="active">Đang hoạt động</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="overdue">Quá hạn</option>
            </select>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Chi tiết bài tập</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="max_score" className="block text-sm font-medium text-gray-700 mb-1">
                Điểm tối đa
              </label>
              <input
                type="number"
                id="max_score"
                name="max_score"
                value={formData.max_score}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
            </div>

            <div>
              <label htmlFor="submission_format" className="block text-sm font-medium text-gray-700 mb-1">
                Định dạng nộp bài
              </label>
              <select
                id="submission_format"
                name="submission_format"
                value={formData.submission_format}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="text">Văn bản</option>
                <option value="file">Tệp đính kèm</option>
                <option value="presentation">Thuyết trình</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
              Hướng dẫn chi tiết
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Hướng dẫn chi tiết cách làm bài tập"
            />
          </div>

          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
              Tài liệu đính kèm (URL)
            </label>
            <input
              type="url"
              id="attachments"
              name="attachments"
              value={formData.attachments}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/document.pdf"
            />
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
            placeholder="Ghi chú thêm về bài tập"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoadingData}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo bài tập')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
                setFormData({
                  title: '',
                  description: '',
                  class_id: '',
                  assigned_by: '',
                  due_date: '',
                  task_type: 'homework',
                  status: 'active',
                  max_score: '',
                  instructions: '',
                  attachments: '',
                  submission_format: 'text',
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

export default TaskForm;
