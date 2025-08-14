import { Session, Employee, OverlapGroup } from './types';

export const getSessionColor = (session: Session): string => {
  const isGrapeSeed = session.main_sessions?.classes?.data?.program_type === 'GrapeSEED';
  
  if (isGrapeSeed) {
    switch (session.subject_type) {
      case 'TSI':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'REP':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-purple-100 border-purple-300 text-purple-800';
    }
  }
  
  return 'bg-gray-100 border-gray-300 text-gray-800';
};

export const formatTime = (time: string): string => {
  return time.substring(0, 5); // HH:MM format
};

export const detectOverlaps = (sessions: Session[]): OverlapGroup => {
  const overlaps: OverlapGroup = {};
  
  sessions.forEach((session, index) => {
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();
    
    // Find overlapping sessions
    const overlappingSessions = sessions.filter((otherSession, otherIndex) => {
      if (index === otherIndex) return true; // Include self
      
      const otherStart = new Date(otherSession.start_time).getTime();
      const otherEnd = new Date(otherSession.end_time).getTime();
      
      // Check if sessions overlap
      return (sessionStart < otherEnd && sessionEnd > otherStart);
    });
    
    if (overlappingSessions.length > 1) {
      // Create a unique key for this overlap group
      const overlapKey = overlappingSessions
        .map(s => s.id)
        .sort()
        .join('-');
      
      if (!overlaps[overlapKey]) {
        overlaps[overlapKey] = overlappingSessions;
      }
    }
  });
  
  return overlaps;
};

export const getSessionsForDate = (sessions: Session[], date: string): Session[] => {
  return sessions.filter(session => session.date === date);
};

export const filterEmployeesByPosition = (employees: Employee[], positions: string[]): Employee[] => {
  return employees.filter((emp: Employee) => {
    const position = emp.position?.toLowerCase() || '';
    return positions.some(pos => position.includes(pos.toLowerCase()));
  });
};

export const getDateRange = (currentDate: Date, viewMode: 'day' | 'week'): { startDate: string; endDate: string } => {
  if (viewMode === 'day') {
    const dateStr = currentDate.toISOString().split('T')[0];
    return { startDate: dateStr, endDate: dateStr };
  } else {
    // Week view - get Monday to Sunday
    const monday = new Date(currentDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    
    const sunday = new Date(currentDate);
    const sundayDiff = sunday.getDate() - day + 7;
    sunday.setDate(sundayDiff);
    
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0]
    };
  }
};

export const getWeekDates = (startDate: string): string[] => {
  const weekDates: string[] = [];
  const startDateObj = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDateObj);
    date.setDate(startDateObj.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }
  
  return weekDates;
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};
