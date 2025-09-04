import React from 'react';
import { Session, Employee } from './types';
import { formatTime } from './utils';

interface SessionEditFormProps {
  session: Session;
  teachers: Employee[];
  teachingAssistants: Employee[];
  onUpdate: (sessionId: string, updates: Partial<Session>) => void;
}

const SessionEditForm: React.FC<SessionEditFormProps> = ({
  session,
  teachers,
  teachingAssistants,
  onUpdate
}) => {
  const startTime = formatTime(session.start_time.substring(11, 16));
  const endTime = formatTime(session.end_time.substring(11, 16));

  return (
    <div className="absolute bg-white border rounded shadow-lg p-2 z-50 mt-1 min-w-[200px] top-full left-0">
      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium">Teacher:</label>
          <select
            value={session.teacher_id}
            onChange={(e) => onUpdate(session.id, { teacher_id: e.target.value })}
            className="w-full text-xs border rounded px-1 py-1"
          >
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-xs font-medium">TA:</label>
          <select
            value={session.teaching_assistant_id || ''}
            onChange={(e) => onUpdate(session.id, { teaching_assistant_id: e.target.value || undefined })}
            className="w-full text-xs border rounded px-1 py-1"
          >
            <option value="">No TA</option>
            {teachingAssistants.map(ta => (
              <option key={ta.id} value={ta.id}>
                {ta.full_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-1">
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              const newStartTime = `${session.date}T${e.target.value}:00Z`;
              onUpdate(session.id, { start_time: newStartTime });
            }}
            className="flex-1 text-xs border rounded px-1 py-1"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              const newEndTime = `${session.date}T${e.target.value}:00Z`;
              onUpdate(session.id, { end_time: newEndTime });
            }}
            className="flex-1 text-xs border rounded px-1 py-1"
          />
        </div>
      </div>
    </div>
  );
};

export default SessionEditForm;
