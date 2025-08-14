import React, { useState, useEffect } from 'react';
import { 
  BusinessTask, 
  TaskInstance, 
  TaskStats,
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_CATEGORY_COLORS
} from './shared/types';
import { DataTable, TableColumn } from './shared';
import { Button, Badge } from '../ui';
import BusinessTaskForm from '../BusinessTaskForm';
import TaskInstanceForm from '../TaskInstanceForm';

interface BusinessTasksTabProps {
  employees?: any[];
}

export default function BusinessTasksTab({ employees = [] }: BusinessTasksTabProps) {
  const [activeView, setActiveView] = useState<'templates' | 'instances'>('instances');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  
  // Task Templates State
  const [taskTemplates, setTaskTemplates] = useState<BusinessTask[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // Task Instances State
  const [taskInstances, setTaskInstances] = useState<TaskInstance[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  useEffect(() => {
    if (activeView === 'templates') {
      fetchTaskTemplates();
    } else {
      fetchTaskInstances();
    }
  }, [activeView, statusFilter, categoryFilter, employeeFilter]);

  const fetchTaskTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      let url = '/api/tasks';
      const params = new URLSearchParams();
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setTaskTemplates(result.data || []);
      } else {
        console.error('Failed to fetch task templates:', result.message);
        setTaskTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching task templates:', error);
      setTaskTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchTaskInstances = async () => {
    setIsLoadingInstances(true);
    try {
      let url = '/api/task-instances';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (employeeFilter !== 'all') {
        params.append('assigned_to_employee_id', employeeFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setTaskInstances(result.data || []);
        setTaskStats(result.stats || {
          total: 0,
          pending: 0,
          completed: 0,
          overdue: 0
        });
      } else {
        console.error('Failed to fetch task instances:', result.message);
        setTaskInstances([]);
      }
    } catch (error) {
      console.error('Error fetching task instances:', error);
      setTaskInstances([]);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  const handleTaskTemplateSubmit = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Tạo mẫu công việc thành công!');
        setShowTaskForm(false);
        fetchTaskTemplates();
      } else {
        throw new Error(result.message || 'Failed to create task template');
      }
    } catch (error) {
      console.error('Error creating task template:', error);
      alert(`Lỗi khi tạo mẫu công việc: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTaskInstanceSubmit = async (taskInstanceData: any) => {
    try {
      const response = await fetch('/api/task-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskInstanceData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Tạo công việc thành công!');
        setShowInstanceForm(false);
        fetchTaskInstances();
      } else {
        throw new Error(result.message || 'Failed to create task instance');
      }
    } catch (error) {
      console.error('Error creating task instance:', error);
      alert(`Lỗi khi tạo công việc: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGenerateInstances = async () => {
    try {
      const response = await fetch('/api/tasks/generate-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Tạo công việc tự động thành công! Đã tạo ${result.data?.stats?.total_generated || 0} công việc.`);
        fetchTaskInstances();
      } else {
        throw new Error(result.message || 'Failed to generate task instances');
      }
    } catch (error) {
      console.error('Error generating task instances:', error);
      alert(`Lỗi khi tạo công việc tự động: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCompleteTask = async (taskInstanceId: number) => {
    try {
      const response = await fetch(`/api/task-instances`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_instance_id: taskInstanceId,
          status: 'completed',
          completion_data: {
            completed_at: new Date().toISOString(),
            notes: 'Đã hoàn thành'
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Đánh dấu hoàn thành công việc thành công!');
        fetchTaskInstances();
      } else {
        throw new Error(result.message || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert(`Lỗi khi hoàn thành công việc: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getTaskTemplateColumns = (): TableColumn<BusinessTask>[] => {
    return [
      {
        key: 'title',
        label: 'Tiêu đề',
        render: (value, row) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">
              {row.task_type === 'repeated' ? '🔄 Lặp lại' : '📝 Một lần'}
            </div>
          </div>
        )
      },
      {
        key: 'meta_data',
        label: 'Danh mục',
        render: (value) => {
          const category = value?.category;
          if (!category) return <span className="text-gray-400">-</span>;
          
          return (
            <Badge 
              variant="secondary" 
              className={TASK_CATEGORY_COLORS[category as keyof typeof TASK_CATEGORY_COLORS]}
            >
              {TASK_CATEGORY_LABELS[category as keyof typeof TASK_CATEGORY_LABELS]}
            </Badge>
          );
        }
      },
      {
        key: 'meta_data',
        label: 'Ưu tiên',
        render: (value) => {
          const priority = value?.priority;
          if (!priority) return <span className="text-gray-400">-</span>;
          
          return (
            <Badge 
              variant="secondary" 
              className={TASK_PRIORITY_COLORS[priority as keyof typeof TASK_PRIORITY_COLORS]}
            >
              {TASK_PRIORITY_LABELS[priority as keyof typeof TASK_PRIORITY_LABELS]}
            </Badge>
          );
        }
      },
      {
        key: 'frequency',
        label: 'Tần suất',
        render: (value, row) => {
          if (row.task_type !== 'repeated' || !value) {
            return <span className="text-gray-400">-</span>;
          }
          
          let frequencyText = '';
          if (value.repeat === 'daily') {
            frequencyText = 'Hàng ngày';
          } else if (value.repeat === 'weekly') {
            frequencyText = `Hàng tuần (${value.days?.join(', ') || ''})`;
          } else if (value.repeat === 'monthly') {
            frequencyText = `Hàng tháng (ngày ${value.day_of_month || ''})`;
          }
          
          return <div className="text-sm text-gray-700">{frequencyText}</div>;
        }
      },
      {
        key: 'created_by',
        label: 'Người tạo',
        render: (value) => (
          <div className="text-sm text-gray-700">
            {value?.full_name || 'N/A'}
          </div>
        )
      }
    ];
  };

  const getTaskInstanceColumns = (): TableColumn<TaskInstance>[] => {
    return [
      {
        key: 'task',
        label: 'Công việc',
        render: (value) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{value?.title || 'N/A'}</div>
            <div className="text-xs text-gray-500">{value?.description || ''}</div>
          </div>
        )
      },
      {
        key: 'assigned_to',
        label: 'Người thực hiện',
        render: (value) => (
          <div className="text-sm text-gray-700">
            {value?.full_name || 'Chưa phân công'}
          </div>
        )
      },
      {
        key: 'due_date',
        label: 'Hạn hoàn thành',
        render: (value) => {
          const dueDate = new Date(value);
          const now = new Date();
          const isOverdue = dueDate < now;
          
          return (
            <div className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
              {dueDate.toLocaleDateString('vi-VN')}
              {isOverdue && <div className="text-xs text-red-500">Quá hạn</div>}
            </div>
          );
        }
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => (
          <Badge 
            variant="secondary" 
            className={TASK_STATUS_COLORS[value as keyof typeof TASK_STATUS_COLORS]}
          >
            {TASK_STATUS_LABELS[value as keyof typeof TASK_STATUS_LABELS]}
          </Badge>
        )
      },
      {
        key: 'task',
        label: 'Danh mục',
        render: (value) => {
          const category = value?.meta_data?.category;
          if (!category) return <span className="text-gray-400">-</span>;
          
          return (
            <Badge 
              variant="secondary" 
              className={TASK_CATEGORY_COLORS[category as keyof typeof TASK_CATEGORY_COLORS]}
            >
              {TASK_CATEGORY_LABELS[category as keyof typeof TASK_CATEGORY_LABELS]}
            </Badge>
          );
        }
      },
      {
        key: 'actions',
        label: 'Thao tác',
        render: (_, row) => (
          <div className="flex space-x-2">
            {row.status === 'pending' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleCompleteTask(row.task_instance_id)}
              >
                ✅ Hoàn thành
              </Button>
            )}
          </div>
        )
      }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Công việc</h2>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={handleGenerateInstances}
          >
            🔄 Tạo công việc tự động
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowInstanceForm(true)}
          >
            ➕ Tạo công việc
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowTaskForm(true)}
          >
            📝 Tạo mẫu công việc
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeView === 'instances' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-600">Tổng công việc</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
            <div className="text-sm text-gray-600">Chờ thực hiện</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-gray-600">Đã hoàn thành</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
            <div className="text-sm text-gray-600">Quá hạn</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex space-x-2">
        <Button
          variant={activeView === 'instances' ? 'primary' : 'secondary'}
          onClick={() => setActiveView('instances')}
        >
          📋 Công việc hiện tại
        </Button>
        <Button
          variant={activeView === 'templates' ? 'primary' : 'secondary'}
          onClick={() => setActiveView('templates')}
        >
          📝 Mẫu công việc
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ thực hiện</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Tất cả</option>
            {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {activeView === 'instances' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Tất cả</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeView === 'instances' 
              ? `Danh sách công việc (${taskInstances.length})`
              : `Mẫu công việc (${taskTemplates.length})`
            }
          </h3>
        </div>

        {activeView === 'instances' ? (
          <DataTable
            data={taskInstances}
            columns={getTaskInstanceColumns()}
            isLoading={isLoadingInstances}
            emptyState={{
              icon: (
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
                </svg>
              ),
              title: 'Không có công việc nào',
              description: 'Chưa có công việc nào được tạo hoặc phân công.'
            }}
            className="border-0 shadow-none"
          />
        ) : (
          <DataTable
            data={taskTemplates}
            columns={getTaskTemplateColumns()}
            isLoading={isLoadingTemplates}
            emptyState={{
              icon: (
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              ),
              title: 'Không có mẫu công việc nào',
              description: 'Chưa có mẫu công việc nào được tạo.'
            }}
            className="border-0 shadow-none"
          />
        )}
      </div>

      {/* Task Form Modal */}
      <BusinessTaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleTaskTemplateSubmit}
      />

      {/* Task Instance Form Modal */}
      <TaskInstanceForm
        isOpen={showInstanceForm}
        onClose={() => setShowInstanceForm(false)}
        onSubmit={handleTaskInstanceSubmit}
      />
    </div>
  );
}
