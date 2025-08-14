import React from 'react';
import FinanceForm from '../FinanceForm';
import { Finance } from './shared/types';
import { formatDate, getStatusBadge } from './shared/utils';
import { DataTable, TableColumn } from './shared';

interface FinancesTabProps {
  showFinanceForm: boolean;
  setShowFinanceForm: (show: boolean) => void;
  finances: Finance[];
  isLoadingFinances: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function FinancesTab({
  showFinanceForm,
  setShowFinanceForm,
  finances,
  isLoadingFinances,
  handleFormSubmit
}: FinancesTabProps) {
  // Create table columns configuration
  const getTableColumns = (): TableColumn<Finance>[] => {
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
        key: 'type',
        label: 'Loại',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {value}
          </div>
        )
      },
      {
        key: 'amount',
        label: 'Số tiền',
        render: (value) => (
          <div className="text-sm font-medium text-gray-900">
            {value.toLocaleString('vi-VN')} VNĐ
          </div>
        )
      },
      {
        key: 'due_date',
        label: 'Hạn thanh toán',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {formatDate(value)}
          </div>
        )
      },
      {
        key: 'payment_method',
        label: 'Phương thức',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.payment_method || '-'}
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
    <div className="space-y-3">
      {showFinanceForm ? (
        <FinanceForm onSubmit={(data) => handleFormSubmit(data, 'Finance')} />
      ) : (
        <div className="space-y-3">
          {/* Filter Controls with Add Button */}
          <div className="bg-white rounded-lg shadow-md p-3">
            <div className="flex justify-between items-center">
              <div className="flex-1"></div>
              <button
                onClick={() => setShowFinanceForm(!showFinanceForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showFinanceForm ? '📋' : '➕'}</span>
                <span>{showFinanceForm ? 'Xem danh sách' : 'Thêm tài chính'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">
                Danh sách tài chính ({finances.length})
              </h3>
            </div>

            <DataTable
              data={finances}
              columns={getTableColumns()}
              isLoading={isLoadingFinances}
              emptyState={{
                icon: (
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                ),
                title: 'Không có giao dịch tài chính nào',
                description: 'Chưa có giao dịch tài chính nào được tạo.'
              }}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
