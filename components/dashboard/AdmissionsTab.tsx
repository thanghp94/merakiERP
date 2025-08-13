import React, { useState, useEffect } from 'react';
import { Admission } from './shared/types';
import AdmissionsKanban from './AdmissionsKanban';

interface AdmissionsTabProps {
  onAddAdmission: () => void;
}

const AdmissionsTab: React.FC<AdmissionsTabProps> = ({ onAddAdmission }) => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admissions');
      if (response.ok) {
        const data = await response.json();
        setAdmissions(data);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAdmissionStatus = async (id: string, newStatus: string) => {
    try {
      const admission = admissions.find(a => a.id === id);
      if (!admission) return;

      const response = await fetch(`/api/admissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...admission,
          status: newStatus,
        }),
      });

      if (response.ok) {
        fetchAdmissions();
      }
    } catch (error) {
      console.error('Error updating admission status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      fanpage_inquiry: { label: 'Hỏi Fanpage', className: 'bg-blue-100 text-blue-800' },
      zalo_consultation: { label: 'Tư vấn Zalo', className: 'bg-green-100 text-green-800' },
      trial_class: { label: 'Học thử', className: 'bg-purple-100 text-purple-800' },
      enrolled: { label: 'Đã đăng ký', className: 'bg-emerald-100 text-emerald-800' },
      follow_up: { label: 'Theo sát', className: 'bg-orange-100 text-orange-800' },
      rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getNextStepSuggestion = (status: string) => {
    const nextSteps = {
      pending: 'fanpage_inquiry',
      fanpage_inquiry: 'zalo_consultation',
      zalo_consultation: 'trial_class',
      trial_class: 'enrolled',
      follow_up: 'zalo_consultation'
    };
    return nextSteps[status as keyof typeof nextSteps];
  };

  const filteredAdmissions = admissions.filter(admission => {
    if (filter === 'all') return true;
    return admission.status === filter;
  });

  const getStatusCounts = () => {
    const counts = {
      all: admissions.length,
      pending: 0,
      fanpage_inquiry: 0,
      zalo_consultation: 0,
      trial_class: 0,
      enrolled: 0,
      follow_up: 0,
      rejected: 0
    };

    admissions.forEach(admission => {
      counts[admission.status as keyof typeof counts]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Tuyển sinh</h2>
          <p className="text-gray-600">Theo dõi khách hàng tiềm năng qua hành trình tuyển sinh</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Danh sách
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Kanban
            </button>
          </div>
          
          <button
            onClick={onAddAdmission}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            Thêm khách hàng tiềm năng
          </button>
        </div>
      </div>

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'kanban' ? (
        <AdmissionsKanban
          admissions={admissions}
          onUpdateStatus={updateAdmissionStatus}
          onAddAdmission={onAddAdmission}
        />
      ) : (
        <>
          {/* Status Filter Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { key: 'all', label: 'Tất cả', count: statusCounts.all },
                { key: 'pending', label: 'Chờ xử lý', count: statusCounts.pending },
                { key: 'fanpage_inquiry', label: 'Fanpage', count: statusCounts.fanpage_inquiry },
                { key: 'zalo_consultation', label: 'Zalo', count: statusCounts.zalo_consultation },
                { key: 'trial_class', label: 'Học thử', count: statusCounts.trial_class },
                { key: 'enrolled', label: 'Đã đăng ký', count: statusCounts.enrolled },
                { key: 'follow_up', label: 'Theo sát', count: statusCounts.follow_up },
                { key: 'rejected', label: 'Từ chối', count: statusCounts.rejected }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Admissions List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredAdmissions.length === 0 ? (
                <li className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">🎓</div>
                  <p>Chưa có khách hàng tiềm năng nào</p>
                  <p className="text-sm">Thêm khách hàng tiềm năng để bắt đầu theo dõi</p>
                </li>
              ) : (
                filteredAdmissions.map((admission) => (
                  <li key={admission.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {admission.student_name}
                            </h3>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                              <span>📱 {admission.phone}</span>
                              {admission.email && <span>✉️ {admission.email}</span>}
                              {admission.parent_name && <span>👨‍👩‍👧‍👦 {admission.parent_name}</span>}
                              {admission.location && <span>📍 {admission.location}</span>}
                            </div>
                            <div className="mt-2 flex items-center space-x-4">
                              <span className="text-sm text-gray-500">
                                📅 {new Date(admission.application_date).toLocaleDateString('vi-VN')}
                              </span>
                              {admission.data?.interested_program && (
                                <span className="text-sm text-gray-500">
                                  📚 {admission.data.interested_program}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(admission.status)}
                            {getNextStepSuggestion(admission.status) && (
                              <button
                                onClick={() => updateAdmissionStatus(admission.id, getNextStepSuggestion(admission.status)!)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Bước tiếp theo →
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {admission.data?.notes && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            💬 {admission.data.notes}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="mt-3 flex space-x-2">
                          <select
                            value={admission.status}
                            onChange={(e) => updateAdmissionStatus(admission.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="fanpage_inquiry">Hỏi Fanpage</option>
                            <option value="zalo_consultation">Tư vấn Zalo</option>
                            <option value="trial_class">Học thử</option>
                            <option value="enrolled">Đã đăng ký</option>
                            <option value="follow_up">Theo sát</option>
                            <option value="rejected">Từ chối</option>
                          </select>
                          
                          {admission.data?.urgency && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              admission.data.urgency === 'high' ? 'bg-red-100 text-red-800' :
                              admission.data.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {admission.data.urgency === 'high' ? '🔥 Khẩn cấp' :
                               admission.data.urgency === 'medium' ? '⚡ Trung bình' : '🟢 Thấp'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default AdmissionsTab;
