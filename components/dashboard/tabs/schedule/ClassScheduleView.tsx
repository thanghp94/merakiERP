import React, { useState, useCallback, useMemo } from 'react';
import {
  ClassScheduleViewProps,
  ViewMode,
  ScheduleHeader,
  ScheduleGrid,
  useScheduleData,
  useEmployeeData,
  useFacilitiesData,
  useClassesData,
  formatDateRange,
  formatDateToDDMMYYYY
} from './schedule';

const ClassScheduleView: React.FC<ClassScheduleViewProps> = ({ classId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Use custom hooks for data management
  const {
    sessions,
    isLoading,
    startDate,
    endDate,
    updateSession
  } = useScheduleData(currentDate, viewMode, classId);

  const {
    teachers,
    teachingAssistants
  } = useEmployeeData();

  const {
    facilities
  } = useFacilitiesData();

  const {
    classes
  } = useClassesData();

  // Navigation handlers
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Session editing handlers
  const handleUpdateSession = useCallback(async (sessionId: string, updates: any) => {
    await updateSession(sessionId, updates);
  }, [updateSession]);

  // Day expansion handler
  const handleExpandDay = useCallback((date: string) => {
    setViewMode('day');
    setCurrentDate(new Date(date));
  }, []);

  // Filter sessions based on selected filters
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (selectedFacilityId) {
      filtered = filtered.filter(session => {
        const sessionClassId = session.main_sessions?.class_id;
        if (!sessionClassId) return false;
        const sessionClass = classes.find(cls => cls.id === sessionClassId);
        return sessionClass?.data?.facility_id === selectedFacilityId;
      });
    }

    if (selectedClassId) {
      filtered = filtered.filter(session => session.main_sessions?.class_id === selectedClassId);
    }

    return filtered;
  }, [sessions, selectedFacilityId, selectedClassId, classes]);

  // Generate date range text for header
  const dateRangeText = viewMode === 'day'
    ? `${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}, ${formatDateToDDMMYYYY(currentDate)}`
    : formatDateRange(startDate, endDate);

  return (
    <div className="bg-white rounded-lg shadow-md">
      <ScheduleHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentDate={currentDate}
        onNavigate={handleNavigate}
        onToday={handleToday}
        dateRangeText={dateRangeText}
        teachers={teachers}
        sessions={filteredSessions}
        startDate={startDate}
        endDate={endDate}
      />
      
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Facility:</label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Facilities</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {(selectedFacilityId || selectedClassId) && (
            <button
              onClick={() => {
                setSelectedFacilityId('');
                setSelectedClassId('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <ScheduleGrid
            sessions={filteredSessions}
            viewMode={viewMode}
            currentDate={currentDate}
            startDate={startDate}
            teachers={teachers}
            teachingAssistants={teachingAssistants}
            facilities={facilities}
            onUpdateSession={handleUpdateSession}
            onExpandDay={viewMode === 'week' ? handleExpandDay : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default ClassScheduleView;
