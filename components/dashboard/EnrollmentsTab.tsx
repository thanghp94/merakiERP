import React from 'react';
import EnrollmentForm from '../EnrollmentForm';
import { Enrollment } from './shared/types';
import { formatDate, getStatusBadge } from './shared/utils';
import { DataTable, TableColumn } from './shared';

interface EnrollmentsTabProps {
  showEnrollmentForm: boolean;
  setShowEnrollmentForm: (show: boolean) => void;
  enrollments: Enrollment[];
  isLoadingEnrollments: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function EnrollmentsTab({
  showEnrollmentForm,
  setShowEnrollmentForm,
  enrollments,
  isLoadingEnrollments,
  handleFormSubmit
}: EnrollmentsTabProps) {
  // Create table columns configuration
  const getTableColumns = (): TableColumn<Enrollment>[] => {
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
        key: 'enrollment_date',
        label: 'Ngày đăng ký',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {formatDate(value)}
          </div>
        )
      },
      {
        key: 'payment_status',
        label: 'Trạng thái thanh toán',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.payment_status || 'Chưa thanh toán'}
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
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Đăng ký</h2>
        <button
          onClick={() => setShowEnrollmentForm(!showEnrollmentForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
        >
          <span>{showEnrollmentForm ? '📋' : '➕'}</span>
          <span>{showEnrollmentForm ? 'Xem danh sách' : 'Thêm đăng ký'}</span>
        </button>
      </div>

      {showEnrollmentForm ? (
        <EnrollmentForm onSubmit={(data) => handleFormSubmit(data, 'Enrollment')} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Danh sách đăng ký ({enrollments.length})
              </h3>
            </div>

            <DataTable
              data={enrollments}
              columns={getTableColumns()}
              isLoading={isLoadingEnrollments}
              emptyState={{
                icon: (
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Không có đăng ký nào',
                description: 'Chưa có đăng ký nào được tạo.'
              }}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
