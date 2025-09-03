import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/auth/AuthContext';
import { ROLES } from '@/auth/rbac';
import { MainTab, MainTabType, TabType } from '@/shared/types';
import { Button } from '@/components/ui';
import { handleSubTabNavigation } from '@/components/navigation/NavigationConfig';

interface SidebarProps {
  mainTabs: MainTab[];
  activeMainTab: MainTabType;
  activeTab: TabType;
  onMainTabClick: (mainTabId: MainTabType) => void;
  onSubTabClick: (subTabId: TabType) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export default function Sidebar({
  mainTabs,
  activeMainTab,
  activeTab,
  onMainTabClick,
  onSubTabClick,
  isMobileMenuOpen,
  onMobileMenuClose
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [expandedMainTab, setExpandedMainTab] = useState<MainTabType | null>(activeMainTab);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavigateToStudentPage = () => {
    router.push('/student');
    if (isMobileMenuOpen) {
      onMobileMenuClose();
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Quản trị viên';
      case ROLES.TEACHER:
        return 'Giáo viên';
      case ROLES.TA:
        return 'Trợ giảng';
      case ROLES.STUDENT:
        return 'Học sinh';
      default:
        return 'Người dùng';
    }
  };

  const handleMainTabClick = (mainTabId: MainTabType) => {
    // Toggle expansion
    if (expandedMainTab === mainTabId) {
      setExpandedMainTab(null);
    } else {
      setExpandedMainTab(mainTabId);
    }
    // Always call the parent handler to update activeMainTab state
    onMainTabClick(mainTabId);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // Special handling for student management - navigate to dedicated page
    if (subTabId === 'students') {
      handleNavigateToStudentPage();
      return;
    }

    // Special handling for personal tab - navigate to personal page
    if (subTabId === 'personal') {
      router.push('/personal');
      if (isMobileMenuOpen) {
        onMobileMenuClose();
      }
      return;
    }

    // Use centralized navigation handler for other tabs
    handleSubTabNavigation(subTabId, window.location.pathname);

    onSubTabClick(subTabId);
    // Close mobile menu when selecting a subtab
    if (isMobileMenuOpen) {
      onMobileMenuClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-teal-500 bg-clip-text text-transparent">
                MerakiERP
              </h1>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onMobileMenuClose}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 sidebar-scrollbar">
          <div className="px-3 space-y-1">
            {mainTabs.map((mainTab) => (
              <div key={mainTab.id} className="space-y-1">
                {/* Main Tab Button */}
                <button
                  onClick={() => handleMainTabClick(mainTab.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                    transition-all duration-200 group
                    ${activeMainTab === mainTab.id
                      ? 'bg-gradient-to-r from-orange-500 to-teal-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{mainTab.icon}</span>
                    <span>{mainTab.label}</span>
                  </div>
                  
                  {/* Expand/Collapse Icon */}
                  <svg 
                    className={`
                      w-4 h-4 transition-transform duration-200
                      ${expandedMainTab === mainTab.id ? 'rotate-90' : ''}
                      ${activeMainTab === mainTab.id ? 'text-white' : 'text-gray-400'}
                    `}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Sub-tabs */}
                {expandedMainTab === mainTab.id && (
                  <div className="ml-4 space-y-1 animate-slideDown">
                    {mainTab.subtabs.map((subTab) => (
                      <button
                        key={subTab.id}
                        onClick={() => handleSubTabClick(subTab.id)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-sm rounded-md
                          transition-all duration-200
                          ${activeTab === subTab.id
                            ? 'bg-orange-100 text-orange-700 border-l-2 border-orange-500 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-base">{subTab.icon}</span>
                          <span>{subTab.label}</span>
                        </div>
                        {subTab.id === 'students' && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-teal-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-semibold">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getRoleDisplayName(user?.user_metadata?.role || 'student')}
              </p>
            </div>
          </div>
          
          {/* Personal Tab Button */}
          <button
            onClick={() => handleSubTabClick('personal')}
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg mb-3
              transition-all duration-200
              text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200
            `}
          >
            <span className="text-lg">👤</span>
            <span>Cá nhân</span>
          </button>
          
          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-center"
            fullWidth
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </Button>
        </div>
      </div>
    </>
  );
}
