import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab, Admission } from '@/shared/types';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import AdmissionsKanban from '@/dashboard/tabs/admissions/AdmissionsKanban';
import AdmissionForm from '@/components/AdmissionForm';
import EmailTemplateModal from '@/components/EmailTemplateModal';
import { getMainTabs, handleSubTabNavigation, handleMainTabClick } from '@/components/navigation/NavigationConfig';

export default function AdmissionsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState<TabType>('admissions');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('khachhang');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admissions state
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);

  // Email modal state
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; admission: Admission | null }>({
    isOpen: false,
    admission: null
  });

  // Define the hierarchical navigation structure (same as dashboard)
  const mainTabs: MainTab[] = getMainTabs();

  // Handle query parameter for pre-selected tab
  useEffect(() => {
    if (tab && typeof tab === 'string') {
      setActiveTab(tab as TabType);
      // Also set the appropriate main tab based on the subtab
      const mainTabsData = getMainTabs();
      for (const mainTab of mainTabsData) {
        if (mainTab.subtabs.some(sub => sub.id === tab)) {
          setActiveMainTab(mainTab.id);
          break;
        }
      }
    }
  }, [tab]);

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('admissions-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('admissions-active-main-tab') as MainTabType;

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
      localStorage.setItem('admissions-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admissions-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

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

  const handleFormSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/admissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Khách hàng tiềm năng đã được thêm thành công!');
        console.log('Admission created successfully:', result);
        setShowAdmissionForm(false);
        fetchAdmissions();
      } else {
        throw new Error(result.message || 'Failed to create admission');
      }
    } catch (error) {
      console.error('Error creating admission:', error);
      alert(`Lỗi khi tạo khách hàng tiềm năng: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Email handling
  const handleSendEmail = async (templateId: string) => {
    if (!emailModal.admission) return;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          recipientEmail: emailModal.admission.email,
          admissionData: emailModal.admission
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Email đã được gửi thành công!');
      } else if (result.fallbackUrl) {
        // Gmail API not configured, open Gmail compose window
        const confirmOpen = confirm(
          'Gmail API chưa được cấu hình. Bạn có muốn mở Gmail để gửi email thủ công không?\n\n' +
          'Email template sẽ được điền sẵn cho bạn.'
        );
        if (confirmOpen) {
          window.open(result.fallbackUrl, '_blank');
        }
      } else {
        alert('Có lỗi khi gửi email: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Có lỗi khi gửi email');
    }
  };

  const openEmailModal = (admission: Admission) => {
    setEmailModal({ isOpen: true, admission });
  };

  const closeEmailModal = () => {
    setEmailModal({ isOpen: false, admission: null });
  };

  // Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // For tabs that exist in admissions page (admissions)
    const admissionsTabs = ['admissions'];

    if (admissionsTabs.includes(subTabId)) {
      setActiveTab(subTabId);
    } else {
      // Use centralized navigation handler for other tabs
      handleSubTabNavigation(subTabId, window.location.pathname);
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'admissions':
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
                  onClick={() => setShowAdmissionForm(true)}
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
                onAddAdmission={() => setShowAdmissionForm(true)}
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
        <title>Quản lý Tuyển sinh - MerakiERP</title>
        <meta name="description" content="Quản lý khách hàng tiềm năng và tuyển sinh" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 flex">
        {/* Sidebar */}
        <Sidebar
          mainTabs={mainTabs}
          activeMainTab={activeMainTab}
          activeTab={activeTab}
          onMainTabClick={handleMainTabClickLocal}
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
              MerakiERP - Tuyển sinh
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

      {/* Admission Form Modal */}
      {showAdmissionForm && (
        <AdmissionForm
          onSubmit={handleFormSubmit}
          onCancel={() => setShowAdmissionForm(false)}
        />
      )}

      {/* Email Template Modal */}
      <EmailTemplateModal
        isOpen={emailModal.isOpen}
        onClose={closeEmailModal}
        admission={emailModal.admission!}
        onSendEmail={handleSendEmail}
      />
    </ProtectedRoute>
  );
}
