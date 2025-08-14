import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { 
  DayOfWeekSelector, 
  WorkScheduleTimeInput,
  FormModal,
  FormGrid,
  FormField
} from '../shared';
import { useFormWithValidation, commonSchemas } from '../../../lib/hooks/useFormWithValidation';
import { DAYS_OF_WEEK } from '../../../lib/constants/businessOptions';

interface WorkSchedule {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  break_start?: string;
  break_end?: string;
  notes?: string;
}

interface WorkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    full_name: string;
    data?: any;
  } | null;
  canEdit?: boolean;
}

// Work schedule validation schema
const workScheduleSchema = z.object({
  day: commonSchemas.requiredString('Ngày trong tuần'),
  start_time: commonSchemas.requiredString('Giờ bắt đầu'),
  end_time: commonSchemas.requiredString('Giờ kết thúc'),
  is_active: z.boolean(),
  break_start: commonSchemas.optionalString,
  break_end: commonSchemas.optionalString,
  notes: commonSchemas.optionalString,
});

type WorkScheduleFormData = z.infer<typeof workScheduleSchema>;

const WorkScheduleModal: React.FC<WorkScheduleModalProps> = ({
  isOpen,
  onClose,
  employee,
  canEdit = false
}) => {
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [showWeeklyView, setShowWeeklyView] = useState(false);

  // Use the form validation hook
  const form = useFormWithValidation<WorkScheduleFormData>({
    schema: workScheduleSchema,
    defaultValues: {
      day: 'monday',
      start_time: '08:00',
      end_time: '17:00',
      is_active: true,
      break_start: '',
      break_end: '',
      notes: '',
    },
    onSubmit: async (data) => {
      if (!employee) return;

      const newSchedule: WorkSchedule = {
        id: editingSchedule?.id || Date.now().toString(),
        day: data.day,
        start_time: data.start_time,
        end_time: data.end_time,
        is_active: data.is_active,
        break_start: data.break_start,
        break_end: data.break_end,
        notes: data.notes
      };

      const updatedSchedules = editingSchedule
        ? workSchedules.map(schedule => 
            schedule.id === editingSchedule.id ? newSchedule : schedule
          )
        : [...workSchedules, newSchedule];

      // Update employee data
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...employee.data,
            work_schedules: updatedSchedules
          }
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }

      setWorkSchedules(updatedSchedules);
      setShowAddForm(false);
      setEditingSchedule(null);
    },
    onSuccess: () => {
      form.resetForm();
    }
  });

  useEffect(() => {
    if (isOpen && employee) {
      const schedules = employee.data?.work_schedules || [];
      setWorkSchedules(schedules);
    }
  }, [isOpen, employee]);

  const handleEditSchedule = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    form.resetForm();
    form.setValue('day', schedule.day);
    form.setValue('start_time', schedule.start_time);
    form.setValue('end_time', schedule.end_time);
    form.setValue('is_active', schedule.is_active);
    form.setValue('break_start', schedule.break_start || '');
    form.setValue('break_end', schedule.break_end || '');
    form.setValue('notes', schedule.notes || '');
    setShowAddForm(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!employee || !confirm('Bạn có chắc chắn muốn xóa lịch làm việc này?')) {
      return;
    }

    try {
      const updatedSchedules = workSchedules.filter(schedule => schedule.id !== scheduleId);
      
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...employee.data,
            work_schedules: updatedSchedules
          }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setWorkSchedules(updatedSchedules);
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting work schedule:', error);
      alert('Có lỗi xảy ra khi xóa lịch làm việc!');
    }
  };

  const getDayLabel = (day: string) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const formatTime = (time: string) => {
    return time;
  };

  // Weekly View Component
  const WorkScheduleWeeklyView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const weekDays = DAYS_OF_WEEK;

    const getWeekDates = () => {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(date);
      }
      return weekDates;
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      setCurrentDate(newDate);
    };

    const getSchedulesForDay = (dayKey: string) => {
      return workSchedules.filter(schedule => schedule.day === dayKey && schedule.is_active);
    };

    const weekDates = getWeekDates();

    return (
      <div className="bg-white rounded-lg border">
        {/* Weekly View Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium">Lịch làm việc tuần</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <span className="font-medium min-w-[120px] text-center">
                {weekDates[0].toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - {weekDates[6].toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {weekDays.map((day, index) => {
            const schedules = getSchedulesForDay(day.value);
            const date = weekDates[index];
            
            return (
              <div key={day.value} className="p-3 min-h-[120px]">
                <div className="text-center mb-2">
                  <div className="font-semibold text-sm">{day.label}</div>
                  <div className="text-xs text-gray-600">
                    {date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                  </div>
                </div>
                
                {schedules.length > 0 ? (
                  <div className="space-y-1">
                    {schedules.map((schedule, scheduleIndex) => (
                      <div key={`${schedule.id}-${scheduleIndex}`} className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                        <div className="font-medium text-blue-800">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                        {schedule.notes && (
                          <div className="text-blue-600 mt-1 text-xs">
                            {schedule.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-xs">
                    Không có lịch
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Lịch làm việc</h3>
              <p className="text-sm text-gray-600 mt-1">
                {employee?.full_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex gap-3">
            {canEdit && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingSchedule(null);
                  form.resetForm();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                Thêm lịch làm việc
              </button>
            )}
            
            <button
              onClick={() => setShowWeeklyView(!showWeeklyView)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📅</span>
              {showWeeklyView ? 'Ẩn lịch tuần' : 'Xem lịch làm việc'}
            </button>
          </div>

          {/* Weekly View */}
          {showWeeklyView && (
            <div className="mb-6">
              <WorkScheduleWeeklyView />
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && canEdit && (
            <FormModal
              isOpen={showAddForm}
              onClose={() => {
                setShowAddForm(false);
                setEditingSchedule(null);
                form.resetForm();
              }}
              title={editingSchedule ? 'Chỉnh sửa lịch làm việc' : 'Thêm lịch làm việc mới'}
              onSubmit={form.handleSubmit}
              onCancel={() => {
                setShowAddForm(false);
                setEditingSchedule(null);
                form.resetForm();
              }}
              submitLabel={editingSchedule ? 'Cập nhật' : 'Thêm'}
              cancelLabel="Hủy"
              isSubmitting={form.isSubmitting}
              maxWidth="4xl"
            >
              {form.submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {form.submitError}
                </div>
              )}

              <FormGrid columns={2} gap="md">
                <FormField label="Ngày trong tuần" required>
                  <DayOfWeekSelector
                    value={form.watch('day')}
                    onChange={(value) => form.setValue('day', value)}
                    required
                  />
                  {form.formState.errors.day && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.day.message}</p>
                  )}
                </FormField>

                <FormField label="Trạng thái">
                  <label className="flex items-center">
                    <input
                      {...form.register('is_active')}
                      type="checkbox"
                      className="mr-2"
                    />
                    <span className="text-sm">Kích hoạt</span>
                  </label>
                </FormField>
              </FormGrid>

              <div className="mt-4">
                <WorkScheduleTimeInput
                  startTime={form.watch('start_time')}
                  endTime={form.watch('end_time')}
                  onStartTimeChange={(time) => form.setValue('start_time', time)}
                  onEndTimeChange={(time) => form.setValue('end_time', time)}
                  includeBreak={true}
                  breakStartTime={form.watch('break_start')}
                  breakEndTime={form.watch('break_end')}
                  onBreakStartTimeChange={(time) => form.setValue('break_start', time)}
                  onBreakEndTimeChange={(time) => form.setValue('break_end', time)}
                  required
                />
                {form.formState.errors.start_time && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.start_time.message}</p>
                )}
                {form.formState.errors.end_time && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.end_time.message}</p>
                )}
              </div>

              <div className="mt-4">
                <FormField label="Ghi chú">
                  <textarea
                    {...form.register('notes')}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ghi chú về lịch làm việc..."
                  />
                </FormField>
              </div>
            </FormModal>
          )}

          {/* Work Schedules List */}
          <div>
            <h4 className="text-lg font-medium mb-4">Lịch làm việc hiện tại</h4>
            
            {workSchedules.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📅</div>
                <p className="text-gray-600">Chưa có lịch làm việc nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giờ làm việc
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ghi chú
                      </th>
                      {canEdit && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workSchedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getDayLabel(schedule.day)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            schedule.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.is_active ? 'Kích hoạt' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {schedule.notes || '-'}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSchedule(schedule)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkScheduleModal;
