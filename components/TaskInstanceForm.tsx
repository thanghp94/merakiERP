import React, { useState, useEffect } from 'react';
import { FormModal } from './dashboard/shared';

interface TaskInstanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const TaskInstanceForm: React.FC<TaskInstanceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    task_id: initialData.task_id || '',
    assigned_to_employee_id: initialData.assigned_to_employee_id || '',
    due_date: initialData.due_date || '',
    status: initialData.status || 'pending',
    completion_data: {
      notes: initialData.completion_data?.notes || '',
      priority: initialData.completion_data?.priority || 'trung_bình'
    }
  });

  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [tasksResponse, employeesResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/employees')
      ]);

      const tasksResult = await tasksResponse.json();
      const employeesResult = await employeesResponse.json();

      if (tasksResult.success) {
        setTasks(tasksResult.data);
      }
      if (employeesResult.success) {
        setEmployees(employeesResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('completion_data.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        completion_data: {
          ...prev.completion_data,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          task_id: '',
          assigned_to_employee_id: '',
          due_date: '',
          status: 'pending',
          completion_data: {
            notes: '',
            priority: 'trung_bình'
          }
        });
      }
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedTask = (): any => {
    return tasks.find((task: any) => task.task_id === parseInt(formData.task_id));
  };

  const getSelectedEmployee = (): any => {
    return employees.find((emp: any) => emp.id === formData.assigned_to_employee_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'cao': return 'text-red-600 bg-red-50';
      case 'trung_bình': return 'text-yellow-600 bg-yellow-50';
      case 'thấp': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = formData.due_date && new Date(formData.due_date) < new Date();

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Task Selection */}
      <div>
        <label htmlFor="task_id" className="block text-sm font-medium text-gray-700 mb-1">
          Mẫu công việc *
        </label>
        <select
          id="task_id"
          name="task_id"
          value={formData.task_id}
          onChange={handleChange}
          required
          disabled={isLoadingData}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Chọn mẫu công việc</option>
          {tasks.map((task: any) => (
            <option key={task.task_id} value={task.task_id}>
              {task.title} ({task.task_type === 'repeated' ? 'Lặp lại' : 'Một lần'})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Task Info */}
      {getSelectedTask() && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Thông tin mẫu công việc:</h3>
          <div className="text-sm text-blue-700">
            <div><strong>Tiêu đề:</strong> {getSelectedTask()?.title}</div>
            <div><strong>Mô tả:</strong> {getSelectedTask()?.description}</div>
            <div><strong>Danh mục:</strong> {getSelectedTask()?.meta_data?.category}</div>
            {getSelectedTask()?.meta_data?.estimated_hours && (
              <div><strong>Thời gian ước tính:</strong> {getSelectedTask()?.meta_data?.estimated_hours} giờ</div>
            )}
          </div>
        </div>
      )}

      {/* Assignment and Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="assigned_to_employee_id" className="block text-sm font-medium text-gray-700 mb-1">
            Giao cho nhân viên *
          </label>
          <select
            id="assigned_to_employee_id"
            name="assigned_to_employee_id"
            value={formData.assigned_to_employee_id}
            onChange={handleChange}
            required
            disabled={isLoadingData}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Chọn nhân viên</option>
            {employees.map((employee: any) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name} - {employee.position}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
            Hạn hoàn thành *
          </label>
          <input
            type="datetime-local"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
          />
          {isOverdue && (
            <p className="text-xs text-red-600 mt-1">⚠️ Thời hạn đã qua</p>
          )}
        </div>
      </div>

      {/* Selected Employee Info */}
      {getSelectedEmployee() && (
        <div className="bg-green-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-green-800 mb-2">Thông tin nhân viên được giao:</h3>
          <div className="text-sm text-green-700">
            <div><strong>Tên:</strong> {getSelectedEmployee()?.full_name}</div>
            <div><strong>Chức vụ:</strong> {getSelectedEmployee()?.position}</div>
            {getSelectedEmployee()?.data?.department && (
              <div><strong>Phòng ban:</strong> {getSelectedEmployee()?.data?.department}</div>
            )}
          </div>
        </div>
      )}

      {/* Status and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getStatusColor(formData.status)}`}
          >
            <option value="pending">Đang chờ</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </div>

        <div>
          <label htmlFor="completion_data.priority" className="block text-sm font-medium text-gray-700 mb-1">
            Mức độ ưu tiên
          </label>
          <select
            id="completion_data.priority"
            name="completion_data.priority"
            value={formData.completion_data.priority}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getPriorityColor(formData.completion_data.priority)}`}
          >
            <option value="thấp">Thấp</option>
            <option value="trung_bình">Trung bình</option>
            <option value="cao">Cao</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="completion_data.notes" className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú
        </label>
        <textarea
          id="completion_data.notes"
          name="completion_data.notes"
          value={formData.completion_data.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ghi chú thêm về công việc này..."
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading || isLoadingData}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo công việc')}
        </button>
        
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Hủy
        </button>
      </div>
    </form>
  );

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
    >
      {formContent}
    </FormModal>
  );
};

export default TaskInstanceForm;
