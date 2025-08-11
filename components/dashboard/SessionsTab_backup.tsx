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
  employees_teacher?: {
    id: string;
    full_name: string;
  };
  employees_assistant?: {
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
  const [selectedDate, setSelectedDate] = useState('2025-08-04'); // Set to a date that has data for testing
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mainSessionGroups, setMainSessionGroups] = useState<MainSessionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

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
      // Since we don't have main_sessions join, we'll group by lesson_id
      const key = session.lesson_id?.toString() || 'unknown';
      
      if (!groups[key]) {
        // Extract class name from subject_name (e.g., "U3 L3 GS12" -> "GS12")
        const subjectName = session.data?.subject_name || '';
        const classNameMatch = subjectName.match(/GS\d+/);
        const className = classNameMatch ? classNameMatch[0] : (session.data?.class_name || 'Unknown Class');
        
        groups[key] = {
          main_session_id: parseInt(session.lesson_id?.toString() || '0'),
          main_session_name: session.data?.subject_name || `Lesson ${session.lesson_id}`,
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

  const renderSessionCard = (session: Session) => {
    // Extract lesson part without class name (e.g., "U3 L3 GS12" -> "U3 L3")
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName.replace(/\s+GS\d+$/, '') || `${session.subject_type} ${session.lesson_id}`;
    
    return (
      <div key={session.id} className={`p-4 rounded-lg mb-3 ${getSessionColor(session)}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">
              {lessonName}
            </h4>
            <p className="text-sm opacity-75">
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </p>
          </div>
          <span className="inline-block px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium">
            {session.subject_type}
          </span>
        </div>
        
        <div>
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
            </div>
            {session.data?.teacher_name && (
              <button
                onClick={() => handleTeacherFeedback(session.id, session.teacher_id)}
                className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-90 rounded text-xs font-medium transition-colors"
              >
                Nhận xét
              </button>
            )}
          </div>
          
          {session.teaching_assistant_id && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">👩‍�</span>
              <span className="text-sm">
                TA: {session.data?.assistant_name || 'Teaching Assistant'}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">📍</span>
            <span className="text-sm">
              {session.data?.location || 'Phòng học'}
            </span>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Buổi học</h2>
          <p className="text-gray-600">Quản lý các buổi học trong ngày</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="session-date" className="text-sm font-medium text-gray-700">
              Ngày:
            </label>
            <input
              id="session-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setSelectedDate('2025-08-04')}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Test Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📚</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tổng buổi học</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">🏫</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Lớp học</p>
              <p className="text-2xl font-bold text-gray-900">{mainSessionGroups.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">👨‍🏫</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Giáo viên</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(sessions.map(s => s.teacher_id)).size}
              </p>
            </div>
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
    </div>
  );
};

export default SessionsTab;
