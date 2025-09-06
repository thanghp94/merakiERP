import React from 'react';
import { Employee } from '@/shared/types';
import { CrudTable, TableColumn } from '../../shared';
import { ForeignTeachersTableProps, EMPLOYEE_STATUSES } from './types/foreign-teachers.types';

export default function ForeignTeachersTable({
  employees,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onWorkSchedule,
  onCreateClick
}: ForeignTeachersTableProps) {
  // Create table columns configuration
  const getTableColumns = (): TableColumn<Employee>[] => {
    return [
      {
        key: 'full_name',
        label: 'Họ và tên',
        render: (value, row) => (
          <div>
            <button
              onClick={() => onView(row)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
            >
              {value}
            </button>
            {row.position && (
              <div className="text-sm text-gray-500">{row.position}</div>
            )}
          </div>
        )
      },
      {
        key: 'nationality',
        label: 'Quốc tịch',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.nationality || '-'}
          </div>
        )
      },
      {
        key: 'contact',
        label: 'Liên hệ',
        render: (value, row) => (
          <div>
            {row.data?.email && (
              <div className="text-sm text-gray-900">{row.data.email}</div>
            )}
            {row.data?.phone && (
              <div className="text-sm text-gray-500">{row.data.phone}</div>
            )}
          </div>
        )
      },


    ];
  };

  return (
    <CrudTable
      data={employees}
      columns={getTableColumns()}
      isLoading={isLoading}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      customActions={onWorkSchedule ? [{
        label: 'Lịch làm việc',
        icon: '📅',
        onClick: onWorkSchedule,
        variant: 'secondary' as const,
        iconOnly: true,
        tooltip: 'Xem lịch làm việc'
      }] : []}
      title="Danh sách giáo viên nước ngoài"
      createButtonLabel="Thêm giáo viên nước ngoài"
      onCreateClick={onCreateClick}
      emptyState={{
        icon: (
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 0-5 0m13.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        title: 'Không có giáo viên nước ngoài nào',
        description: 'Chưa có giáo viên nước ngoài nào được tạo.'
      }}
    />
  );
}
