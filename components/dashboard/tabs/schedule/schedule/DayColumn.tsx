import React from 'react';
import { Session, Employee } from './types';
import SessionCard from './SessionCard';
import TimeColumn from './TimeColumn';

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
  const daySessions = sessions.filter(session => session.start_time.startsWith(date));

  if (daySessions.length === 0) {
    return (
      <div className="flex-1 border border-gray-300 day-column relative">
        {/* Day header */}
        <div className="bg-gray-50 p-2 text-center border-b border-gray-300">
          <div className="font-semibold text-sm">{dayName.toUpperCase()}</div>
          <div className="text-xs text-gray-600">{date}</div>
        </div>
        <div className="p-8 text-center text-gray-500">No sessions</div>
      </div>
    );
  }

  // Calculate time range for all sessions
  let earliestHour = 23;
  let latestHour = 0;
  
  daySessions.forEach(session => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    
    // Use UTC hours to match the displayed session times
    const startHour = startTime.getUTCHours();
    const endHour = endTime.getUTCHours() + (endTime.getUTCMinutes() > 0 ? 1 : 0);
    
    if (startHour < earliestHour) earliestHour = startHour;
    if (endHour > latestHour) latestHour = endHour;
  });

  const heightMultiplier = 4; // Make each minute 4px tall
  const totalMinutes = (latestHour - earliestHour) * 60;
  const totalHeight = totalMinutes * heightMultiplier;

  // Create time boundaries using UTC
  const earliestTime = new Date(`${date}T${earliestHour.toString().padStart(2, '0')}:00:00Z`);

  return (
    <div className="flex-1 border border-gray-300 day-column relative">
      {/* Day header */}
      <div className="bg-gray-50 p-2 text-center border-b border-gray-300">
        <div className="font-semibold text-sm">{dayName.toUpperCase()}</div>
        <div className="text-xs text-gray-600">{date}</div>
      </div>

      {/* Time column and sessions */}
      <div className="ml-16 relative" style={{ height: `${totalHeight}px` }}>
        {/* Time Column */}
        <TimeColumn 
          sessions={daySessions} 
          date={date} 
          heightMultiplier={heightMultiplier} 
        />

        {/* Sessions */}
        <div style={{ position: 'relative', height: `${totalHeight}px` }}>
          {daySessions.map(session => {
            const sessionStart = new Date(session.start_time);
            const sessionEnd = new Date(session.end_time);
            const sessionTop = (sessionStart.getTime() - earliestTime.getTime()) / (1000 * 60) * heightMultiplier;
            const sessionDuration = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60) * heightMultiplier;

            return (
              <div
                key={session.id}
                style={{ 
                  position: 'absolute', 
                  top: `${sessionTop}px`, 
                  height: `${sessionDuration}px`, 
                  left: 0, 
                  right: 0 
                }}
              >
                <SessionCard
                  session={session}
                  isEditing={editingSession === session.id}
                  teachers={teachers}
                  teachingAssistants={teachingAssistants}
                  sessionWidth="100%"
                  sessionLeft="0%"
                  onEdit={() => onEditSession(session.id)}
                  onUpdate={onUpdateSession}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayColumn;
