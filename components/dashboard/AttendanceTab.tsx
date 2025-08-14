import React from 'react';
import AttendanceForm from '../AttendanceForm';
import { Attendance } from './shared/types';
import { formatDate, getStatusBadge } from './shared/utils';
import { DataTable, TableColumn } from './shared';

interface AttendanceTabProps {
  showAttendanceForm: boolean;
  setShowAttendanceForm: (show: boolean) => void;
  attendances: Attendance[];
  isLoadingAttendances: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function AttendanceTab({
  showAttendanceForm,
  setShowAttendanceForm,
  attendances,
  isLoadingAttendances,
  handleFormSubmit
}: AttendanceTabProps) {
  // Create table columns configuration
  const getTableColumns = (): TableColumn<Attendance>[] => {
    return [
      {
        key: 'student_name',
        label: 'Học sinh',
        render: (value, row) => (
          <div className="text-sm font-medium text-gray-900">
            {row.students?.full_name || 'N/A'}
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
        key: 'session_date',
        label: 'Ngày học',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {formatDate(value)}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => getStatusBadge(value)
      },
      {
        key: 'notes',
        label: 'Ghi chú',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.notes || '-'}
            {row.data?.late_minutes && (
              <div className="text-sm text-red-600">
                Trễ {row.data.late_minutes} phút
              </div>
            )}
          </div>
        )
      }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Điểm danh</h2>
        <button
          onClick={() => setShowAttendanceForm(!showAttendanceForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
        >
          <span>{showAttendanceForm ? '📋' : '➕'}</span>
          <span>{showAttendanceForm ? 'Xem danh sách' : 'Thêm điểm danh'}</span>
        </button>
      </div>

      {showAttendanceForm ? (
        <AttendanceForm onSubmit={(data) => handleFormSubmit(data, 'Attendance')} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Danh sách điểm danh ({attendances.length})
              </h3>
            </div>

            <DataTable
              data={attendances}
              columns={getTableColumns()}
              isLoading={isLoadingAttendances}
              emptyState={{
                icon: (
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Không có điểm danh nào',
                description: 'Chưa có điểm danh nào được tạo.'
              }}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
