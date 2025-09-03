import React, { useState, useEffect } from 'react';
import TasksTab from '../../tasks/TasksTab';
import { Task } from '../../../shared/types';

interface TasksViewProps {
  employee: any;
}

const TasksView: React.FC<TasksViewProps> = ({ employee }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    if (employee) {
      fetchTasks();
    }
  }, [employee]);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      // Fetch tasks assigned to this employee
      const response = await fetch(`/api/tasks?assigned_to=${employee.id}`);
      const result = await response.json();
      setTasks(result.success ? result.data || [] : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleFormSubmit = async (data: any, formType: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          assigned_to: employee.id, // Auto-assign to current employee
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Tạo bài tập thành công!');
        setShowTaskForm(false);
        fetchTasks(); // Refresh the tasks list
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Có lỗi xảy ra khi tạo bài tập!');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Việc cần làm của tôi</h3>
        <p className="text-sm text-gray-600">Các công việc và bài tập được giao cho bạn</p>
      </div>

      {/* Reuse the existing TasksTab component but with personal context */}
      <TasksTab
        showTaskForm={showTaskForm}
        setShowTaskForm={setShowTaskForm}
        tasks={tasks}
        isLoadingTasks={isLoadingTasks}
        handleFormSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default TasksView;
