import React from 'react';
import { Session, Employee } from './types';
import { getSessionColor, formatTime } from './utils';
import SessionEditForm from './SessionEditForm';

interface SessionCardProps {
  session: Session;
  isEditing: boolean;
  teachers: Employee[];
  teachingAssistants: Employee[];
  sessionWidth: string;
  sessionLeft: string;
  onEdit: (sessionId: string) => void;
  onUpdate: (sessionId: string, updates: Partial<Session>) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isEditing,
  teachers,
  teachingAssistants,
  sessionWidth,
  sessionLeft,
  onEdit,
  onUpdate
}) => {
  const startTime = formatTime(session.start_time.substring(11, 16));
  const endTime = formatTime(session.end_time.substring(11, 16));

  return (
    <div
      className={`absolute top-1 p-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${getSessionColor(session)}`}
      style={{
        width: sessionWidth,
        left: sessionLeft,
        minHeight: '60px'
      }}
      onClick={() => onEdit(session.id)}
    >
      <div className="font-semibold">
        {session.data?.subject_name || session.subject_type}
      </div>
      <div className="text-xs">
        {startTime} - {endTime}
      </div>
      <div className="text-xs">
        {session.data?.teacher_name || 'Teacher'} {session.data?.location || 'Room'}
      </div>
      
      {/* Edit form */}
      {isEditing && (
        <SessionEditForm
          session={session}
          teachers={teachers}
          teachingAssistants={teachingAssistants}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default SessionCard;
