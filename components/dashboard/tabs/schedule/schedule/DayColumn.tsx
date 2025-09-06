import React from 'react';
import { Session, Employee } from './types';
import SessionCard from './SessionCard';
import { formatDateToDDMMYYYY } from './utils';

interface DayColumnProps {
  date: string;
  dayName: string;
  sessions: Session[];
  editingSession: string | null;
  teachers: Employee[];
  teachingAssistants: Employee[];
  facilities: any[];
  onEditSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
  onExpandDay?: (date: string) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  dayName,
  sessions,
  editingSession,
  teachers,
  teachingAssistants,
  facilities,
  onEditSession,
  onUpdateSession,
  onExpandDay
}) => {
  const daySessions = sessions.filter(session => session.start_time.startsWith(date));

  if (daySessions.length === 0) {
    return (
      <div className="flex-1 border border-gray-300 day-column relative">
        {/* Day header */}
        <div className="bg-gray-50 p-2 text-center border-b border-gray-300 relative">
          <div className="font-semibold text-sm">{dayName.toUpperCase()}</div>
          <div className="text-xs text-gray-600">{formatDateToDDMMYYYY(new Date(date))}</div>
          {onExpandDay && (
            <button
              onClick={() => onExpandDay(date)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-0.5"
              title="Expand to day view"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,3 21,3 21,9"></polyline>
                <polyline points="9,21 3,21 3,15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          )}
        </div>
        <div className="p-8 text-center text-gray-500">No sessions</div>
      </div>
    );
  }

  // Sort sessions by start time to detect gaps
  const sortedSessions = [...daySessions].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Detect session blocks and gaps
  const sessionBlocks: Session[][] = [];
  let currentBlock: Session[] = [sortedSessions[0]];
  
  for (let i = 1; i < sortedSessions.length; i++) {
    const currentSession = sortedSessions[i];
    const lastSessionInBlock = currentBlock[currentBlock.length - 1];
    const lastEndTime = new Date(lastSessionInBlock.end_time);
    const currentStartTime = new Date(currentSession.start_time);
    
    // If there's a gap of more than 1 hour, start a new block
    const gapHours = (currentStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60 * 60);
    if (gapHours > 1) {
      sessionBlocks.push(currentBlock);
      currentBlock = [currentSession];
    } else {
      currentBlock.push(currentSession);
    }
  }
  sessionBlocks.push(currentBlock);

  // Calculate the earliest session start time - this will be our reference point (top of container)
  const earliestTime = daySessions.reduce((earliest, session) => {
    const start = new Date(session.start_time);
    return start < earliest ? start : earliest;
  }, new Date(daySessions[0].start_time));

  const heightMultiplier = 2.1; // Reduced height by 30% - each minute is now 2.1px tall
  
  // Calculate total height based on session blocks with gaps
  let totalHeight = 0;
  sessionBlocks.forEach((block, blockIndex) => {
    const blockStart = Math.min(...block.map(s => new Date(s.start_time).getTime()));
    const blockEnd = Math.max(...block.map(s => new Date(s.end_time).getTime()));
    const blockDuration = (blockEnd - blockStart) / (1000 * 60); // minutes
    totalHeight += blockDuration * heightMultiplier;
    
    // Add gap height between blocks (except for the last block)
    if (blockIndex < sessionBlocks.length - 1) {
      totalHeight += 40; // Fixed gap height for orange bar
    }
  });
  
  // Minimum height
  totalHeight = Math.max(totalHeight, 400);

  return (
      <div className="flex-1 border border-gray-300 day-column relative">
      {/* Day header */}
      <div className="bg-gray-50 p-2 text-center border-b border-gray-300 relative">
        <div className="font-semibold text-sm">{dayName.toUpperCase()}</div>
        <div className="text-xs text-gray-600">{formatDateToDDMMYYYY(new Date(date))}</div>
        {onExpandDay && (
          <button
            onClick={() => onExpandDay(date)}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-0.5"
            title="Expand to day view"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,3 21,3 21,9"></polyline>
              <polyline points="9,21 3,21 3,15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Sessions container - no left margin since we removed the time column */}
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        {/* Render session blocks with gaps */}
        {sessionBlocks.map((block, blockIndex) => {
          // Calculate block positioning
          let blockTop = 0;
          
          // Add heights of previous blocks and gaps
          for (let i = 0; i < blockIndex; i++) {
            const prevBlockStart = Math.min(...sessionBlocks[i].map(s => new Date(s.start_time).getTime()));
            const prevBlockEnd = Math.max(...sessionBlocks[i].map(s => new Date(s.end_time).getTime()));
            const prevBlockDuration = (prevBlockEnd - prevBlockStart) / (1000 * 60);
            blockTop += prevBlockDuration * heightMultiplier;
            blockTop += 40; // Gap height
          }
          
          const blockStart = Math.min(...block.map(s => new Date(s.start_time).getTime()));
          const blockEnd = Math.max(...block.map(s => new Date(s.end_time).getTime()));
          const blockDuration = (blockEnd - blockStart) / (1000 * 60);
          const blockHeight = blockDuration * heightMultiplier;
          
          return (
            <div key={`block-${blockIndex}`}>
              {/* Orange gap bar before this block (except for first block) */}
              {blockIndex > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${blockTop - 20}px`, // Center the bar in the gap
                    height: '4px',
                    left: '0%',
                    width: '100%',
                    backgroundColor: '#f97316',
                    opacity: 0.8,
                    zIndex: 1
                  }}
                />
              )}
              
              {/* Sessions in this block */}
              {block.map((session, sessionIndex) => {
                const sessionStart = new Date(session.start_time);
                const sessionEnd = new Date(session.end_time);
                
                // Position relative to block start
                const sessionStartMinutes = (sessionStart.getTime() - blockStart) / (1000 * 60);
                const sessionDurationMinutes = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60);
                
                const sessionTop = blockTop + (sessionStartMinutes * heightMultiplier);
                const sessionHeight = sessionDurationMinutes * heightMultiplier;

                // Handle overlaps within the block - find all sessions that overlap with this one
                const overlappingSessions = block.filter(otherSession => {
                  const otherStart = new Date(otherSession.start_time);
                  const otherEnd = new Date(otherSession.end_time);
                  return sessionStart < otherEnd && sessionEnd > otherStart;
                });

                let sessionWidth = "100%";
                let sessionLeft = "0%";

                if (overlappingSessions.length > 1) {
                  // Sort overlapping sessions by start time to ensure consistent positioning
                  overlappingSessions.sort((a, b) => 
                    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                  );
                  
                  const overlapCount = overlappingSessions.length;
                  const sessionIndexInOverlap = overlappingSessions.findIndex(s => s.id === session.id);
                  
                  sessionWidth = `${100 / overlapCount}%`;
                  sessionLeft = `${(sessionIndexInOverlap * 100) / overlapCount}%`;
                }

                return (
                  <div
                    key={session.id}
                    style={{ 
                      position: 'absolute', 
                      top: `${sessionTop}px`, 
                      height: `${sessionHeight}px`, 
                      left: sessionLeft, 
                      width: sessionWidth
                    }}
                  >
                    <SessionCard
                      session={session}
                      isEditing={editingSession === session.id}
                      teachers={teachers}
                      teachingAssistants={teachingAssistants}
                      facilities={facilities}
                      sessionWidth="100%"
                      sessionLeft="0%"
                      onEdit={() => onEditSession(session.id)}
                      onUpdate={onUpdateSession}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayColumn;
