import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ROLES } from '@/auth/roles';
import { TabType, MainTabType, MainTab, ApiTestResult, Employee } from '@/shared/types';
import { Button, Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import EmployeesTab from '@/dashboard/tabs/employees/EmployeesTab';
import EmployeeDetailModal from '@/dashboard/tabs/employees/EmployeeDetailModal';
import { getMainTabs, handleSubTabNavigation, handleMainTabClick } from '@/components/navigation/NavigationConfig';

export default function EmployeePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('hcns');
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Employees management state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Detail modal states
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);

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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();

      if (result.success) {
        setEmployees(result.data);
      } else {
        console.error('Failed to fetch employees:', result.message);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

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

  // Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // For tabs that exist in employee page (employees)
    const employeeTabs = ['employees'];

    if (employeeTabs.includes(subTabId)) {
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
        case 'Employee':
          endpoint = isEdit ? `/api/employees/${data.id}` : '/api/employees';
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

        // Refresh employees list when employee is added/updated
        if (formType === 'Employee') {
          setShowEmployeeForm(false);
          fetchEmployees();
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

  // Detail view handlers
  const handleEmployeeView = (employee: Employee) => {
    setSelectedEmployeeForDetail(employee);
    setShowEmployeeDetail(true);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Employee Management - MerakiERP</title>
        <meta name="description" content="Employee management system" />
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
              <EmployeesTab
                showEmployeeForm={showEmployeeForm}
                setShowEmployeeForm={setShowEmployeeForm}
                employees={employees}
                isLoadingEmployees={isLoadingEmployees}
                handleFormSubmit={handleFormSubmit}
                onViewEmployee={handleEmployeeView}
              />
            </Card>
          </main>
        </div>
      </div>

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        isOpen={showEmployeeDetail}
        onClose={() => {
          setShowEmployeeDetail(false);
          setSelectedEmployeeForDetail(null);
        }}
        employee={selectedEmployeeForDetail}
      />
    </ProtectedRoute>
  );
}
