import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab } from '@/shared/types';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import PayrollTab from '@/dashboard/tabs/payroll/PayrollTab';
import { getMainTabs, handleSubTabNavigation, handleMainTabClick } from '@/components/navigation/NavigationConfig';

export default function PayrollPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState<TabType>('payroll');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('taichinh');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      const savedActiveTab = localStorage.getItem('payroll-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('payroll-active-main-tab') as MainTabType;

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
      localStorage.setItem('payroll-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('payroll-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

  // Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // For tabs that exist in payroll page (payroll)
    const payrollTabs = ['payroll'];

    if (payrollTabs.includes(subTabId)) {
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
      case 'payroll':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quản lý Lương</h2>
                <p className="text-gray-600">Quản lý kỳ lương, bảng lương và báo cáo lương</p>
              </div>
            </div>

            <PayrollTab />
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <title>Quản lý Lương - MerakiERP</title>
        <meta name="description" content="Quản lý kỳ lương, bảng lương và báo cáo lương" />
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
              MerakiERP - Lương
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
    </ProtectedRoute>
  );
}
