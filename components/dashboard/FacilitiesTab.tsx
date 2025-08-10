import React from 'react';
import FacilityForm from '../FacilityForm';
import { Facility } from './types';
import { formatDate, getStatusBadge } from './utils';

interface FacilitiesTabProps {
  showFacilityForm: boolean;
  setShowFacilityForm: (show: boolean) => void;
  facilitiesList: Facility[];
  isLoadingFacilitiesList: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function FacilitiesTab({
  showFacilityForm,
  setShowFacilityForm,
  facilitiesList,
  isLoadingFacilitiesList,
  handleFormSubmit
}: FacilitiesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Cơ sở</h2>
        <button
          onClick={() => setShowFacilityForm(!showFacilityForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
        >
          <span>{showFacilityForm ? '📋' : '➕'}</span>
          <span>{showFacilityForm ? 'Xem danh sách' : 'Thêm cơ sở'}</span>
        </button>
      </div>

      {showFacilityForm ? (
        <FacilityForm onSubmit={(data) => handleFormSubmit(data, 'Facility')} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Danh sách cơ sở ({facilitiesList.length})
              </h3>
            </div>

            {isLoadingFacilitiesList ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Đang tải danh sách cơ sở...</p>
              </div>
            ) : facilitiesList.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Không có cơ sở nào</h4>
                <p className="text-gray-600">Chưa có cơ sở nào được tạo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên cơ sở
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sức chứa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày thành lập
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {facilitiesList.map((facility: any) => (
                      <tr key={facility.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                          {facility.data?.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {facility.data.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {facility.type || facility.data?.type || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {facility.data?.address || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {facility.data?.capacity || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {facility.data?.established ? formatDate(facility.data.established) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(facility.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
