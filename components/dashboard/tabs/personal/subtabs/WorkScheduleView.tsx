import React, { useState } from 'react';
import WorkScheduleModal from '../../employees/WorkScheduleModal';

interface WorkScheduleViewProps {
  employee: any;
}

const WorkScheduleView: React.FC<WorkScheduleViewProps> = ({ employee }) => {
  const [showWorkScheduleModal, setShowWorkScheduleModal] = useState(false);

  const workSchedules = employee?.data?.work_schedules || [];

  const getDayLabel = (day: string) => {
    const dayLabels: { [key: string]: string } = {
      monday: 'Thứ Hai',
      tuesday: 'Thứ Ba', 
      wednesday: 'Thứ Tư',
      thursday: 'Thứ Năm',
      friday: 'Thứ Sáu',
      saturday: 'Thứ Bảy',
      sunday: 'Chủ Nhật'
    };
    return dayLabels[day] || day;
  };

  const groupSchedulesByDay = () => {
    const grouped: { [key: string]: any[] } = {};
    workSchedules.forEach((schedule: any) => {
      if (!grouped[schedule.day]) {
        grouped[schedule.day] = [];
      }
      grouped[schedule.day].push(schedule);
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByDay();
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Lịch làm việc tuần</h3>
          <p className="text-sm text-gray-600">Xem lịch làm việc của bạn</p>
        </div>
        <button
          onClick={() => setShowWorkScheduleModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📅</span>
          Xem chi tiết
        </button>
      </div>

      {workSchedules.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch làm việc</h3>
          <p className="text-gray-600 mb-4">Bạn chưa có lịch làm việc nào được thiết lập.</p>
          <button
            onClick={() => setShowWorkScheduleModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {daysOfWeek.map((day) => {
            const daySchedules = groupedSchedules[day] || [];
            const hasSchedules = daySchedules.length > 0;

            return (
              <div key={day} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{getDayLabel(day)}</h4>
                  {hasSchedules && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {daySchedules.length} ca làm
                    </span>
                  )}
                </div>

                {!hasSchedules ? (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-2xl mb-2">🚫</div>
                    <p className="text-sm text-gray-500">Không làm việc</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {daySchedules.map((schedule: any, index: number) => (
                      <div
                        key={schedule.id || index}
                        className={`p-3 rounded-lg border ${
                          schedule.is_active 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                            {!schedule.is_active && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                Không hoạt động
                              </span>
                            )}
                          </div>
                        </div>
                        {schedule.notes && (
                          <p className="text-xs text-gray-600 mt-1">{schedule.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Work Schedule Modal - Reusing existing component */}
      <WorkScheduleModal
        isOpen={showWorkScheduleModal}
        onClose={() => setShowWorkScheduleModal(false)}
        employee={employee}
        canEdit={false} // Personal view is read-only
      />
    </div>
  );
};

export default WorkScheduleView;
