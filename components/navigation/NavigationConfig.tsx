import { MainTab, TabType, MainTabType } from '@/shared/types';

export const getMainTabs = (): MainTab[] => [
  {
    id: 'vanhanh',
    label: 'Vận hành',
    icon: '⚙️',
    subtabs: [
      { id: 'classes', label: 'Lớp học', icon: '🏫', link: '/classes' },
      { id: 'sessions', label: 'Buổi học', icon: '📚', link: '/sessions' },
      { id: 'schedule', label: 'Lịch học', icon: '📅', link: '/schedule' }
    ]
  },
  {
    id: 'khachhang',
    label: 'Khách hàng',
    icon: '👥',
    subtabs: [
      { id: 'admissions', label: 'Tuyển sinh', icon: '📋', link: '/admissions' },
      { id: 'students', label: 'Học sinh', icon: '🎓', link: '/student' }
    ]
  },
  {
    id: 'taichinh',
    label: 'Tài chính',
    icon: '💰',
    subtabs: [
      { id: 'finances', label: 'Tài chính', icon: '💳', link: '/finances' },
      { id: 'payroll', label: 'Lương', icon: '💰', link: '/payroll' }
    ]
  },
  {
    id: 'hcns',
    label: 'HCNS',
    icon: '👤',
    subtabs: [
      { id: 'employee', label: 'Nhân viên', icon: '👨‍💼', link: '/employee' },
      { id: 'foreign-teachers', label: 'GVNN', icon: '👨‍🏫', link: '/foreign-teachers' },
      { id: 'requests', label: 'Yêu cầu', icon: '📋', link: '/requests' },
      { id: 'tasks', label: 'Bài tập', icon: '📝', link: '/tasks' },
      { id: 'business-tasks', label: 'Công việc', icon: '💼', link: '/businesstask' },
      { id: 'facilities', label: 'Cơ sở', icon: '🏢', link: '/facilities' }
    ]
  }
];

// Navigation handler function for subtabs
export const handleSubTabNavigation = (subTabId: TabType, currentPath: string) => {
  const mainTabs = getMainTabs();

  // Find the subtab with the matching ID
  for (const mainTab of mainTabs) {
    const subTab = mainTab.subtabs.find(tab => tab.id === subTabId);
    if (subTab && subTab.link) {
      // If the link is different from current path, navigate to it with pre-selected tab
      if (subTab.link !== currentPath) {
        // Navigate to the target page with the tab pre-selected
        window.location.href = `${subTab.link}?tab=${subTabId}`;
        return;
      }
    }
  }

  // Fallback: redirect to dashboard if no specific link found
  window.location.href = `/dashboard?tab=${subTabId}`;
};

// Centralized main tab click handler - only updates activeMainTab, doesn't change content
export const handleMainTabClick = (
  mainTabId: MainTabType, 
  setActiveMainTab: (id: MainTabType) => void
) => {
  setActiveMainTab(mainTabId);
  // Don't change the active tab content - just expand/collapse the sidebar
  // The content view should remain the same when clicking main tabs
};
