import React from 'react';
import { Student } from '../../shared/types';
import { formatDate, getStatusBadge } from '../../shared/utils';
import { useEscapeKey } from '../../../../lib/hooks/useEscapeKey';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export default function StudentDetailModal({
  isOpen,
  onClose,
  student
}: StudentDetailModalProps) {
  // Add ESC key handler
  useEscapeKey(onClose, isOpen);

  if (!isOpen || !student) return null;

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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🎓</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết học sinh</h2>
              <p className="text-sm text-gray-500">Thông tin chi tiết về học sinh</p>
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
                Thông tin học sinh
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                  <p className="text-base text-gray-900 font-medium">{student.full_name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-base text-gray-900">
                    {student.email || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="text-base text-gray-900">
                    {student.phone || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày sinh</label>
                  <p className="text-base text-gray-900">
                    {student.data?.date_of_birth ? formatDate(student.data.date_of_birth) : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                  <p className="text-base text-gray-900">
                    {student.data?.address || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <div className="mt-1">
                    {getStatusBadge(student.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Thông tin học tập
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Cơ sở mong muốn</label>
                  <p className="text-base text-gray-900">
                    {student.data?.expected_campus || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Chương trình học</label>
                  <p className="text-base text-gray-900">
                    {student.data?.program || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Trình độ tiếng Anh hiện tại</label>
                  <p className="text-base text-gray-900">
                    {student.data?.current_english_level || '-'}
                  </p>
                </div>

                {student.data?.student_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mô tả học sinh</label>
                    <p className="text-base text-gray-900 leading-relaxed">
                      {student.data.student_description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parent Information */}
          {student.data?.parent && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Thông tin phụ huynh
              </h3>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên phụ huynh</label>
                    <p className="text-base text-gray-900 font-medium">
                      {student.data.parent.name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                    <p className="text-base text-gray-900">
                      {student.data.parent.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-base text-gray-900">
                      {student.data.parent.email || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {student.data?.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Ghi chú
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-base text-gray-900 leading-relaxed">
                  {student.data.notes}
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
                <span className="ml-2 text-gray-900 font-mono">{student.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Ngày tạo:</span>
                <span className="ml-2 text-gray-900">
                  {student.created_at ? formatDate(student.created_at) : '-'}
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
