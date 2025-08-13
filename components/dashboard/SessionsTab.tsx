import React, { useState, useEffect, useCallback } from 'react';
import AttendanceModal from './AttendanceModal';
import TeacherFeedbackModal from './TeacherFeedbackModal';
import ClassCheckInModal from './ClassCheckInModal';

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
  teacher?: {
    id: string;
    full_name: string;
  };
  teaching_assistant?: {
    id: string;
    full_name: string;
  };
  location?: {
    facility_name: string;
    room_name: string;
    room_id: string;
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
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: boolean }>({});
  const [feedbackStatus, setFeedbackStatus] = useState<{ [key: string]: boolean }>({});
  const [checkInStatus, setCheckInStatus] = useState<{ [key: string]: 'none' | 'teacher_only' | 'both_confirmed' }>({});
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
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    sessionId: string;
    sessionInfo?: {
      lessonName: string;
      time: string;
      className: string;
      teacherName: string;
    };
  }>({
    isOpen: false,
    sessionId: '',
    sessionInfo: undefined
  });
  const [checkInModal, setCheckInModal] = useState<{
    isOpen: boolean;
    sessionId: string;
    sessionInfo?: {
      lessonName: string;
      time: string;
      className: string;
      teacherName: string;
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

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions?start_date=${selectedDate}&end_date=${selectedDate}`);
      const result = await response.json();
      
      if (result.success) {
        const sessionsData = result.data || [];
        setSessions(sessionsData);
        groupSessionsByMainSession(sessionsData);
        // Fetch attendance status for all main sessions
        await fetchAttendanceStatus(sessionsData);
        // Fetch teacher feedback status for all sessions
        await fetchTeacherFeedbackStatus(sessionsData);
        // Fetch check-in status for all sessions
        await fetchCheckInStatus(sessionsData);
      } else {
        console.error('API returned error:', result.message);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const fetchAttendanceStatus = async (sessionsData: Session[]) => {
    try {
      // Get unique main session IDs
      const mainSessionIds = Array.from(new Set(sessionsData.map(session => session.main_session_id)));
      
      const attendanceStatusMap: { [key: string]: boolean } = {};
      
      // Check attendance for each main session
      await Promise.all(
        mainSessionIds.map(async (mainSessionId) => {
          if (mainSessionId) {
            try {
              const response = await fetch(`/api/attendance?main_session_id=${mainSessionId}&limit=1`);
              const result = await response.json();
              
              if (result.success) {
                // If there are any attendance records, mark as true
                attendanceStatusMap[mainSessionId] = result.data && result.data.length > 0;
              } else {
                attendanceStatusMap[mainSessionId] = false;
              }
            } catch (error) {
              console.error(`Error fetching attendance for main session ${mainSessionId}:`, error);
              attendanceStatusMap[mainSessionId] = false;
            }
          }
        })
      );
      
      setAttendanceStatus(attendanceStatusMap);
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
  };

  const fetchTeacherFeedbackStatus = async (sessionsData: Session[]) => {
    try {
      const feedbackStatusMap: { [key: string]: boolean } = {};
      
      // Check teacher feedback for each session
      await Promise.all(
        sessionsData.map(async (session) => {
          if (session.id) {
            try {
              const response = await fetch(`/api/sessions/${session.id}`);
              const result = await response.json();
              
              if (result.success && result.data?.data?.teacher_feedback) {
                // Check if teacher feedback exists and has meaningful data
                const feedback = result.data.data.teacher_feedback;
                const hasRatings = Object.values(feedback).some((value: any) => 
                  typeof value === 'number' && value > 0
                );
                const hasGeneralFeedback = feedback.general_feedback && feedback.general_feedback.trim().length > 0;
                
                feedbackStatusMap[session.id] = hasRatings || hasGeneralFeedback;
              } else {
                feedbackStatusMap[session.id] = false;
              }
            } catch (error) {
              console.error(`Error fetching teacher feedback for session ${session.id}:`, error);
              feedbackStatusMap[session.id] = false;
            }
          }
        })
      );
      
      setFeedbackStatus(feedbackStatusMap);
    } catch (error) {
      console.error('Error fetching teacher feedback status:', error);
    }
  };

  const fetchCheckInStatus = async (sessionsData: Session[]) => {
    try {
      const checkInStatusMap: { [key: string]: 'none' | 'teacher_only' | 'both_confirmed' } = {};
      
      // Check teacher check-in for each session
      await Promise.all(
        sessionsData.map(async (session) => {
          if (session.id) {
            try {
              const response = await fetch(`/api/sessions/${session.id}`);
              const result = await response.json();
              
              if (result.success && result.data?.data?.teacher_checkin) {
                // Check if teacher check-in exists and is completed
                const checkin = result.data.data.teacher_checkin;
                if (checkin.is_completed === true && checkin.staff_confirmed === true) {
                  checkInStatusMap[session.id] = 'both_confirmed';
                } else if (checkin.is_completed === true) {
                  checkInStatusMap[session.id] = 'teacher_only';
                } else {
                  checkInStatusMap[session.id] = 'none';
                }
              } else {
                checkInStatusMap[session.id] = 'none';
              }
            } catch (error) {
              console.error(`Error fetching teacher check-in for session ${session.id}:`, error);
              checkInStatusMap[session.id] = 'none';
            }
          }
        })
      );
      
      setCheckInStatus(checkInStatusMap);
    } catch (error) {
      console.error('Error fetching teacher check-in status:', error);
    }
  };

  const groupSessionsByMainSession = useCallback((sessionsData: Session[]) => {
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
  }, []);

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

  const handleTeacherFeedback = (session: Session) => {
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName || `${session.subject_type} ${session.main_session_id}`;
    const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';
    const teacherName = session.teacher?.full_name || 'Unknown Teacher';
    
    setFeedbackModal({
      isOpen: true,
      sessionId: session.id,
      sessionInfo: {
        lessonName,
        time: `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`,
        className,
        teacherName
      }
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      sessionId: '',
      sessionInfo: undefined
    });
    // Refresh teacher feedback status after modal closes
    if (sessions.length > 0) {
      fetchTeacherFeedbackStatus(sessions);
    }
  };

  const handleClassCheckIn = (session: Session) => {
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName || `${session.subject_type} ${session.main_session_id}`;
    const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';
    const teacherName = session.teacher?.full_name || 'Unknown Teacher';
    
    setCheckInModal({
      isOpen: true,
      sessionId: session.id,
      sessionInfo: {
        lessonName,
        time: `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`,
        className,
        teacherName
      }
    });
  };

  const closeCheckInModal = () => {
    setCheckInModal({
      isOpen: false,
      sessionId: '',
      sessionInfo: undefined
    });
    // Refresh check-in status after modal closes
    if (sessions.length > 0) {
      fetchCheckInStatus(sessions);
    }
  };

  const getTeacherFeedbackButtonProps = (session: Session) => {
    const hasFeedback = feedbackStatus[session.id] || false;
    
    if (hasFeedback) {
      return {
        text: 'Xem nhận xét',
        className: 'px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded text-xs font-medium transition-colors',
        onClick: () => handleTeacherFeedback(session)
      };
    } else {
      return {
        text: 'Nhận xét',
        className: 'px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-90 rounded text-xs font-medium transition-colors',
        onClick: () => handleTeacherFeedback(session)
      };
    }
  };

  const getAttendanceButtonProps = (session: Session) => {
    const hasAttendance = attendanceStatus[session.main_session_id] || false;
    
    if (hasAttendance) {
      return {
        text: 'Xem điểm danh',
        className: 'px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded text-xs font-medium transition-colors',
        onClick: () => handleViewAttendance(session)
      };
    } else {
      return {
        text: 'Điểm danh',
        className: 'px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-medium transition-colors',
        onClick: () => handleCreateAttendance(session)
      };
    }
  };

  const handleCreateAttendance = (session: Session) => {
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

  const handleViewAttendance = (session: Session) => {
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName || `${session.subject_type} ${session.main_session_id}`;
    const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';
    
    // Get the class_id from the main session or session data
    const classId = session.main_sessions?.class_id || session.main_sessions?.classes?.id || '';
    
    // Open the attendance modal in view mode (same modal, but with existing data)
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
    // Refresh attendance status after modal closes
    if (sessions.length > 0) {
      fetchAttendanceStatus(sessions);
    }
  };

  const renderSessionCard = (session: Session, isInGroup: boolean = false, isLastInGroup: boolean = false) => {
    // Extract lesson part without class name (e.g., "U3 L3 GS12" -> "U3 L3")
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName.replace(/\s+GS\d+$/, '') || `${session.subject_type} ${session.main_session_id}`;
    
    // Use smaller margin between sessions within a group, no margin for last session
    const marginClass = isInGroup ? (isLastInGroup ? 'mb-0' : 'mb-1') : 'mb-2';
    
    return (
      <div key={session.id} className={`p-2 rounded-lg ${marginClass} ${getSessionColor(session)}`}>
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
                {session.teacher?.full_name || 'Chưa phân công'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-sm">👩‍🎓</span>
              <span className="text-sm">
                {session.teaching_assistant?.full_name || 'Chưa có TA'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-sm">📍</span>
              <span className="text-sm">
                {session.location ? `${session.location.room_name}` : 'Chưa có phòng'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const status = checkInStatus[session.id] || 'none';
              let buttonClass = '';
              let title = '';
              
              switch (status) {
                case 'both_confirmed':
                  buttonClass = 'bg-blue-100 hover:bg-blue-200 text-blue-800';
                  title = 'Both confirmed - View times';
                  break;
                case 'teacher_only':
                  buttonClass = 'bg-orange-100 hover:bg-orange-200 text-orange-800';
                  title = 'Teacher checked in - Staff confirmation needed';
                  break;
                default:
                  buttonClass = 'bg-gray-100 hover:bg-gray-200 text-gray-800';
                  title = 'Class check-in';
                  break;
              }
              
              return (
                <button
                  onClick={() => handleClassCheckIn(session)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${buttonClass}`}
                  title={title}
                >
                  🕐
                </button>
              );
            })()}
            {(() => {
              const buttonProps = getAttendanceButtonProps(session);
              return (
                <button
                  onClick={buttonProps.onClick}
                  className={buttonProps.className}
                >
                  {buttonProps.text}
                </button>
              );
            })()}
            {session.teacher && (() => {
              const buttonProps = getTeacherFeedbackButtonProps(session);
              return (
                <button
                  onClick={buttonProps.onClick}
                  className={buttonProps.className}
                >
                  {buttonProps.text}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderMainSessionGroup = (group: MainSessionGroup) => {
    // Show blue header only when there are 2 or more sessions (TSI and REP)
    const shouldShowHeader = group.sessions.length >= 2;
    
    return (
      <div key={`${group.main_session_id}-${group.class_id}`} className={shouldShowHeader ? "mb-3" : "mb-1"}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Group Header - only show when there are multiple sessions */}
          {shouldShowHeader && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4">
              <h3 className="font-bold text-lg">{group.class_name}</h3>
            </div>
          )}
          
          {/* Sessions */}
          <div className={shouldShowHeader ? "p-1" : "p-1"}>
            {group.sessions.map((session, index) => 
              renderSessionCard(session, shouldShowHeader, index === group.sessions.length - 1)
            )}
          </div>
        </div>
      </div>
    );
  };

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

      {/* Teacher Feedback Modal */}
      <TeacherFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={closeFeedbackModal}
        sessionId={feedbackModal.sessionId}
        sessionInfo={feedbackModal.sessionInfo}
      />

      {/* Class Check-in Modal */}
      <ClassCheckInModal
        isOpen={checkInModal.isOpen}
        onClose={closeCheckInModal}
        sessionId={checkInModal.sessionId}
        sessionInfo={checkInModal.sessionInfo}
      />
    </div>
  );
};

export default SessionsTab;
