import React from 'react';
import { Facility } from '../../shared/types';
import { formatDate, getStatusBadge } from '../../shared/utils';
import { useEscapeKey } from '../../../../lib/hooks/useEscapeKey';

interface FacilityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: Facility | null;
}

export default function FacilityDetailModal({
  isOpen,
  onClose,
  facility
}: FacilityDetailModalProps) {
  // Add ESC key handler
  useEscapeKey(onClose, isOpen);

  if (!isOpen || !facility) return null;

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
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">🏢</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết cơ sở</h2>
              <p className="text-sm text-gray-500">Thông tin chi tiết về cơ sở</p>
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
                Thông tin cơ bản
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tên cơ sở</label>
                  <p className="text-base text-gray-900 font-medium">{facility.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Loại cơ sở</label>
                  <p className="text-base text-gray-900">
                    {facility.type || facility.data?.type || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <div className="mt-1">
                    {getStatusBadge(facility.status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Sức chứa</label>
                  <p className="text-base text-gray-900">
                    {facility.data?.capacity ? `${facility.data.capacity} học sinh` : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày thành lập</label>
                  <p className="text-base text-gray-900">
                    {facility.data?.established ? formatDate(facility.data.established) : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Thông tin liên hệ
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                  <p className="text-base text-gray-900">
                    {facility.data?.address || '-'}
                  </p>
                </div>

                {facility.data?.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mô tả</label>
                    <p className="text-base text-gray-900 leading-relaxed">
                      {facility.data.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rooms Section */}
          {facility.data?.rooms && facility.data.rooms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Phòng học ({facility.data.rooms.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facility.data.rooms.map((room: any, index: number) => (
                  <div key={room.id || index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-orange-600">🚪</span>
                      <h4 className="font-medium text-gray-900">{room.name}</h4>
                    </div>
                    {room.description && (
                      <p className="text-sm text-gray-600">{room.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 text-gray-900 font-mono">{facility.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Ngày tạo:</span>
                <span className="ml-2 text-gray-900">
                  {facility.created_at ? formatDate(facility.created_at) : '-'}
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
