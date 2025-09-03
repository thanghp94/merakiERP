import React, { useState, useEffect } from 'react';
import { formatDate } from '../../../shared/utils';

interface TeachingSessionsViewProps {
  employee: any;
}

const TeachingSessionsView: React.FC<TeachingSessionsViewProps> = ({ employee }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeachingSessions();
  }, [employee]);

  const fetchTeachingSessions = async () => {
    setIsLoading(true);
    try {
      // Fetch sessions where this employee is either the teacher or teaching assistant
      // Since the API doesn't support filtering by teaching_assistant_id, we'll fetch all sessions
      // and filter on the client side for now
      const response = await fetch(`/api/sessions?limit=1000`);
      const result = await response.json();
      
      if (result.success) {
        // Filter sessions where the employee is either teacher or teaching assistant
        const userSessions = (result.data || []).filter((session: any) => 
          session.teacher_id === employee.id || session.teaching_assistant_id === employee.id
        );
        setSessions(userSessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching teaching sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Buổi dạy của tôi</h3>
          <p className="text-sm text-gray-600">Các buổi dạy được phân công cho bạn</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">👨‍🏫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có buổi dạy nào</h3>
          <p className="text-gray-600">Bạn chưa được phân công buổi dạy nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session: any) => (
            <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{session.title || 'Buổi học'}</h4>
                  <p className="text-sm text-gray-600">{session.class_name || 'Lớp học'}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  session.status === 'completed' ? 'bg-green-100 text-green-800' :
                  session.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {session.status === 'completed' ? 'Hoàn thành' :
                   session.status === 'in_progress' ? 'Đang diễn ra' : 'Chưa bắt đầu'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">📅</span>
                  {formatDate(session.session_date)}
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">🕐</span>
                  {session.start_time} - {session.end_time}
                </div>
                {session.location && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2">📍</span>
                    {session.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeachingSessionsView;
