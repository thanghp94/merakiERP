import React from 'react';
import { Employee } from '../../shared/types';
import { formatDate, getStatusBadge } from '../../shared/utils';
import { useEscapeKey } from '../../../../lib/hooks/useEscapeKey';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function EmployeeDetailModal({
  isOpen,
  onClose,
  employee
}: EmployeeDetailModalProps) {
  // Add ESC key handler
  useEscapeKey(onClose, isOpen);

  if (!isOpen || !employee) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👨‍💼</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết nhân viên</h2>
              <p className="text-sm text-gray-500">Thông tin chi tiết về nhân viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
          {/* Basic Information - 3 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Thông tin cá nhân
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                  <p className="text-base text-gray-900 font-medium">{employee.full_name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.email || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.phone || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày sinh</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.date_of_birth ? formatDate(employee.data.date_of_birth) : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Số CCCD/CMND</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.id_number || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.address || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Thông tin công việc
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Chức vụ</label>
                  <p className="text-base text-gray-900">
                    {employee.position || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Phòng ban</label>
                  <p className="text-base text-gray-900">
                    {employee.department || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <div className="mt-1">
                    {getStatusBadge(employee.status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày bắt đầu làm việc</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.hire_date ? formatDate(employee.data.hire_date) : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Kinh nghiệm</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.experience || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Thông tin giấy tờ
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Số CCCD/CMND</label>
                  <p className="text-base text-gray-900 font-mono">
                    {employee.data?.id_number || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày cấp CCCD</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.id_issue_date ? formatDate(employee.data.id_issue_date) : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày hết hạn CCCD</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.id_expiry_date ? formatDate(employee.data.id_expiry_date) : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Trình độ</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.qualifications || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Quốc tịch</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.nationality || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Thông tin bổ sung
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Quốc tịch</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.nationality || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày cấp CCCD</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.id_issue_date ? formatDate(employee.data.id_issue_date) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày hết hạn CCCD</label>
                  <p className="text-base text-gray-900">
                    {employee.data?.id_expiry_date ? formatDate(employee.data.id_expiry_date) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {employee.data?.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Ghi chú
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-base text-gray-900 leading-relaxed">
                  {employee.data.notes}
                </p>
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 text-gray-900 font-mono">{employee.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Ngày tạo:</span>
                <span className="ml-2 text-gray-900">
                  {employee.created_at ? formatDate(employee.created_at) : '-'}
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            💡 Nhấn <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">ESC</kbd> để đóng
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
