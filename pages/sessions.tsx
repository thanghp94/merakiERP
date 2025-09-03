import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab } from '@/shared/types';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import AttendanceModal from '@/dashboard/tabs/attendance/AttendanceModal';
import TeacherFeedbackModal from '@/dashboard/modals/TeacherFeedbackModal';
import ClassCheckInModal from '@/dashboard/tabs/classes/ClassCheckInModal';
import MediaUploadModal from '@/dashboard/modals/MediaUploadModal';

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

export default function SessionsPage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('vanhanh');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sessions state
  const [selectedDate, setSelectedDate] = useState<string>('2025-08-11');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mainSessionGroups, setMainSessionGroups] = useState<MainSessionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: boolean }>({});
  const [feedbackStatus, setFeedbackStatus] = useState<{ [key: string]: boolean }>({});
  const [checkInStatus, setCheckInStatus] = useState<{ [key: string]: 'none' | 'teacher_only' | 'both_confirmed' }>({});

  // Modal states
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

  const [mediaUploadModal, setMediaUploadModal] = useState<{
    isOpen: boolean;
    sessionId: string;
    sessionInfo?: {
      lessonName: string;
      className: string;
      time: string;
    };
  }>({
    isOpen: false,
    sessionId: '',
    sessionInfo: undefined
  });

  // Define the hierarchical navigation structure (same as dashboard)
  const mainTabs: MainTab[] = [
    {
      id: 'vanhanh',
      label: 'Vận hành',
      icon: '⚙️',
      subtabs: [
        { id: 'classes', label: 'Lớp học', icon: '🏫' },
        { id: 'sessions', label: 'Buổi học', icon: '📚' },
        { id: 'schedule', label: 'Lịch học', icon: '📅' }
      ]
    },
    {
      id: 'khachhang',
      label: 'Khách hàng',
      icon: '👥',
      subtabs: [
        { id: 'admissions', label: 'Tuyển sinh', icon: '📋' },
        { id: 'students', label: 'Học sinh', icon: '🎓' }
      ]
    },
    {
      id: 'taichinh',
      label: 'Tài chính',
      icon: '💰',
      subtabs: [
        { id: 'finances', label: 'Tài chính', icon: '💳' },
        { id: 'payroll', label: 'Lương', icon: '💰' }
      ]
    },
    {
      id: 'hcns',
      label: 'HCNS',
      icon: '👤',
      subtabs: [
        { id: 'employees', label: 'Nhân viên', icon: '👨‍💼' },
        { id: 'requests', label: 'Yêu cầu', icon: '📋' },
        { id: 'tasks', label: 'Bài tập', icon: '📝' },
        { id: 'business-tasks', label: 'Công việc', icon: '💼' },
        { id: 'facilities', label: 'Cơ sở', icon: '🏢' }
      ]
    }
  ];

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('sessions-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('sessions-active-main-tab') as MainTabType;

      if (savedActiveTab) {
        setActiveTab(savedActiveTab);
      }
      if (savedActiveMainTab) {
        setActiveMainTab(savedActiveMainTab);
      }
    }
  }, []);

  // Save tab state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessions-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessions-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

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
        await fetchAttendanceStatus(sessionsData);
        await fetchTeacherFeedbackStatus(sessionsData);
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
      const mainSessionIds = Array.from(new Set(sessionsData.map(session => session.main_session_id)));
      const attendanceStatusMap: { [key: string]: boolean } = {};

      await Promise.all(
        mainSessionIds.map(async (mainSessionId) => {
          if (mainSessionId) {
            try {
              const response = await fetch(`/api/attendance?main_session_id=${mainSessionId}&limit=1`);
              const result = await response.json();

              if (result.success) {
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

      await Promise.all(
        sessionsData.map(async (session) => {
          if (session.id) {
            try {
              const response = await fetch(`/api/sessions/${session.id}`);
              const result = await response.json();

              if (result.success && result.data?.data?.teacher_feedback) {
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

      await Promise.all(
        sessionsData.map(async (session) => {
          if (session.id) {
            try {
              const response = await fetch(`/api/sessions/${session.id}`);
              const result = await response.json();

              if (result.success && result.data?.data?.teacher_checkin) {
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
      const key = session.main_session_id?.toString() || 'unknown';

      if (!groups[key]) {
        const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';

        groups[key] = {
          main_session_id: parseInt(session.main_session_id?.toString() || '0'),
          main_session_name: session.data?.subject_name || `Lesson ${session.main_session_id}`,
          class_name: className,
          class_id: key,
          program_type: 'GrapeSEED',
          sessions: []
        };
      }

      groups[key].sessions.push(session);
    });

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
    switch (session.subject_type) {
      case 'TSI':
        return 'bg-orange-50 border-l-4 border-orange-400 text-orange-800';
      case 'REP':
        return 'bg-teal-50 border-l-4 border-teal-400 text-teal-800';
      default:
        return 'bg-orange-50 border-l-4 border-orange-400 text-orange-800';
    }
  };

  // Modal handlers
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
    if (sessions.length > 0) {
      fetchCheckInStatus(sessions);
    }
  };

  const handleCreateAttendance = (session: Session) => {
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName || `${session.subject_type} ${session.main_session_id}`;
    const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';
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
    if (sessions.length > 0) {
      fetchAttendanceStatus(sessions);
    }
  };

  const handleMediaUpload = (session: Session) => {
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName || `${session.subject_type} ${session.main_session_id}`;
    const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Unknown Class';

    setMediaUploadModal({
      isOpen: true,
      sessionId: session.id,
      sessionInfo: {
        lessonName,
        className,
        time: `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`
      }
    });
  };

  const closeMediaUploadModal = () => {
    setMediaUploadModal({
      isOpen: false,
      sessionId: '',
      sessionInfo: undefined
    });
  };

  // Button props helpers
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
        className: 'px-3 py-1 bg-white bg-opacity-70 hover:bg-white hover:bg-opacity-90 text-gray-700 rounded text-xs font-medium transition-colors',
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
        className: 'px-3 py-1 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded text-xs font-medium transition-colors',
        onClick: () => handleCreateAttendance(session)
      };
    }
  };

  const renderSessionCard = (session: Session, isInGroup: boolean = false, isLastInGroup: boolean = false) => {
    const subjectName = session.data?.subject_name || '';
    const lessonName = subjectName.replace(/\s+GS\d+$/, '') || `${session.subject_type} ${session.main_session_id}`;
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
                  buttonClass = 'bg-teal-100 hover:bg-teal-200 text-teal-800';
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

            <button
              onClick={() => handleMediaUpload(session)}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-medium transition-colors flex items-center gap-1"
              title="Upload media to Google Drive"
            >
              📷
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMainSessionGroup = (group: MainSessionGroup) => {
    const shouldShowHeader = group.sessions.length >= 2;

    return (
      <div key={`${group.main_session_id}-${group.class_id}`} className={shouldShowHeader ? "mb-3" : "mb-1"}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {shouldShowHeader && (
            <div className="bg-gradient-to-r from-orange-500 to-teal-500 text-white py-2 px-4">
              <h3 className="font-bold text-lg">{group.class_name}</h3>
            </div>
          )}

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

  // Navigation helper functions
  const handleMainTabClick = (mainTabId: MainTabType) => {
    setActiveMainTab(mainTabId);
    // Set the first subtab as active when switching main tabs
    const mainTab = mainTabs.find(tab => tab.id === mainTabId);
    if (mainTab && mainTab.subtabs.length > 0) {
      setActiveTab(mainTab.subtabs[0].id);
    }
  };

  const handleSubTabClick = (subTabId: TabType) => {
    setActiveTab(subTabId);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sessions':
        return (
          <div className="space-y-4">
            {/* Date Picker */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-orange-600">Buổi học</h2>
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
                    className="px-3 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
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
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const currentDate = new Date(selectedDate);
                      currentDate.setDate(currentDate.getDate() + 1);
                      setSelectedDate(currentDate.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chức năng đang phát triển</h3>
            <p className="text-gray-500 mb-4">Chức năng này sẽ được phát triển trong tương lai.</p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Quay lại Dashboard
            </a>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Quản lý Buổi học - MerakiERP</title>
        <meta name="description" content="Quản lý buổi học và điểm danh" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 flex">
        {/* Sidebar */}
        <Sidebar
          mainTabs={mainTabs}
          activeMainTab={activeMainTab}
          activeTab={activeTab}
          onMainTabClick={handleMainTabClick}
          onSubTabClick={handleSubTabClick}
          isMobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={handleMobileMenuClose}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-teal-500 bg-clip-text text-transparent">
              MerakiERP - Buổi học
            </h1>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6">
            <Card className="h-full overflow-hidden shadow-xl" shadow="lg" padding="sm">
              {renderTabContent()}
            </Card>
          </main>
        </div>
      </div>

      {/* Modals */}
      <AttendanceModal
        isOpen={attendanceModal.isOpen}
        onClose={closeAttendanceModal}
        sessionId={attendanceModal.sessionId}
        sessionInfo={attendanceModal.sessionInfo}
      />

      <TeacherFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={closeFeedbackModal}
        sessionId={feedbackModal.sessionId}
        sessionInfo={feedbackModal.sessionInfo}
      />

      <ClassCheckInModal
        isOpen={checkInModal.isOpen}
        onClose={closeCheckInModal}
        sessionId={checkInModal.sessionId}
        sessionInfo={checkInModal.sessionInfo}
      />

      <MediaUploadModal
        isOpen={mediaUploadModal.isOpen}
        onClose={closeMediaUploadModal}
        sessionId={mediaUploadModal.sessionId}
        sessionInfo={mediaUploadModal.sessionInfo}
      />
    </ProtectedRoute>
  );
}
