import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { BusinessTask, TaskInstance, TaskCategory, TaskPriority, TASK_CATEGORY_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, TASK_CATEGORY_COLORS } from '../shared/types';
import { formatDate, getStatusBadge } from '../shared/utils';
import { 
  CrudTable, 
  TableColumn, 
  TableAction, 
  FilterConfig, 
  FormModal, 
  FormGrid, 
  FormField 
} from '../shared';
import { useFormWithValidation, commonSchemas, createFormData } from '../../../lib/hooks/useFormWithValidation';
import { Badge } from '../../ui';

interface TasksTabCrudProps {
  tasks: BusinessTask[];
  taskInstances: TaskInstance[];
  isLoading: boolean;
  employees: any[];
  onSubmit: (data: any, formType: string) => Promise<void>;
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
  onView?: (task: any) => void;
  onAssign?: (task: any) => void;
  onComplete?: (taskInstance: any) => void;
  activeView?: 'templates' | 'instances';
  onViewChange?: (view: 'templates' | 'instances') => void;
}

// Task form validation schema
const taskSchema = z.object({
  title: commonSchemas.requiredString('Tiêu đề'),
  description: commonSchemas.optionalString,
  task_type: z.enum(['repeated', 'custom']),
  category: z.enum(['giảng_dạy', 'quản_lý', 'nhân_sự', 'hành_chính', 'kế_toán', 'marketing', 'an_ninh', 'vệ_sinh', 'liên_hệ_phụ_huynh', 'đánh_giá', 'vật_liệu', 'bảo_trì']).optional(),
  priority: z.enum(['cao', 'trung_bình', 'thấp']).optional(),
  estimated_hours: z.string().optional(),
  estimated_minutes: z.string().optional(),
  
  // Frequency fields for repeated tasks
  repeat: z.enum(['daily', 'weekly', 'monthly']).optional(),
  days: z.array(z.string()).optional(),
  day_of_month: z.string().optional(),
  time: commonSchemas.optionalString,
  
  // Additional metadata
  class_id: commonSchemas.optionalString,
  class_name: commonSchemas.optionalString,
  student_name: commonSchemas.optionalString,
  parent_phone: commonSchemas.optionalString,
  urgency: z.enum(['cao', 'trung_bình', 'thấp']).optional(),
  reason: commonSchemas.optionalString,
  department: commonSchemas.optionalString,
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function TasksTabCrud({
  tasks,
  taskInstances,
  isLoading,
  employees,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onAssign,
  onComplete,
  activeView = 'templates',
  onViewChange
}: TasksTabCrudProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<'repeated' | 'custom'>('custom');

  // Filter state
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    task_type: 'all',
    status: 'all',
    assigned_to: 'all'
  });

  // Use the form validation hook
  const form = useFormWithValidation<TaskFormData>({
    schema: taskSchema,
    defaultValues: {
      title: '',
      description: '',
      task_type: 'custom',
      category: undefined,
      priority: 'trung_bình',
      estimated_hours: '',
      estimated_minutes: '',
      repeat: undefined,
      days: [],
      day_of_month: '',
      time: '',
      class_id: '',
      class_name: '',
      student_name: '',
      parent_phone: '',
      urgency: 'trung_bình',
      reason: '',
      department: '',
    },
    onSubmit: async (data) => {
      const submitData: any = {
        title: data.title,
        description: data.description,
        task_type: data.task_type,
        meta_data: {
          category: data.category,
          priority: data.priority,
          estimated_hours: data.estimated_hours ? parseInt(data.estimated_hours) : undefined,
          estimated_minutes: data.estimated_minutes ? parseInt(data.estimated_minutes) : undefined,
          class_id: data.class_id,
          class_name: data.class_name,
          student_name: data.student_name,
          parent_phone: data.parent_phone,
          urgency: data.urgency,
          reason: data.reason,
          department: data.department,
        }
      };

      // Add frequency data for repeated tasks
      if (data.task_type === 'repeated') {
        submitData.frequency = {
          repeat: data.repeat,
          days: data.days,
          day_of_month: data.day_of_month ? parseInt(data.day_of_month) : undefined,
          time: data.time
        };
      }

      await onSubmit(submitData, 'BusinessTask');
      setShowCreateModal(false);
    },
    onSuccess: () => {
      form.resetForm();
    }
  });

  // Filter data based on active view and selected filters
  const filteredData = useMemo(() => {
    const dataToFilter = activeView === 'templates' ? tasks : taskInstances;
    
    return dataToFilter.filter((item: any) => {
      if (activeView === 'templates') {
        const task = item as BusinessTask;
        const matchesCategory = filters.category === 'all' || task.meta_data?.category === filters.category;
        const matchesPriority = filters.priority === 'all' || task.meta_data?.priority === filters.priority;
        const matchesType = filters.task_type === 'all' || task.task_type === filters.task_type;
        
        return matchesCategory && matchesPriority && matchesType;
      } else {
        const instance = item as TaskInstance;
        const matchesStatus = filters.status === 'all' || instance.status === filters.status;
        const matchesAssignedTo = filters.assigned_to === 'all' || instance.assigned_to_employee_id === filters.assigned_to;
        const matchesCategory = filters.category === 'all' || instance.task?.meta_data?.category === filters.category;
        const matchesPriority = filters.priority === 'all' || instance.task?.meta_data?.priority === filters.priority;
        
        return matchesStatus && matchesAssignedTo && matchesCategory && matchesPriority;
      }
    });
  }, [tasks, taskInstances, activeView, filters]);

  // Extract unique values for filter options
  const getFilterOptions = () => {
    const categories = Array.from(new Set([
      ...tasks.map(task => task.meta_data?.category).filter(Boolean),
      ...taskInstances.map(instance => instance.task?.meta_data?.category).filter(Boolean)
    ])) as string[];
    
    const priorities = Array.from(new Set([
      ...tasks.map(task => task.meta_data?.priority).filter(Boolean),
      ...taskInstances.map(instance => instance.task?.meta_data?.priority).filter(Boolean)
    ])) as string[];
    
    const types = Array.from(new Set(tasks.map(task => task.task_type).filter(Boolean))) as string[];
    const statuses = Array.from(new Set(taskInstances.map(instance => instance.status).filter(Boolean))) as string[];
    const assignees = Array.from(new Set(taskInstances.map(instance => instance.assigned_to_employee_id).filter(Boolean))) as string[];

    return {
      categories,
      priorities,
      types,
      statuses,
      assignees
    };
  };

  const filterOptions = getFilterOptions();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: 'all',
      priority: 'all',
      task_type: 'all',
      status: 'all',
      assigned_to: 'all'
    });
  };

  const handleModalCancel = () => {
    form.resetForm();
    setShowCreateModal(false);
  };

  const handleTaskTypeChange = (type: 'repeated' | 'custom') => {
    setSelectedTaskType(type);
    form.setValue('task_type', type);
  };

  // Filter configuration
  const getFilterConfig = (): FilterConfig[] => {
    const baseFilters = [
      {
        key: 'category',
        label: 'Danh mục',
        options: [
          { value: 'all', label: 'Tất cả danh mục' },
          ...filterOptions.categories.map(cat => ({
            value: cat,
            label: TASK_CATEGORY_LABELS[cat as TaskCategory] || cat
          }))
        ]
      },
      {
        key: 'priority',
        label: 'Độ ưu tiên',
        options: [
          { value: 'all', label: 'Tất cả độ ưu tiên' },
          ...filterOptions.priorities.map(priority => ({
            value: priority,
            label: TASK_PRIORITY_LABELS[priority as TaskPriority] || priority
          }))
        ]
      }
    ];

    if (activeView === 'templates') {
      baseFilters.push({
        key: 'task_type',
        label: 'Loại công việc',
        options: [
          { value: 'all', label: 'Tất cả loại' },
          { value: 'repeated', label: 'Lặp lại' },
          { value: 'custom', label: 'Tùy chỉnh' }
        ]
      });
    } else {
      baseFilters.push(
        {
          key: 'status',
          label: 'Trạng thái',
          options: [
            { value: 'all', label: 'Tất cả trạng thái' },
            ...filterOptions.statuses.map(status => ({
              value: status,
              label: TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] || status
            }))
          ]
        },
        {
          key: 'assigned_to',
          label: 'Người được giao',
          options: [
            { value: 'all', label: 'Tất cả người được giao' },
            ...employees.filter(emp => filterOptions.assignees.includes(emp.id)).map(emp => ({
              value: emp.id,
              label: emp.full_name
            }))
          ]
        }
      );
    }

    return baseFilters;
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<BusinessTask | TaskInstance>[] => {
    if (activeView === 'templates') {
      return [
        {
          key: 'title',
          label: 'Tiêu đề',
          render: (value, row) => {
            const task = row as BusinessTask;
            return (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                {task.description && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {task.description}
                  </div>
                )}
              </div>
            );
          }
        },
        {
          key: 'task_type',
          label: 'Loại',
          render: (value) => (
            <Badge className={value === 'repeated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
              {value === 'repeated' ? 'Lặp lại' : 'Tùy chỉnh'}
            </Badge>
          )
        },
        {
          key: 'category',
          label: 'Danh mục',
          render: (value, row) => {
            const task = row as BusinessTask;
            const category = task.meta_data?.category;
            return category ? (
              <Badge className={TASK_CATEGORY_COLORS[category as TaskCategory]}>
                {TASK_CATEGORY_LABELS[category as TaskCategory]}
              </Badge>
            ) : '-';
          }
        },
        {
          key: 'priority',
          label: 'Độ ưu tiên',
          render: (value, row) => {
            const task = row as BusinessTask;
            const priority = task.meta_data?.priority;
            return priority ? (
              <Badge className={TASK_PRIORITY_COLORS[priority as TaskPriority]}>
                {TASK_PRIORITY_LABELS[priority as TaskPriority]}
              </Badge>
            ) : '-';
          }
        },
        {
          key: 'created_by',
          label: 'Người tạo',
          render: (value, row) => {
            const task = row as BusinessTask;
            return (
              <div>
                <div className="font-medium">{task.created_by?.full_name || 'Không xác định'}</div>
                <div className="text-sm text-gray-500">{task.created_by?.position || ''}</div>
              </div>
            );
          }
        },
        {
          key: 'created_at',
          label: 'Ngày tạo',
          render: (value) => formatDate(value)
        }
      ];
    } else {
      return [
        {
          key: 'title',
          label: 'Tiêu đề',
          render: (value, row) => {
            const instance = row as TaskInstance;
            return (
              <div>
                <div className="font-medium text-gray-900">{instance.task?.title}</div>
                {instance.task?.description && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {instance.task.description}
                  </div>
                )}
              </div>
            );
          }
        },
        {
          key: 'assigned_to',
          label: 'Người được giao',
          render: (value, row) => {
            const instance = row as TaskInstance;
            return (
              <div>
                <div className="font-medium">{instance.assigned_to?.full_name || 'Chưa giao'}</div>
                <div className="text-sm text-gray-500">{instance.assigned_to?.position || ''}</div>
              </div>
            );
          }
        },
        {
          key: 'due_date',
          label: 'Hạn hoàn thành',
          render: (value) => formatDate(value)
        },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (value) => {
            const statusKey = value as keyof typeof TASK_STATUS_LABELS;
            return (
              <Badge className={TASK_STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-800'}>
                {TASK_STATUS_LABELS[statusKey] || value}
              </Badge>
            );
          }
        },
        {
          key: 'priority',
          label: 'Độ ưu tiên',
          render: (value, row) => {
            const instance = row as TaskInstance;
            const priority = instance.task?.meta_data?.priority;
            return priority ? (
              <Badge className={TASK_PRIORITY_COLORS[priority as TaskPriority]}>
                {TASK_PRIORITY_LABELS[priority as TaskPriority]}
              </Badge>
            ) : '-';
          }
        }
      ];
    }
  };

  // Create table actions configuration
  const getTableActions = (): TableAction<BusinessTask | TaskInstance>[] => {
    const actions: TableAction<BusinessTask | TaskInstance>[] = [];
    
    if (onView) {
      actions.push({
        label: 'Xem',
        icon: '👁️',
        onClick: onView,
        variant: 'secondary',
        iconOnly: true,
        tooltip: 'Xem chi tiết'
      });
    }
    
    if (activeView === 'templates') {
      if (onEdit) {
        actions.push({
          label: 'Sửa',
          icon: '✏️',
          onClick: onEdit,
          variant: 'primary',
          iconOnly: true,
          tooltip: 'Chỉnh sửa'
        });
      }

      if (onAssign) {
        actions.push({
          label: 'Giao việc',
          icon: '👤',
          onClick: onAssign,
          variant: 'primary',
          iconOnly: true,
          tooltip: 'Giao việc cho nhân viên'
        });
      }
      
      if (onDelete) {
        actions.push({
          label: 'Xóa',
          icon: '🗑️',
          onClick: onDelete,
          variant: 'danger',
          iconOnly: true,
          tooltip: 'Xóa'
        });
      }
    } else {
      if (onComplete) {
        actions.push({
          label: 'Hoàn thành',
          icon: '✅',
          onClick: onComplete,
          variant: 'primary',
          iconOnly: true,
          tooltip: 'Đánh dấu hoàn thành'
        });
      }
    }
    
    return actions;
  };

  // Render frequency fields for repeated tasks
  const renderFrequencyFields = () => {
    if (selectedTaskType !== 'repeated') return null;

    return (
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Cài đặt lặp lại</h3>
        <FormGrid columns={4} gap="md">
          <FormField label="Tần suất" required>
            <select
              {...form.register('repeat')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Chọn tần suất</option>
              <option value="daily">Hàng ngày</option>
              <option value="weekly">Hàng tuần</option>
              <option value="monthly">Hàng tháng</option>
            </select>
          </FormField>

          <FormField label="Thời gian">
            <input
              {...form.register('time')}
              type="time"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>

          {form.watch('repeat') === 'monthly' && (
            <FormField label="Ngày trong tháng">
              <input
                {...form.register('day_of_month')}
                type="number"
                min="1"
                max="31"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ngày (1-31)"
              />
            </FormField>
          )}
        </FormGrid>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      {onViewChange && (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => onViewChange('templates')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              activeView === 'templates'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mẫu công việc
          </button>
          <button
            onClick={() => onViewChange('instances')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              activeView === 'instances'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Công việc được giao
          </button>
        </div>
      )}

      <CrudTable
        data={filteredData}
        columns={getTableColumns()}
        isLoading={isLoading}
        filters={filters}
        filterConfigs={getFilterConfig()}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        customActions={getTableActions()}
        title={activeView === 'templates' ? 'Danh sách mẫu công việc' : 'Danh sách công việc được giao'}
        createButtonLabel={activeView === 'templates' ? 'Tạo mẫu công việc' : undefined}
        onCreateClick={activeView === 'templates' ? () => setShowCreateModal(true) : undefined}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          title: activeView === 'templates' ? 'Không có mẫu công việc nào' : 'Không có công việc nào được giao',
          description: activeView === 'templates' ? 'Chưa có mẫu công việc nào được tạo.' : 'Chưa có công việc nào được giao cho nhân viên.'
        }}
      />

      {/* Create Task Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo mẫu công việc mới"
        onSubmit={form.handleSubmit}
        onCancel={handleModalCancel}
        submitLabel="Tạo mẫu"
        cancelLabel="Hủy"
        isSubmitting={form.isSubmitting}
        maxWidth="4xl"
      >
        {form.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {form.submitError}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
          <FormGrid columns={2} gap="md">
            <FormField label="Tiêu đề" required>
              <input
                {...form.register('title')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập tiêu đề công việc"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </FormField>

            <FormField label="Loại công việc" required>
              <select
                {...form.register('task_type')}
                onChange={(e) => handleTaskTypeChange(e.target.value as 'repeated' | 'custom')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="custom">Tùy chỉnh</option>
                <option value="repeated">Lặp lại</option>
              </select>
            </FormField>

            <FormField label="Mô tả" className="md:col-span-2">
              <textarea
                {...form.register('description')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Mô tả chi tiết về công việc"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Task Details */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Chi tiết công việc</h3>
          <FormGrid columns={4} gap="md">
            <FormField label="Danh mục">
              <select
                {...form.register('category')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Chọn danh mục</option>
                {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Độ ưu tiên">
              <select
                {...form.register('priority')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Thời gian ước tính (giờ)">
              <input
                {...form.register('estimated_hours')}
                type="number"
                min="0"
                max="24"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Số giờ"
              />
            </FormField>

            <FormField label="Thời gian ước tính (phút)">
              <input
                {...form.register('estimated_minutes')}
                type="number"
                min="0"
                max="59"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Số phút"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Frequency Settings for Repeated Tasks */}
        {renderFrequencyFields()}

        {/* Additional Metadata */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormGrid columns={3} gap="md">
            <FormField label="Phòng ban">
              <input
                {...form.register('department')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Phòng ban liên quan"
              />
            </FormField>

            <FormField label="Lớp học">
              <input
                {...form.register('class_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên lớp học (nếu có)"
              />
            </FormField>

            <FormField label="Tên học sinh">
              <input
                {...form.register('student_name')}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tên học sinh (nếu có)"
              />
            </FormField>

            <FormField label="Lý do" className="md:col-span-3">
              <textarea
                {...form.register('reason')}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Lý do hoặc ghi chú thêm"
              />
            </FormField>
          </FormGrid>
        </div>
      </FormModal>
    </div>
  );
}
