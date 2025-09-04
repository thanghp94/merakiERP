import React from 'react';
import { Session } from './types';

interface TimeColumnProps {
  sessions: Session[];
  date: string;
  heightMultiplier: number;
}

const TimeColumn: React.FC<TimeColumnProps> = ({ sessions, date, heightMultiplier }) => {
  if (sessions.length === 0) {
    return null;
  }

  // Find the actual earliest and latest times from sessions
  let earliestHour = 23;
  let latestHour = 0;
  
  sessions.forEach(session => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    
    // Use UTC hours instead of local hours to match the displayed session times
    const startHour = startTime.getUTCHours();
    const endTimeHour = endTime.getUTCHours() + (endTime.getUTCMinutes() > 0 ? 1 : 0);
    
    if (startHour < earliestHour) earliestHour = startHour;
    if (endTimeHour > latestHour) latestHour = endTimeHour;
  });

  // Generate hour labels
  const hours = [];
  for (let h = earliestHour; h <= latestHour; h++) {
    hours.push(h);
  }

  const totalMinutes = (latestHour - earliestHour) * 60;
  const totalHeight = totalMinutes * heightMultiplier;

  return (
    <div 
      className="absolute left-[-4rem] top-0 w-16 flex flex-col items-end pr-1 text-xs text-gray-600" 
      style={{ height: `${totalHeight}px` }}
    >
      {hours.map((hour, i) => {
        // Position label proportionally within the time range
        const topPosition = (i * 60) * heightMultiplier;
        return (
          <div 
            key={hour} 
            style={{ 
              position: 'absolute', 
              top: `${topPosition}px`, 
              transform: 'translateY(-50%)'
            }}
          >
            {hour.toString().padStart(2, '0')}:00
          </div>
        );
      })}
    </div>
  );
};

export default TimeColumn;
