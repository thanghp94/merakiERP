import React, { useState, useEffect, useMemo } from 'react';

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

const WorkScheduleModal: React.FC<WorkScheduleModalProps> = ({
  isOpen,
  onClose,
  employee,
  canEdit = false
}) => {
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [showWeeklyView, setShowWeeklyView] = useState(false);

  const daysOfWeek = [
    { key: 'monday', label: 'Thứ Hai' },
    { key: 'tuesday', label: 'Thứ Ba' },
    { key: 'wednesday', label: 'Thứ Tư' },
    { key: 'thursday', label: 'Thứ Năm' },
    { key: 'friday', label: 'Thứ Sáu' },
    { key: 'saturday', label: 'Thứ Bảy' },
    { key: 'sunday', label: 'Chủ Nhật' }
  ];

  const [formData, setFormData] = useState<Partial<WorkSchedule>>({
    day: 'monday',
    start_time: '08:00',
    end_time: '17:00',
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    if (isOpen && employee) {
      loadWorkSchedules();
    }
  }, [isOpen, employee]);

  const loadWorkSchedules = () => {
    if (!employee?.data?.work_schedules) {
      setWorkSchedules([]);
      return;
    }

    const schedules = employee.data.work_schedules || [];
    setWorkSchedules(schedules);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSaveSchedule = async () => {
    if (!employee || !formData.day || !formData.start_time || !formData.end_time) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setIsSaving(true);

    try {
      const newSchedule: WorkSchedule = {
        id: editingSchedule?.id || Date.now().toString(),
        day: formData.day!,
        start_time: formData.start_time!,
        end_time: formData.end_time!,
        is_active: formData.is_active ?? true,
        notes: formData.notes
      };

      let updatedSchedules;
      if (editingSchedule) {
        // Update existing schedule
        updatedSchedules = workSchedules.map(schedule => 
          schedule.id === editingSchedule.id ? newSchedule : schedule
        );
      } else {
        // Add new schedule
        updatedSchedules = [...workSchedules, newSchedule];
      }

      // Update employee data
      const updatedEmployeeData = {
        ...employee.data,
        work_schedules: updatedSchedules
      };

      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedEmployeeData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setWorkSchedules(updatedSchedules);
        setShowAddForm(false);
        setEditingSchedule(null);
        setFormData({
          day: 'monday',
          start_time: '08:00',
          end_time: '17:00',
          is_active: true,
          notes: ''
        });
        alert(editingSchedule ? 'Cập nhật lịch làm việc thành công!' : 'Thêm lịch làm việc thành công!');
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving work schedule:', error);
      alert('Có lỗi xảy ra khi lưu lịch làm việc!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSchedule = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setShowAddForm(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!employee || !confirm('Bạn có chắc chắn muốn xóa lịch làm việc này?')) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedSchedules = workSchedules.filter(schedule => schedule.id !== scheduleId);

      const updatedEmployeeData = {
        ...employee.data,
        work_schedules: updatedSchedules
      };

      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedEmployeeData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setWorkSchedules(updatedSchedules);
        alert('Xóa lịch làm việc thành công!');
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting work schedule:', error);
      alert('Có lỗi xảy ra khi xóa lịch làm việc!');
    } finally {
      setIsSaving(false);
    }
  };

  const getDayLabel = (day: string) => {
    return daysOfWeek.find(d => d.key === day)?.label || day;
  };

  const formatTime = (time: string) => {
    return time;
  };

  // Weekly View Component
  const WorkScheduleWeeklyView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const weekDays = [
      { key: 'monday', label: 'Thứ Hai' },
      { key: 'tuesday', label: 'Thứ Ba' },
      { key: 'wednesday', label: 'Thứ Tư' },
      { key: 'thursday', label: 'Thứ Năm' },
      { key: 'friday', label: 'Thứ Sáu' },
      { key: 'saturday', label: 'Thứ Bảy' },
      { key: 'sunday', label: 'Chủ Nhật' }
    ];

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
            const schedules = getSchedulesForDay(day.key);
            const date = weekDates[index];
            
            return (
              <div key={day.key} className="p-3 min-h-[120px]">
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
                  setFormData({
                    day: 'monday',
                    start_time: '08:00',
                    end_time: '17:00',
                    is_active: true,
                    notes: ''
                  });
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
              <WorkScheduleWeeklyView key={workSchedules.length} />
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && canEdit && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-lg font-medium mb-4">
                {editingSchedule ? 'Chỉnh sửa lịch làm việc' : 'Thêm lịch làm việc mới'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày trong tuần
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day.key} value={day.key}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ kết thúc
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleFormChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Kích hoạt</span>
                  </label>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú về lịch làm việc..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingSchedule(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                  className={`px-6 py-2 text-white rounded-lg transition-colors ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? 'Đang lưu...' : (editingSchedule ? 'Cập nhật' : 'Thêm')}
                </button>
              </div>
            </div>
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
