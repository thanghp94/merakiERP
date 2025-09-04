import React from 'react';
import { ViewMode } from './types';

interface ScheduleHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  dateRangeText: string;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  viewMode,
  setViewMode,
  currentDate,
  onNavigate,
  onToday,
  dateRangeText
}) => {
  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Class Schedule</h2>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'day' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'week' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              Week
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <span className="font-medium min-w-[120px] text-center">
              {dateRangeText}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
          
          <button
            onClick={onToday}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Today
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center space-x-4 mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>TSI (GrapeSEED)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>REP (GrapeSEED)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Other</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleHeader;
