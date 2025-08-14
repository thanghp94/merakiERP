import React, { useState, useCallback } from 'react';
import { 
  ClassScheduleViewProps, 
  ViewMode,
  ScheduleHeader, 
  ScheduleGrid,
  useScheduleData,
  useEmployeeData,
  formatDateRange
} from './schedule';

const ClassScheduleView: React.FC<ClassScheduleViewProps> = ({ classId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingSession, setEditingSession] = useState<string | null>(null);

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
  const handleEditSession = useCallback((sessionId: string) => {
    setEditingSession(editingSession === sessionId ? null : sessionId);
  }, [editingSession]);

  const handleUpdateSession = useCallback(async (sessionId: string, updates: any) => {
    const success = await updateSession(sessionId, updates);
    if (success) {
      setEditingSession(null);
    }
  }, [updateSession]);

  // Generate date range text for header
  const dateRangeText = viewMode === 'day' 
    ? currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
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
      />
      
      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <ScheduleGrid
            sessions={sessions}
            viewMode={viewMode}
            currentDate={currentDate}
            startDate={startDate}
            editingSession={editingSession}
            teachers={teachers}
            teachingAssistants={teachingAssistants}
            onEditSession={handleEditSession}
            onUpdateSession={handleUpdateSession}
          />
        )}
      </div>
    </div>
  );
};

export default ClassScheduleView;
