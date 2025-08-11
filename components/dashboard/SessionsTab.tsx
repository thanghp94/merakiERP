import React, { useState, useEffect } from 'react';
import AttendanceModal from './AttendanceModal';

interface Session {
  id: string;
  main_session_id: string;
  subject_type: string;
  teacher_id: string;
  teaching_assistant_id?: string;
  location_id?: string;
  start_time: string;
  end_time: string;
  date: string;
  data?: any;
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
  employees?: {
    id: string;
    full_name: string;
  };
}

interface MainSessionGroup {
  main_session_id: number;
  main_session_name: string;
  class_name: string;
  class_id: string;
  program_type?: string;
  sessions: Session[];
}

interface SessionsTabProps {}

const SessionsTab: React.FC<SessionsTabProps> = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2025-08-11'); // Default to date with actual data
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mainSessionGroups, setMainSessionGroups] = useState<MainSessionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean;
    sessionId: string;
    sessionInfo?: {
      lessonName: string;
      time: string;
      className: string;
      classId?: string;
    };
  }>({
    isOpen: false,
    sessionId: '',
    sessionInfo: undefined
  });

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setViewMode(window.innerWidth >= 768 ? 'desktop' : 'mobile');
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [selectedDate]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions?start_date=${selectedDate}&end_date=${selectedDate}`);
      const result = await response.json();
      
      if (result.success) {
        const sessionsData = result.data || [];
        setSessions(sessionsData);
        groupSessionsByMainSession(sessionsData);
      } else {
        console.error('API returned error:', result.message);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupSessionsByMainSession = (sessionsData: Session[]) => {
    const groups: { [key: string]: MainSessionGroup } = {};

    sessionsData.forEach(session => {
      // Group by main_session_id (which references main_sessions.main_session_id)
      const key = session.main_session_id?.toString() || 'unknown';
      
      if (!groups[key]) {
        // Use the actual class name from the main session or session data
        const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';
        
        groups[key] = {
          main_session_id: parseInt(session.main_session_id?.toString() || '0'),
          main_session_name: session.data?.subject_name || `Lesson ${session.main_session_id}`,
          class_name: className,
          class_id: key,
          program_type: 'GrapeSEED', // Default for now
          sessions: []
        };
      }
      
      groups[key].sessions.push(session);
    });

    // Sort sessions within each group by start time
    Object.values(groups).forEach(group => {
      group.sessions.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    });

    setMainSessionGroups(Object.values(groups));
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionColor = (session: Session) => {
    // For now, assume all sessions are GrapeSEED based on the data we saw
    switch (session.subject_type) {
      case 'TSI':
        return 'bg-blue-50 border-l-4 border-blue-400 text-blue-800';
      case 'REP':
        return 'bg-green-50 border-l-4 border-green-400 text-green-800';
      default:
        return 'bg-purple-50 border-l-4 border-purple-400 text-purple-800';
    }
  };

  const handleTeacherFeedback = (sessionId: string, teacherId: string) => {
    // TODO: Implement teacher feedback functionality
    alert(`Mở form nhận xét cho session ${sessionId} - teacher ${teacherId}`);
  };

  const handleAttendance = (session: Session) => {
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName || `${session.subject_type} ${session.main_session_id}`;
    const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';
    
    // Get the class_id from the main session or session data
    const classId = session.main_sessions?.class_id || session.main_sessions?.classes?.id || '';
    
    setAttendanceModal({
      isOpen: true,
      sessionId: session.id,
      sessionInfo: {
        lessonName,
        time: `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`,
        className,
        classId
      }
    });
  };

  const closeAttendanceModal = () => {
    setAttendanceModal({
      isOpen: false,
      sessionId: '',
      sessionInfo: undefined
    });
  };

  const renderSessionCard = (session: Session) => {
    // Extract lesson part without class name (e.g., "U3 L3 GS12" -> "U3 L3")
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName.replace(/\s+GS\d+$/, '') || `${session.subject_type} ${session.main_session_id}`;
    
    return (
      <div key={session.id} className={`p-2 rounded-lg mb-2 ${getSessionColor(session)}`}>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-lg">
            {lessonName}
          </h4>
          <p className="text-base font-medium opacity-90">
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </p>
          <span className="inline-block px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium">
            {session.subject_type}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm">👨‍🏫</span>
              <span className="text-sm font-medium">
                {session.data?.teacher_name || 'Chưa phân công'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-sm">👩‍🎓</span>
              <span className="text-sm">
                TA {session.data?.location?.replace('R1.1 ', '') || 'Van'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-sm">📍</span>
              <span className="text-sm">
                {session.data?.location?.match(/R\d+\.\d+/)?.[0] || 'R1.1'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAttendance(session)}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-medium transition-colors"
            >
              Điểm danh
            </button>
            {session.data?.teacher_name && (
              <button
                onClick={() => handleTeacherFeedback(session.id, session.teacher_id)}
                className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-90 rounded text-xs font-medium transition-colors"
              >
                Nhận xét
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMainSessionGroup = (group: MainSessionGroup) => (
    <div key={`${group.main_session_id}-${group.class_id}`} className="mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Group Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4">
          <h3 className="font-bold text-lg">{group.class_name}</h3>
        </div>
        
        {/* Sessions */}
        <div className="p-4">
          {group.sessions.map(session => renderSessionCard(session))}
        </div>
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {mainSessionGroups.map(group => renderMainSessionGroup(group))}
    </div>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {mainSessionGroups.map(group => renderMainSessionGroup(group))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Buổi học</h2>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(selectedDate).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() - 1);
                setSelectedDate(currentDate.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Ngày trước"
            >
              ←
            </button>
            
            <div className="flex items-center gap-2">
              <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
                Chọn ngày:
              </label>
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <button
              onClick={() => {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() + 1);
                setSelectedDate(currentDate.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Ngày sau"
            >
              →
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                setSelectedDate(today.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors"
            >
              Hôm nay
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      ) : mainSessionGroups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có buổi học nào</h3>
          <p className="text-gray-600">Không có buổi học nào được lên lịch cho ngày này.</p>
        </div>
      ) : (
        viewMode === 'desktop' ? renderDesktopView() : renderMobileView()
      )}

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={attendanceModal.isOpen}
        onClose={closeAttendanceModal}
        sessionId={attendanceModal.sessionId}
        sessionInfo={attendanceModal.sessionInfo}
      />
    </div>
  );
};

export default SessionsTab;
