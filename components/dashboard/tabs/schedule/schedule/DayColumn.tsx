import React from 'react';
import { Session, Employee } from './types';
import { getSessionsForDate, detectOverlaps } from './utils';
import SessionCard from './SessionCard';

interface DayColumnProps {
  date: string;
  dayName: string;
  sessions: Session[];
  editingSession: string | null;
  teachers: Employee[];
  teachingAssistants: Employee[];
  onEditSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  dayName,
  sessions,
  editingSession,
  teachers,
  teachingAssistants,
  onEditSession,
  onUpdateSession
}) => {
  const daySessions = getSessionsForDate(sessions, date);
  
  if (daySessions.length === 0) {
    return (
      <div className="flex-1 border border-gray-300">
        <div className="bg-gray-50 p-2 text-center border-b border-gray-300">
          <div className="font-semibold text-sm">{dayName.toUpperCase()}</div>
          <div className="text-xs text-gray-600">{date}</div>
        </div>
        <div className="p-4 text-center text-gray-400 text-sm">
          No classes
        </div>
      </div>
    );
  }

  // Get unique time slots for this day only - show actual class times
  const dayTimeSlots = new Set<string>();
  daySessions.forEach(session => {
    const startTime = session.start_time.substring(11, 16); // Get HH:MM format
    dayTimeSlots.add(startTime);
  });

  const sortedTimeSlots = Array.from(dayTimeSlots).sort();
  const overlaps = detectOverlaps(daySessions);

  return (
    <div className="flex-1 border border-gray-300 day-column relative">
      {/* Day header */}
      <div className="bg-gray-50 p-2 text-center border-b border-gray-300">
        <div className="font-semibold text-sm">{dayName.toUpperCase()}</div>
        <div className="text-xs text-gray-600">{date}</div>
      </div>

      {/* Time slots for this day - showing actual class times */}
      {sortedTimeSlots.map(timeSlot => {
        // Find sessions that start at this time slot
        const timeSlotSessions = daySessions.filter(session => {
          const sessionStartTime = session.start_time.substring(11, 16);
          return sessionStartTime === timeSlot;
        });

        return (
          <div 
            key={`${date}-${timeSlot}`} 
            className="flex border-b border-gray-300 min-h-[80px]"
          >
            {/* Time column showing actual class time */}
            <div className="w-16 p-2 border-r border-gray-300 text-sm font-medium bg-gray-50 flex items-center">
              {timeSlot}
            </div>
            
            {/* Session content */}
            <div className="flex-1 p-1 relative">
              {timeSlotSessions.map((session) => {
                // Handle overlapping sessions
                const sessionOverlapKey = Object.keys(overlaps).find(key => 
                  overlaps[key].some(s => s.id === session.id)
                );
                
                let sessionWidth = '100%';
                let sessionLeft = '0%';
                
                if (sessionOverlapKey) {
                  const overlappingSessions = overlaps[sessionOverlapKey];
                  const sessionIndexInOverlap = overlappingSessions.findIndex(s => s.id === session.id);
                  const overlapCount = overlappingSessions.length;
                  
                  sessionWidth = `${100 / overlapCount}%`;
                  sessionLeft = `${(sessionIndexInOverlap * 100) / overlapCount}%`;
                }
                
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isEditing={editingSession === session.id}
                    teachers={teachers}
                    teachingAssistants={teachingAssistants}
                    sessionWidth={sessionWidth}
                    sessionLeft={sessionLeft}
                    onEdit={onEditSession}
                    onUpdate={onUpdateSession}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DayColumn;
