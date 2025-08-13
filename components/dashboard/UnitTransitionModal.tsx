import React from 'react';
import { Class, UnitOption } from './shared/types';
import { getNextSuggestedUnit } from './shared/utils';

interface UnitTransitionModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedClass: Class | null;
  newUnit: string;
  setNewUnit: (unit: string) => void;
  transitionDate: string;
  setTransitionDate: (date: string) => void;
  isSubmitting: boolean;
  grapeSeedUnits: UnitOption[];
  onSubmit: () => void;
}

export default function UnitTransitionModal({
  showModal,
  setShowModal,
  selectedClass,
  newUnit,
  setNewUnit,
  transitionDate,
  setTransitionDate,
  isSubmitting,
  grapeSeedUnits,
  onSubmit
}: UnitTransitionModalProps) {
  if (!showModal || !selectedClass) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Chuyển Unit - {selectedClass.class_name}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Unit hiện tại:</strong> {selectedClass.data?.unit || 'Chưa có'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Gợi ý unit tiếp theo:</strong> {getNextSuggestedUnit(selectedClass.data?.unit || '')}
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="new-unit" className="block text-sm font-medium text-gray-700 mb-2">
              Unit mới <span className="text-red-500">*</span>
            </label>
            <select
              id="new-unit"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn unit mới</option>
              {grapeSeedUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="transition-date" className="block text-sm font-medium text-gray-700 mb-2">
              Ngày bắt đầu unit mới <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="transition-date"
              value={transitionDate}
              onChange={(e) => setTransitionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !newUnit || !transitionDate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Chuyển Unit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
