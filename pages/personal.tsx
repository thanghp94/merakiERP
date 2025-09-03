import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab } from '@/shared/types';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import PersonalTabWithSidebar from '@/dashboard/tabs/personal/PersonalTabWithSidebar';
import TaskForm from '@/components/TaskForm';
import { Task } from '@/dashboard/shared/types';
import { formatDate, getStatusBadge } from '@/dashboard/shared/utils';
import { DataTable, TableColumn } from '@/dashboard/shared';
import { getMainTabs, handleSubTabNavigation, handleMainTabClick } from '@/components/navigation/NavigationConfig';

export default function PersonalPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('hcns');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tasks state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Define the hierarchical navigation structure (same as dashboard)
  const mainTabs: MainTab[] = getMainTabs();

  // Handle query parameter for pre-selected tab
  useEffect(() => {
    if (tab && typeof tab === 'string') {
      // Only set tab if it's supported by personal page
      const supportedTabs = ['personal', 'tasks'];
      if (supportedTabs.includes(tab)) {
        setActiveTab(tab as TabType);
        // Also set the appropriate main tab based on the subtab
        const mainTabsData = getMainTabs();
        for (const mainTab of mainTabsData) {
          if (mainTab.subtabs.some(sub => sub.id === tab)) {
            setActiveMainTab(mainTab.id);
            break;
          }
        }
      } else {
        // If unsupported tab requested, default to personal
        setActiveTab('personal');
      }
    }
  }, [tab]);

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('personal-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('personal-active-main-tab') as MainTabType;

      // Only restore supported tabs
      const supportedTabs = ['personal', 'tasks'];
      if (savedActiveTab && supportedTabs.includes(savedActiveTab)) {
        setActiveTab(savedActiveTab);
      } else {
        // Default to personal if no valid saved tab
        setActiveTab('personal');
      }
      
      if (savedActiveMainTab) {
        setActiveMainTab(savedActiveMainTab);
      }
    }
  }, []);

  // Save tab state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only save supported tabs
      const supportedTabs = ['personal', 'tasks'];
      if (supportedTabs.includes(activeTab)) {
        localStorage.setItem('personal-active-tab', activeTab);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('personal-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

  // Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // For tabs that exist in personal page (personal, tasks)
    const personalTabs = ['personal', 'tasks'];

    if (personalTabs.includes(subTabId)) {
      setActiveTab(subTabId);
    } else {
      // Use centralized navigation handler for other tabs
      handleSubTabNavigation(subTabId, window.location.pathname);
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };



  // Tasks functionality
  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab]);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await fetch('/api/tasks');
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
      } else {
        console.error('Failed to fetch tasks:', result.message);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleFormSubmit = async (data: any, formType: string) => {
    console.log(`${formType} form submitted:`, data);

    try {
      let endpoint = '';
      let method = 'POST';

      // Check if this is an edit operation (data has an id)
      const isEdit = data.id;

      switch (formType) {
        case 'Task':
          endpoint = isEdit ? `/api/tasks/${data.id}` : '/api/tasks';
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

        // Refresh tasks list
        if (formType === 'Task') {
          setShowTaskForm(false);
          fetchTasks();
        }
      } else {
        throw new Error(result.message || 'Failed to save data');
      }
    } catch (error) {
      console.error(`Error saving ${formType}:`, error);
      alert(`Lỗi khi lưu ${formType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  // Create table columns configuration for tasks
  const getTableColumns = (): TableColumn<Task>[] => {
    return [
      {
        key: 'title',
        label: 'Tiêu đề',
        render: (value, row) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {row.data?.instructions && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {row.data.instructions}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'class_name',
        label: 'Lớp học',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.classes?.class_name || 'N/A'}
          </div>
        )
      },
      {
        key: 'description',
        label: 'Mô tả',
        render: (value) => (
          <div className="text-sm text-gray-900 truncate max-w-xs">
            {value || '-'}
          </div>
        )
      },
      {
        key: 'due_date',
        label: 'Hạn nộp',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {formatDate(value)}
          </div>
        )
      },
      {
        key: 'points',
        label: 'Điểm số',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.points || '-'}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => getStatusBadge(value)
      }
    ];
  };

  const renderTabContent = () => {
    // Always default to personal tab if activeTab is not supported
    const supportedTabs = ['personal', 'tasks'];
    const currentTab = supportedTabs.includes(activeTab) ? activeTab : 'personal';
    
    switch (currentTab) {
      case 'personal':
        return <PersonalTabWithSidebar />;
      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Bài tập</h2>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showTaskForm ? '📋' : '➕'}</span>
                <span>{showTaskForm ? 'Xem danh sách' : 'Thêm bài tập'}</span>
              </button>
            </div>

            {showTaskForm ? (
              <TaskForm onSubmit={(data) => handleFormSubmit(data, 'Task')} />
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách bài tập ({tasks.length})
                    </h3>
                  </div>

                  <DataTable
                    data={tasks}
                    columns={getTableColumns()}
                    isLoading={isLoadingTasks}
                    emptyState={{
                      icon: (
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      ),
                      title: 'Không có bài tập nào',
                      description: 'Chưa có bài tập nào được tạo.'
                    }}
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        // This should never happen now, but keep as fallback
        return <PersonalTabWithSidebar />;
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Quản lý Cá nhân - MerakiERP</title>
        <meta name="description" content="Quản lý thông tin cá nhân" />
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
              MerakiERP - Cá nhân
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

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onSubmit={(data) => handleFormSubmit(data, 'Task')}
        />
      )}


    </ProtectedRoute>
  );
}
