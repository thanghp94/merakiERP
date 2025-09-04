import React from 'react';
import ClassScheduleView from '../components/dashboard/tabs/schedule/ClassScheduleView';

const SchedulePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Class Schedule</h1>
        </div>
        
        <ClassScheduleView />
      </div>
    </div>
  );
};

export default SchedulePage;
