import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth/AuthContext';

// Sub-tab components
import WorkScheduleView from './subtabs/WorkScheduleView';
import TeachingSessionsView from './subtabs/TeachingSessionsView';
import AttendanceView from './subtabs/AttendanceView';
import RequestsView from './subtabs/RequestsView';
import TasksView from './subtabs/TasksView';
import FinanceView from './subtabs/FinanceView';

interface PersonalTabWithSidebarProps {}

type SubTab = 'work-schedule' | 'teaching-sessions' | 'attendance' | 'requests' | 'tasks' | 'finance';

const PersonalTabWithSidebar: React.FC<PersonalTabWithSidebarProps> = () => {
  const { user } = useAuth();
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('work-schedule');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get current employee from auth context or find by email
  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      if (!user?.email) return;

      try {
        // Try to find employee by email
        const response = await fetch(`/api/employees?email=${user.email}`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setCurrentEmployee(result.data[0]);
        } else {
          // Fallback: create a mock employee for demo purposes
          setCurrentEmployee({
            id: user.id || 'demo-employee-id',
            full_name: user.user_metadata?.full_name || user.email,
            email: user.email,
            data: user.user_metadata || {}
          });
        }
      } catch (error) {
        console.error('Error fetching current employee:', error);
        // Fallback: create a mock employee for demo purposes
        setCurrentEmployee({
          id: user.id || 'demo-employee-id',
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email,
          data: user.user_metadata || {}
        });
      }
    };

    fetchCurrentEmployee();
  }, [user]);

  const subTabs = [
    {
      id: 'work-schedule' as SubTab,
      label: 'Lịch làm việc của tôi',
      icon: '📅',
    },
    {
      id: 'teaching-sessions' as SubTab,
      label: 'Buổi dạy của tôi',
      icon: '👨‍🏫',
    },
    {
      id: 'attendance' as SubTab,
      label: 'Chấm công',
      icon: '🕐',
    },
    {
      id: 'requests' as SubTab,
      label: 'Xin phép - đề xuất',
      icon: '📝',
    },
    {
      id: 'tasks' as SubTab,
      label: 'Việc cần làm',
      icon: '✅',
    },
    {
      id: 'finance' as SubTab,
      label: 'Tài chính',
      icon: '💰',
    }
  ];

  const renderSubTabContent = () => {
    if (!currentEmployee) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeSubTab) {
      case 'work-schedule':
        return <WorkScheduleView employee={currentEmployee} />;
      case 'teaching-sessions':
        return <TeachingSessionsView employee={currentEmployee} />;
      case 'attendance':
        return <AttendanceView employee={currentEmployee} />;
      case 'requests':
        return <RequestsView employee={currentEmployee} />;
      case 'tasks':
        return <TasksView employee={currentEmployee} />;
      case 'finance':
        return <FinanceView employee={currentEmployee} />;
      default:
        return <WorkScheduleView employee={currentEmployee} />;
    }
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cá nhân</h2>
              <p className="text-sm text-gray-600">
                {currentEmployee?.full_name || user?.email}
              </p>
            </div>
          </div>
          
          {/* Current Time */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-mono font-bold text-blue-600">
              {currentTime.toLocaleTimeString('vi-VN')}
            </div>
            <div className="text-xs text-blue-600">
              {currentTime.toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-lg">{tab.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {tab.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {subTabs.find(tab => tab.id === activeSubTab)?.icon}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {subTabs.find(tab => tab.id === activeSubTab)?.label}
              </h3>
              <p className="text-sm text-gray-600">
                {subTabs.find(tab => tab.id === activeSubTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderSubTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PersonalTabWithSidebar;
