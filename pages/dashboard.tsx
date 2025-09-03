import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ROLES } from '@/auth/rbac';
import { TabType, MainTabType, MainTab, SubTab, ApiTestResult, Class, Facility, ProgramType, UnitOption, Employee, Student, Enrollment, Attendance, Finance, Task, Admission } from '@/shared/types';
import { tabs, getNextSuggestedUnit } from '@/shared/utils';
import { Button, Card, Badge } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import PersonalTabWithSidebar from '@/dashboard/tabs/personal/PersonalTabWithSidebar';
import { getMainTabs, handleSubTabNavigation } from '@/components/navigation/NavigationConfig';



import AttendanceTab from '@/dashboard/tabs/attendance/AttendanceTab';


import BusinessTasksTab from '@/dashboard/tabs/tasks/BusinessTasksTab';
import ScheduleTab from '@/dashboard/tabs/schedule/ScheduleTab';
import ApiTestTab from '@/dashboard/tabs/api-test/ApiTestTab';
import AdmissionsTab from '@/dashboard/tabs/admissions/AdmissionsTab';
import AdmissionForm from '@/components/AdmissionForm';
import RequestsTab from '@/dashboard/tabs/requests/RequestsTab';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('facilities');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('hcns');
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('dashboard-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('dashboard-active-main-tab') as MainTabType;
      
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
      localStorage.setItem('dashboard-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

  // Define the hierarchical navigation structure
  const mainTabs: MainTab[] = getMainTabs();










  // Attendance management state
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoadingAttendances, setIsLoadingAttendances] = useState(false);

  // Finances management state
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [isLoadingFinances, setIsLoadingFinances] = useState(false);



  // Admissions management state
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);




  useEffect(() => {
    if (activeTab === 'sessions') {
      // Sessions tab handles its own data fetching
    } else if (activeTab === 'attendance') {
      fetchAttendances();
    } else if (activeTab === 'finances') {
      fetchFinances();
    }
  }, [activeTab]);








  const fetchAttendances = async () => {
    setIsLoadingAttendances(true);
    try {
      const response = await fetch('/api/attendance');
      const result = await response.json();
      
      if (result.success) {
        setAttendances(result.data);
      } else {
        console.error('Failed to fetch attendances:', result.message);
        setAttendances([]);
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
      setAttendances([]);
    } finally {
      setIsLoadingAttendances(false);
    }
  };

  const fetchFinances = async () => {
    setIsLoadingFinances(true);
    try {
      // Use the enhanced API endpoint
      const response = await fetch('/api/finances/enhanced');
      const result = await response.json();
      
      if (result.success) {
        setFinances(result.data);
      } else {
        console.error('Failed to fetch finances:', result.message);
        setFinances([]);
      }
    } catch (error) {
      console.error('Error fetching finances:', error);
      setFinances([]);
    } finally {
      setIsLoadingFinances(false);
    }
  };

  // Removed fetchTasks and related state management as tasks moved to separate page



  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data = await response.json();

      const result: ApiTestResult = {
        endpoint,
        method,
        status: response.status,
        data,
      };

      setApiResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      const result: ApiTestResult = {
        endpoint,
        method,
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setApiResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    const endpoints = [
      '/api/students',
      '/api/facilities',
      '/api/classes',
      '/api/employees',
      '/api/teaching-sessions',
      '/api/attendance',
      '/api/finances',
      '/api/tasks',
      '/api/enrollments'
    ];

    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

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
    // For tabs that still exist in dashboard (like attendance, schedule, api-test)
    const dashboardTabs = ['attendance', 'schedule', 'api-test'];

    if (dashboardTabs.includes(subTabId)) {
      setActiveTab(subTabId);
    } else {
      // Use centralized navigation handler for other tabs
      handleSubTabNavigation(subTabId, window.location.pathname);
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleFormSubmit = async (data: any, formType: string) => {
    console.log(`${formType} form submitted:`, data);
    
    try {
      let endpoint = '';
      let method = 'POST';
      
      // Check if this is an edit operation (data has an id)
      const isEdit = data.id;
      
      switch (formType) {
        case 'Attendance':
          endpoint = isEdit ? `/api/attendance/${data.id}` : '/api/attendance';
          method = isEdit ? 'PUT' : 'POST';
          break;
        case 'Finance':
          endpoint = isEdit ? `/api/finances/${data.id}` : '/api/finances';
          method = isEdit ? 'PUT' : 'POST';
          break;
        case 'Admission':
          endpoint = isEdit ? `/api/admissions/${data.id}` : '/api/admissions';
          method = isEdit ? 'PUT' : 'POST';
          break;
        default:
          throw new Error(`Unknown form type: ${formType}`);
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        const action = isEdit ? 'cập nhật' : 'lưu';
        alert(`${formType} đã được ${action} thành công!`);
        console.log(`${formType} ${action}d successfully:`, result);
        
        // Refresh lists when items are added/updated
        if (formType === 'Attendance') {
          setShowAttendanceForm(false);
          fetchAttendances();
        } else if (formType === 'Finance') {
          setShowFinanceForm(false);
          fetchFinances();
        } else if (formType === 'Admission') {
          setShowAdmissionForm(false);
          // Refresh admissions will be handled by the AdmissionsTab component
        }
        
        const apiResult: ApiTestResult = {
          endpoint,
          method,
          status: response.status,
          data: result,
        };
        setApiResults(prev => [apiResult, ...prev.slice(0, 9)]);
      } else {
        throw new Error(result.message || 'Failed to save data');
      }
    } catch (error) {
      console.error(`Error saving ${formType}:`, error);
      alert(`Lỗi khi lưu ${formType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      const apiResult: ApiTestResult = {
        endpoint: '/api/' + formType.toLowerCase() + 's',
        method: 'POST',
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setApiResults(prev => [apiResult, ...prev.slice(0, 9)]);
    }
  };







  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Cá nhân</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý cá nhân đã được chuyển sang trang riêng.</p>
            <a
              href="/personal"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Cá nhân
            </a>
          </div>
        );
      case 'facilities':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Cơ sở</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý cơ sở đã được chuyển sang trang riêng.</p>
            <a
              href="/facilities"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Cơ sở
            </a>
          </div>
        );
      case 'classes':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Lớp học</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý lớp học đã được chuyển sang trang riêng.</p>
            <a
              href="/classes"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Lớp học
            </a>
          </div>
        );
      case 'employees':
        return <div>Employee management has been moved to <a href="/employee" className="text-blue-500 underline">/employee</a> page</div>;

      case 'sessions':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Buổi học</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý buổi học đã được chuyển sang trang riêng.</p>
            <a
              href="/sessions"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Buổi học
            </a>
          </div>
        );
      case 'attendance':
        return (
          <AttendanceTab
            showAttendanceForm={showAttendanceForm}
            setShowAttendanceForm={setShowAttendanceForm}
            attendances={attendances}
            isLoadingAttendances={isLoadingAttendances}
            handleFormSubmit={handleFormSubmit}
          />
        );
      case 'finances':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Tài chính</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý tài chính đã được chuyển sang trang riêng.</p>
            <a
              href="/finances"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Tài chính
            </a>
          </div>
        );
      case 'payroll':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Lương</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý lương đã được chuyển sang trang riêng.</p>
            <a
              href="/payroll"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Lương
            </a>
          </div>
        );
      case 'tasks':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Bài tập</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý bài tập đã được chuyển sang trang cá nhân.</p>
            <a
              href="/personal"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Cá nhân
            </a>
          </div>
        );
      case 'business-tasks':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Công việc</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý công việc đã được chuyển sang trang riêng.</p>
            <a
              href="/businesstask"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Công việc
            </a>
          </div>
        );
      case 'schedule':
        return <ScheduleTab />;
      case 'requests':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Yêu cầu</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý yêu cầu đã được chuyển sang trang riêng.</p>
            <a
              href="/requests"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Yêu cầu
            </a>
          </div>
        );
      case 'admissions':
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý Tuyển sinh</h3>
            <p className="text-gray-500 mb-4">Chức năng quản lý tuyển sinh đã được chuyển sang trang riêng.</p>
            <a
              href="/admissions"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Đến trang Tuyển sinh
            </a>
          </div>
        );
      case 'api-test':
        return (
          <ApiTestTab
            apiResults={apiResults}
            loading={loading}
            testEndpoint={testEndpoint}
            testAllEndpoints={testAllEndpoints}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard - MerakiERP</title>
        <meta name="description" content="Dashboard quản lý trung tâm" />
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
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-teal-500 bg-clip-text text-transparent">
                  MerakiERP
                </h1>
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6">
            <Card className="h-full overflow-hidden shadow-xl" shadow="lg" padding="sm">
              {renderTabContent()}
            </Card>
          </main>
        </div>
      </div>

      {/* Unit Transition Modal */}
      {/* Removed UnitTransitionModal from dashboard as classes moved to separate page */}

      {/* Class Enrollment Modal */}
      {/* Removed ClassEnrollmentModal from dashboard as classes moved to separate page */}

      {/* Admission Form Modal */}
      {showAdmissionForm && (
        <AdmissionForm
          onSubmit={(data) => handleFormSubmit(data, 'Admission')}
          onCancel={() => setShowAdmissionForm(false)}
        />
      )}



      {/* Removed EmployeeDetailModal as employee management moved to /employee page */}


    </ProtectedRoute>
  );
}
