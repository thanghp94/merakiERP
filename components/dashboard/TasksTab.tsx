import React from 'react';
import TaskForm from '../TaskForm';
import { Task } from './shared/types';
import { formatDate, getStatusBadge } from './shared/utils';
import { DataTable, TableColumn } from './shared';

interface TasksTabProps {
  showTaskForm: boolean;
  setShowTaskForm: (show: boolean) => void;
  tasks: Task[];
  isLoadingTasks: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function TasksTab({
  showTaskForm,
  setShowTaskForm,
  tasks,
  isLoadingTasks,
  handleFormSubmit
}: TasksTabProps) {
  // Create table columns configuration
  const getTableColumns = (): TableColumn<Task>[] => {
    return [
      {
        key: 'title',
        label: 'Tiêu đề',
        render: (value, row) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {row.data?.instructions && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {row.data.instructions}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'class_name',
        label: 'Lớp học',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.classes?.class_name || 'N/A'}
          </div>
        )
      },
      {
        key: 'description',
        label: 'Mô tả',
        render: (value) => (
          <div className="text-sm text-gray-900 truncate max-w-xs">
            {value || '-'}
          </div>
        )
      },
      {
        key: 'due_date',
        label: 'Hạn nộp',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {formatDate(value)}
          </div>
        )
      },
      {
        key: 'points',
        label: 'Điểm số',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.points || '-'}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => getStatusBadge(value)
      }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Bài tập</h2>
        <button
          onClick={() => setShowTaskForm(!showTaskForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
        >
          <span>{showTaskForm ? '📋' : '➕'}</span>
          <span>{showTaskForm ? 'Xem danh sách' : 'Thêm bài tập'}</span>
        </button>
      </div>

      {showTaskForm ? (
        <TaskForm onSubmit={(data) => handleFormSubmit(data, 'Task')} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Danh sách bài tập ({tasks.length})
              </h3>
            </div>

            <DataTable
              data={tasks}
              columns={getTableColumns()}
              isLoading={isLoadingTasks}
              emptyState={{
                icon: (
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                title: 'Không có bài tập nào',
                description: 'Chưa có bài tập nào được tạo.'
              }}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
