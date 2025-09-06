import React from 'react';
import { Session, Employee } from './types';
import { getSessionColor, formatTime } from './utils';
import SessionEditForm from './SessionEditForm';

interface SessionCardProps {
  session: Session;
  isEditing: boolean;
  teachers: Employee[];
  teachingAssistants: Employee[];
  facilities: any[];
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
  facilities,
  sessionWidth,
  sessionLeft,
  onEdit,
  onUpdate
}) => {
  const startTime = formatTime(session.start_time.substring(11, 16));
  const endTime = formatTime(session.end_time.substring(11, 16));
  
  // Get teacher and TA names by looking up IDs in the provided arrays
  const teacher = teachers.find(t => t.id === session.teacher_id) || 
                 session.employees_teacher;
  const teachingAssistant = teachingAssistants.find(ta => ta.id === session.teaching_assistant_id) || 
                           session.employees_assistant;
  
  // Get facility/room name by looking up location_id
  const facility = facilities.find(f => f.id === session.location_id);
  
  const teacherName = teacher?.full_name || session.data?.teacher_name || 'Teacher';
  const taName = teachingAssistant?.full_name || session.data?.ta_name || session.data?.teaching_assistant_name;
  const roomName = facility?.facility_name || facility?.name || session.data?.location || session.data?.room || session.data?.facility_name || 'Room';
  const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Class';

  return (
    <div
      className={`p-1 rounded cursor-pointer hover:shadow-md transition-shadow border-2 ${getSessionColor(session)}`}
      style={{
        width: sessionWidth,
        left: sessionLeft,
        height: '100%',
        fontSize: '10px'
      }}
      onClick={() => onEdit(session.id)}
    >
      {/* Class name at the top */}
      <div className="font-bold mb-1">
        {className}
      </div>
      
      {/* Teacher name */}
      <div className="mb-1">
        {teacherName}
      </div>
      
      
      {/* Time */}
      <div>
        {startTime}-{endTime}
      </div>
      
      {/* Edit form */}
      {isEditing && (
        <SessionEditForm
          session={session}
          teachers={teachers}
          teachingAssistants={teachingAssistants}
          facilities={facilities}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default SessionCard;
