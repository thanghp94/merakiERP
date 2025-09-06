import React from 'react';
import ClassScheduleView from '../components/dashboard/tabs/schedule/ClassScheduleView';

const SchedulePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Class Schedule</h1>
        </div>

        <div>
          {/* Class Schedule and Email Schedule */}
          <ClassScheduleView />
          {/* Filters */}
          <div className="mt-4 mb-4 flex space-x-4">
            <div>
              <label htmlFor="facilityFilter" className="block text-sm font-medium text-gray-700">
                Facility:
              </label>
              <select
                id="facilityFilter"
                name="facilityFilter"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option>All Facilities</option>
                {/* Add facility options here */}
              </select>
            </div>
            <div>
              <label htmlFor="classFilter" className="block text-sm font-medium text-gray-700">
                Class:
              </label>
              <select
                id="classFilter"
                name="classFilter"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option>All Classes</option>
                {/* Add class options here */}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
