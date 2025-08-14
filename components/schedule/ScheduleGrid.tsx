import React from 'react';
import { Session, Employee, ViewMode } from './types';
import { getWeekDates } from './utils';
import DayColumn from './DayColumn';

interface ScheduleGridProps {
  sessions: Session[];
  viewMode: ViewMode;
  currentDate: Date;
  startDate: string;
  editingSession: string | null;
  teachers: Employee[];
  teachingAssistants: Employee[];
  onEditSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  sessions,
  viewMode,
  currentDate,
  startDate,
  editingSession,
  teachers,
  teachingAssistants,
  onEditSession,
  onUpdateSession
}) => {
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No sessions found for this time period
      </div>
    );
  }

  if (viewMode === 'day') {
    // Day view - show only current day
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return (
      <div className="flex">
        <DayColumn
          date={currentDateStr}
          dayName={dayName}
          sessions={sessions}
          editingSession={editingSession}
          teachers={teachers}
          teachingAssistants={teachingAssistants}
          onEditSession={onEditSession}
          onUpdateSession={onUpdateSession}
        />
      </div>
    );
  } else {
    // Week view - show all 7 days
    const weekDates = getWeekDates(startDate);

    return (
      <div className="flex">
        {weekDays.map((dayName, index) => (
          <DayColumn
            key={weekDates[index]}
            date={weekDates[index]}
            dayName={dayName}
            sessions={sessions}
            editingSession={editingSession}
            teachers={teachers}
            teachingAssistants={teachingAssistants}
            onEditSession={onEditSession}
            onUpdateSession={onUpdateSession}
          />
        ))}
      </div>
    );
  }
};

export default ScheduleGrid;
