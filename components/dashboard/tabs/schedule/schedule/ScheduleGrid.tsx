import React, { useState } from 'react';
import { Session, Employee, ViewMode } from './types';
import { getWeekDates } from './utils';
import DayColumn from './DayColumn';

interface ScheduleGridProps {
  sessions: Session[];
  viewMode: ViewMode;
  currentDate: Date;
  startDate: string;
  teachers: Employee[];
  teachingAssistants: Employee[];
  facilities: any[];
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
  onExpandDay?: (date: string) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  sessions,
  viewMode,
  currentDate,
  startDate,
  teachers,
  teachingAssistants,
  facilities,
  onUpdateSession,
  onExpandDay,
}) => {
  const [editingSession, setEditingSession] = useState<string | null>(null);

  const onEditSession = (sessionId: string) => {
    setEditingSession(sessionId);
  };

  const handleUpdateSession = (sessionId: string, updates: Partial<Session>) => {
    onUpdateSession(sessionId, updates);
    setEditingSession(null);
  };

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
          facilities={facilities}
          onEditSession={onEditSession}
          onUpdateSession={handleUpdateSession}
          onExpandDay={onExpandDay}
        />
      </div>
    );
  } else {
    // Week view - show all 7 days with individual time columns
    const weekDates = getWeekDates(startDate);

    return (
      <div className="flex">
        {weekDays.map((dayName, index) => {
          const dayDate = weekDates[index];

          return (
            <DayColumn
              key={weekDates[index]}
              date={weekDates[index]}
              dayName={dayName}
              sessions={sessions}
              editingSession={editingSession}
              teachers={teachers}
              teachingAssistants={teachingAssistants}
              facilities={facilities}
              onEditSession={onEditSession}
              onUpdateSession={handleUpdateSession}
              onExpandDay={onExpandDay}
            />
          );
        })}
      </div>
    );
  }
};

export default ScheduleGrid;
