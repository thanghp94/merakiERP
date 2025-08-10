import React from 'react';

export default function ScheduleTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Lịch học các lớp</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-4">Lịch học các lớp</h3>
          <p className="text-gray-600 mb-6">
            Xem và quản lý lịch học của tất cả các lớp
          </p>
          
          <button 
            onClick={() => window.location.href = '/schedule'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">📅</span>
            Xem lịch học
          </button>
        </div>
      </div>
    </div>
  );
}
