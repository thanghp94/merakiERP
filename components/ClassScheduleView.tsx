import React, { useState, useEffect } from 'react';

interface Session {
  id: string;
  lesson_id: number;
  subject_type: string;
  teacher_id: string;
  teaching_assistant_id?: string;
  location_id?: string;
  start_time: string;
  end_time: string;
  date?: string;
  data?: any;
  // Relations
  main_sessions?: {
    main_session_id: number;
    main_session_name: string;
    scheduled_date: string;
    class_id: string;
    classes?: {
      id: string;
      class_name: string;
      data?: {
        program_type?: string;
      };
    };
  };
  employees_teacher?: {
    id: string;
    full_name: string;
  };
  employees_assistant?: {
    id: string;
    full_name: string;
  };
}

interface Employee {
  id: string;
  full_name: string;
  position: string;
}

interface ClassScheduleViewProps {
  classId?: string;
}

const ClassScheduleView: React.FC<ClassScheduleViewProps> = ({ classId }) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [teachingAssistants, setTeachingAssistants] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [draggedSession, setDraggedSession] = useState<Session | null>(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState<string | null>(null);
  const [dragPreviewTime, setDragPreviewTime] = useState<{ start: string; end: string } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  // Generate dynamic time slots based on actual sessions - only show times where sessions exist
  const generateTimeSlots = () => {
    if (sessions.length === 0) {
      return [];
    }

    // Get all unique start and end times from sessions
    const allTimes = new Set<string>();
    
    sessions.forEach(session => {
      const startTime = session.start_time.substring(11, 16); // Extract HH:MM from ISO string
      const endTime = session.end_time.substring(11, 16);
      allTimes.add(startTime);
      allTimes.add(endTime);
    });

    // Convert to sorted array
    const sortedTimes = Array.from(allTimes).sort();
    
    // Generate 30-minute intervals between the earliest and latest times
    if (sortedTimes.length === 0) return [];
    
    const [earliestHour, earliestMinute] = sortedTimes[0].split(':').map(Number);
    const [latestHour, latestMinute] = sortedTimes[sortedTimes.length - 1].split(':').map(Number);
    
    const slots = [];
    let currentHour = earliestHour;
    let currentMinute = earliestMinute;
    
    // Round down to nearest 30-minute interval
    currentMinute = Math.floor(currentMinute / 30) * 30;
    
    const latestTotalMinutes = latestHour * 60 + latestMinute;
    
    while (currentHour * 60 + currentMinute <= latestTotalMinutes) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(time);
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchSessions();
    fetchEmployees();
  }, [currentDate, viewMode, classId]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      let url = `/api/sessions?start_date=${startDate}&end_date=${endDate}`;
      if (classId) {
        url += `&class_id=${classId}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      
      if (result.success) {
        const teachersList = result.data.filter((emp: Employee) => {
          const position = emp.position?.toLowerCase() || '';
          return position.includes('giáo viên') || position.includes('teacher') || position.includes('gv');
        });
        setTeachers(teachersList);

        const assistantsList = result.data.filter((emp: Employee) => {
          const position = emp.position?.toLowerCase() || '';
          return position.includes('trợ giảng') || position.includes('assistant') || position.includes('ta');
        });
        setTeachingAssistants(assistantsList);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const getStartDate = () => {
    if (viewMode === 'day') {
      return currentDate.toISOString().split('T')[0];
    } else {
      // Week view - get Monday of current week
      const monday = new Date(currentDate);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      return monday.toISOString().split('T')[0];
    }
  };

  const getEndDate = () => {
    if (viewMode === 'day') {
      return currentDate.toISOString().split('T')[0];
    } else {
      // Week view - get Sunday of current week
      const sunday = new Date(currentDate);
      const day = sunday.getDay();
      const diff = sunday.getDate() - day + 7;
      sunday.setDate(diff);
      return sunday.toISOString().split('T')[0];
    }
  };

  const getSessionColor = (session: Session) => {
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

  const getSessionsForDate = (date: string) => {
    return sessions.filter(session => 
      session.date === date
    );
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM format
  };

  const updateSession = async (sessionId: string, updates: Partial<Session>) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (result.success) {
        fetchSessions(); // Refresh sessions
        setEditingSession(null);
      } else {
        alert(`Error updating session: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Error updating session');
    }
  };

  const calculateTimeFromPosition = (clientY: number, containerElement: HTMLElement, date: string) => {
    const rect = containerElement.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    
    // Each time slot is approximately 50px high, representing 30 minutes
    const minutesPerPixel = 30 / 50; // 0.6 minutes per pixel
    const totalMinutes = relativeY * minutesPerPixel;
    
    // Round to nearest 5 minutes for smoother experience
    const roundedMinutes = Math.round(totalMinutes / 5) * 5;
    
    // Find the earliest time slot for this day to use as base
    const daySessions = getSessionsForDate(date);
    if (daySessions.length === 0) return null;
    
    const dayTimeSlots = new Set<string>();
    daySessions.forEach(session => {
      const startTime = session.start_time.substring(11, 16);
      const endTime = session.end_time.substring(11, 16);
      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
      
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        dayTimeSlots.add(timeSlot);
      }
    });
    
    const sortedTimeSlots = Array.from(dayTimeSlots).sort();
    if (sortedTimeSlots.length === 0) return null;
    
    // Calculate base time from first time slot
    const [baseHours, baseMinutes] = sortedTimeSlots[0].split(':').map(Number);
    const baseTimeInMinutes = baseHours * 60 + baseMinutes;
    
    const newTimeInMinutes = Math.max(0, baseTimeInMinutes + roundedMinutes);
    const newHours = Math.floor(newTimeInMinutes / 60);
    const newMinutes = newTimeInMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const handleDragStart = (e: React.DragEvent, session: Session) => {
    setDraggedSession(session);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', session.id);
    
    // Set initial drag position
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragOver = (e: React.DragEvent, timeSlot: string, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTimeSlot(`${date}-${timeSlot}`);
    
    // Update drag position and calculate preview time
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    if (draggedSession) {
      const container = e.currentTarget.closest('.day-column') as HTMLElement;
      if (container) {
        const newStartTime = calculateTimeFromPosition(e.clientY, container, date);
        if (newStartTime) {
          const sessionDuration = new Date(draggedSession.end_time).getTime() - new Date(draggedSession.start_time).getTime();
          const newStartDate = new Date(`${date}T${newStartTime}:00Z`);
          const newEndDate = new Date(newStartDate.getTime() + sessionDuration);
          
          setDragPreviewTime({
            start: newStartTime,
            end: newEndDate.toTimeString().substring(0, 5)
          });
        }
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the entire day column
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverTimeSlot(null);
      setDragPreviewTime(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, timeSlot: string, date: string) => {
    e.preventDefault();
    setDragOverTimeSlot(null);
    setDragPreviewTime(null);
    setDragPosition(null);
    
    if (!draggedSession) return;

    const container = e.currentTarget.closest('.day-column') as HTMLElement;
    if (container) {
      const newStartTime = calculateTimeFromPosition(e.clientY, container, date);
      if (newStartTime) {
        const sessionDuration = new Date(draggedSession.end_time).getTime() - new Date(draggedSession.start_time).getTime();
        const newStartDate = new Date(`${date}T${newStartTime}:00Z`);
        const newEndDate = new Date(newStartDate.getTime() + sessionDuration);

        // Update the session with new times
        await updateSession(draggedSession.id, {
          start_time: newStartDate.toISOString(),
          end_time: newEndDate.toISOString(),
          date: date
        });
      }
    }

    setDraggedSession(null);
  };

  const handleDragEnd = () => {
    setDraggedSession(null);
    setDragOverTimeSlot(null);
    setDragPreviewTime(null);
    setDragPosition(null);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const renderDayColumn = (date: string, dayName: string) => {
    const daySessions = getSessionsForDate(date);
    
    if (daySessions.length === 0) {
      return (
        <div key={date} className="flex-1 border border-gray-300">
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

    // Get unique time slots for this day only
    const dayTimeSlots = new Set<string>();
    daySessions.forEach(session => {
      const startTime = session.start_time.substring(11, 16);
      const endTime = session.end_time.substring(11, 16);
      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
      
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        dayTimeSlots.add(timeSlot);
      }
    });

    const sortedTimeSlots = Array.from(dayTimeSlots).sort();

    return (
      <div key={date} className="flex-1 border border-gray-300 day-column relative">
        {/* Day header */}
        <div className="bg-gray-50 p-2 text-center border-b border-gray-300">
          <div className="font-semibold text-sm">{dayName.toUpperCase()}</div>
          <div className="text-xs text-gray-600">{date}</div>
        </div>

        {/* Time slots for this day */}
        {sortedTimeSlots.map(timeSlot => {
          // Find sessions that start at this time slot
          const timeSlotSessions = daySessions.filter(session => {
            const sessionStartTime = session.start_time.substring(11, 16);
            return sessionStartTime === timeSlot;
          });

          const isDropTarget = dragOverTimeSlot === `${date}-${timeSlot}`;
          
          return (
            <div 
              key={`${date}-${timeSlot}`} 
              className={`flex border-b border-gray-300 min-h-[50px] ${isDropTarget ? 'bg-blue-50 border-blue-300' : ''}`}
              onDragOver={(e) => handleDragOver(e, timeSlot, date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, timeSlot, date)}
            >
              {/* Time column for this day */}
              <div className="w-16 p-2 border-r border-gray-300 text-sm font-medium bg-gray-50 flex items-center">
                {timeSlot}
              </div>
              
              {/* Session content */}
              <div className="flex-1 p-1">
                {timeSlotSessions.map((session, sessionIndex) => {
                  const startTime = session.start_time.substring(11, 16);
                  const endTime = session.end_time.substring(11, 16);
                  const isDragging = draggedSession?.id === session.id;
                  
                  return (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, session)}
                      onDragEnd={handleDragEnd}
                      className={`p-2 mb-1 rounded text-xs cursor-move hover:shadow-md transition-shadow ${getSessionColor(session)} ${isDragging ? 'opacity-50' : ''}`}
                      onClick={() => setEditingSession(editingSession === session.id ? null : session.id)}
                    >
                      <div className="font-semibold">
                        {session.data?.subject_name || session.subject_type}
                      </div>
                      <div className="text-xs">
                        {session.data?.teacher_name || 'Teacher'} {session.data?.location || 'Room'}
                      </div>
                      
                      {/* Edit form */}
                      {editingSession === session.id && (
                        <div className="absolute bg-white border rounded shadow-lg p-2 z-50 mt-1 min-w-[200px]">
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium">Teacher:</label>
                              <select
                                value={session.teacher_id}
                                onChange={(e) => updateSession(session.id, { teacher_id: e.target.value })}
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
                                onChange={(e) => updateSession(session.id, { teaching_assistant_id: e.target.value || undefined })}
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
                                  updateSession(session.id, { start_time: newStartTime });
                                }}
                                className="flex-1 text-xs border rounded px-1 py-1"
                              />
                              <input
                                type="time"
                                value={endTime}
                                onChange={(e) => {
                                  const newEndTime = `${session.date}T${e.target.value}:00Z`;
                                  updateSession(session.id, { end_time: newEndTime });
                                }}
                                className="flex-1 text-xs border rounded px-1 py-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Drop zone indicator for empty time slots */}
                {timeSlotSessions.length === 0 && isDropTarget && (
                  <div className="p-2 text-xs text-blue-600 text-center border-2 border-dashed border-blue-300 rounded">
                    Drop session here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderScheduleTable = () => {
    if (sessions.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          No sessions found for this time period
        </div>
      );
    }

    // Get all sessions for the week
    const weekDates: string[] = [];
    const startDate = new Date(getStartDate());
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }

    return (
      <div className="flex">
        {weekDays.map((dayName, index) => 
          renderDayColumn(weekDates[index], dayName)
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Class Schedule</h2>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  viewMode === 'day' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  viewMode === 'week' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                Week
              </button>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <span className="font-medium min-w-[120px] text-center">
                {viewMode === 'day' 
                  ? currentDate.toLocaleDateString()
                  : `Week of ${getStartDate()}`
                }
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Today
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center space-x-4 mt-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>TSI (GrapeSEED)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>REP (GrapeSEED)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Other</span>
          </div>
        </div>
      </div>
      
      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          renderScheduleTable()
        )}
      </div>

      {/* Drag Time Indicator */}
      {dragPreviewTime && dragPosition && (
        <div
          className="fixed z-50 bg-black text-white px-2 py-1 rounded text-xs pointer-events-none"
          style={{
            left: dragPosition.x + 10,
            top: dragPosition.y - 30,
          }}
        >
          {dragPreviewTime.start} - {dragPreviewTime.end}
        </div>
      )}
    </div>
  );
};

export default ClassScheduleView;
