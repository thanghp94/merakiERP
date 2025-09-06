import React, { useState, useEffect } from 'react';
import { Session, Employee } from './types';
import { formatTime } from './utils';

interface SessionEditFormProps {
  session: Session;
  teachers: Employee[];
  teachingAssistants: Employee[];
  facilities: any[];
  onUpdate: (sessionId: string, updates: Partial<Session>) => void;
}

const SessionEditForm: React.FC<SessionEditFormProps> = ({
  session,
  teachers,
  teachingAssistants,
  facilities,
  onUpdate
}) => {
  const [localStartTime, setLocalStartTime] = useState(formatTime(session.start_time.substring(11, 16)));
  const [localEndTime, setLocalEndTime] = useState(formatTime(session.end_time.substring(11, 16)));

  // Update local state when session prop changes
  useEffect(() => {
    setLocalStartTime(formatTime(session.start_time.substring(11, 16)));
    setLocalEndTime(formatTime(session.end_time.substring(11, 16)));
  }, [session.start_time, session.end_time]);

  const handleStartTimeBlur = () => {
    const newStartTime = `${session.start_time.substring(0, 11)}${localStartTime}:00Z`;
    onUpdate(session.id, { start_time: newStartTime });
  };

  const handleEndTimeBlur = () => {
    const newEndTime = `${session.end_time.substring(0, 11)}${localEndTime}:00Z`;
    onUpdate(session.id, { end_time: newEndTime });
  };

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
        
        <div>
          <label className="text-xs font-medium">Room:</label>
          <select
            value={session.data?.room || ''}
            onChange={(e) => {
              const updatedData = { ...session.data, room: e.target.value || undefined };
              onUpdate(session.id, { data: updatedData });
            }}
            className="w-full text-xs border rounded px-1 py-1"
          >
            <option value="">No Room</option>
            {(() => {
              // Find the facility associated with the class
              const classData = session.main_sessions?.classes;
              const classFacilityId = (classData as any)?.data?.facility_id;
              
              if (classFacilityId) {
                const classFacility = facilities.find(f => f.id === classFacilityId);
                if (classFacility && classFacility.data?.rooms) {
                  return classFacility.data.rooms.map((room: any, index: number) => {
                    const roomName = typeof room === 'string' ? room : room.name || room.id || 'Room';
                    const roomValue = typeof room === 'string' ? room : room.name || room.id;
                    return (
                      <option key={`${classFacility.id}-${index}`} value={roomValue}>
                        {roomName}
                      </option>
                    );
                  });
                }
              }
              
              // Fallback: show all rooms from all facilities if no class facility found
              return facilities.map(facility => {
                const rooms = facility.data?.rooms || [];
                return rooms.map((room: any, index: number) => {
                  const roomName = typeof room === 'string' ? room : room.name || room.id || 'Room';
                  const roomValue = typeof room === 'string' ? room : room.name || room.id;
                  return (
                    <option key={`${facility.id}-${index}`} value={roomValue}>
                      {roomName}
                    </option>
                  );
                });
              }).flat();
            })()}
          </select>
        </div>
        
        <div className="flex space-x-1">
          <input
            type="time"
            value={localStartTime}
            onChange={(e) => setLocalStartTime(e.target.value)}
            onBlur={handleStartTimeBlur}
            className="flex-1 text-xs border rounded px-1 py-1"
          />
          <input
            type="time"
            value={localEndTime}
            onChange={(e) => setLocalEndTime(e.target.value)}
            onBlur={handleEndTimeBlur}
            className="flex-1 text-xs border rounded px-1 py-1"
          />
        </div>
      </div>
    </div>
  );
};

export default SessionEditForm;
