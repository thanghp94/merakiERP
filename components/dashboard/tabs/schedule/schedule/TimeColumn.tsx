import React from 'react';

interface TimeColumnProps {
  earliestHour: number;
  latestHour: number;
  timeRangeStart: Date;
  totalHeight: number;
  heightMultiplier: number;
  date: string;
}

const TimeColumn: React.FC<TimeColumnProps> = ({ 
  earliestHour, 
  latestHour, 
  timeRangeStart, 
  totalHeight, 
  heightMultiplier, 
  date 
}) => {
  // Generate hour labels - ensure we show all hours that contain or bound sessions
  const hours = [];
  for (let h = earliestHour; h <= latestHour; h++) {
    hours.push(h);
  }

  return (
    <div 
      className="absolute left-[-2rem] top-0 w-8 flex flex-col items-end pr-1 text-xs text-gray-600" 
      style={{ height: `${totalHeight}px` }}
    >
      {hours.map((hour) => {
        // Position each hour label at the exact start of that hour (matching session timezone)
        const hourTime = new Date(timeRangeStart);
        hourTime.setHours(hour, 0, 0, 0);
        const hourPosition = (hourTime.getTime() - timeRangeStart.getTime()) / (1000 * 60) * heightMultiplier;
        
        // The hour is already in local time from the session data processing
        const displayHour = hour;
        
        return (
          <div 
            key={hour} 
            style={{ 
              position: 'absolute', 
              top: `${hourPosition}px`, 
              transform: 'translateY(-50%)'
            }}
          >
            {displayHour.toString().padStart(2, '0')}:00
          </div>
        );
      })}
    </div>
  );
};

export default TimeColumn;
