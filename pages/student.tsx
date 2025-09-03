import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab, SubTab, Student } from '@/shared/types';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import StudentDetailModal from '@/dashboard/tabs/students/StudentDetailModal';
import StudentsTab from '@/dashboard/tabs/students/StudentsTab';
import TuitionTab from '@/dashboard/tabs/students/TuitionTab';
import { getMainTabs, handleSubTabNavigation, handleMainTabClick } from '@/components/navigation/NavigationConfig';

export default function StudentPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('khachhang');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('student-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('student-active-main-tab') as MainTabType;

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
      localStorage.setItem('student-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('student-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

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

  // Students management state
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Detail modal states
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

  // Fetch functions
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch('/api/students');
      const result = await response.json();

      if (result.success) {
        setStudents(result.data);
      } else {
        console.error('Failed to fetch students:', result.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };



  // Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // For tabs that exist in student page (students, tuition)
    const studentTabs = ['students', 'tuition'];

    if (studentTabs.includes(subTabId)) {
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
        case 'Student':
          endpoint = isEdit ? `/api/students/${data.id}` : '/api/students';
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
        if (formType === 'Student') {
          setShowStudentForm(false);
          fetchStudents();
        }


      } else {
        throw new Error(result.message || 'Failed to save data');
      }
    } catch (error) {
      console.error(`Error saving ${formType}:`, error);
      alert(`Lỗi khi lưu ${formType}: ${error instanceof Error ? error.message : 'Unknown error'}`);


    }
  };

  // Detail view handlers
  const handleStudentView = (student: Student) => {
    setSelectedStudentForDetail(student);
    setShowStudentDetail(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return (
          <StudentsTab
            showStudentForm={showStudentForm}
            setShowStudentForm={setShowStudentForm}
            onViewStudent={handleStudentView}
          />
        );
      case 'tuition':
        return <TuitionTab />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Quản lý học sinh - MerakiERP</title>
        <meta name="description" content="Quản lý học sinh và học phí" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex">
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
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  MerakiERP - Học sinh
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

      {/* Detail View Modals */}
      <StudentDetailModal
        isOpen={showStudentDetail}
        onClose={() => {
          setShowStudentDetail(false);
          setSelectedStudentForDetail(null);
        }}
        student={selectedStudentForDetail}
      />
    </ProtectedRoute>
  );
}
