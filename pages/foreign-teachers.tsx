import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/dashboard/shared/Sidebar';
import { ForeignTeachersTab } from '@/components/dashboard/tabs/foreign-teachers';
import { getMainTabs, handleMainTabClick, handleSubTabNavigation } from '@/components/navigation/NavigationConfig';
import { TabType, MainTabType, Employee } from '@/components/dashboard/shared/types';

const ForeignTeachersPage = () => {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('hcns');
  const [activeTab, setActiveTab] = useState<TabType>('foreign-teachers');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showForeignTeacherForm, setShowForeignTeacherForm] = useState(false);

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/employees');
        const result = await response.json();

        if (result.success) {
          setEmployees(result.data);
        } else {
          console.error('Failed to load employees:', result.message);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleFormSubmit = async (data: any, formType: string) => {
    try {
      let response;
      let result;

      switch (formType) {
        case 'CreateForeignTeacher':
          response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          result = await response.json();

          if (result.success) {
            // Refresh the employees list
            const refreshResponse = await fetch('/api/employees');
            const refreshResult = await refreshResponse.json();
            if (refreshResult.success) {
              setEmployees(refreshResult.data);
            }
            alert('Thêm giáo viên nước ngoài thành công!');
          } else {
            alert(`Lỗi khi thêm giáo viên nước ngoài: ${result.message}`);
          }
          break;

        case 'UpdateForeignTeacher':
          response = await fetch(`/api/employees/${data.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          result = await response.json();

          if (result.success) {
            // Refresh the employees list
            const refreshResponse = await fetch('/api/employees');
            const refreshResult = await refreshResponse.json();
            if (refreshResult.success) {
              setEmployees(refreshResult.data);
            }
            alert('Cập nhật giáo viên nước ngoài thành công!');
          } else {
            alert(`Lỗi khi cập nhật giáo viên nước ngoài: ${result.message}`);
          }
          break;

        case 'RefreshForeignTeachers':
          // Refresh the employees list
          const refreshResponse = await fetch('/api/employees');
          const refreshResult = await refreshResponse.json();
          if (refreshResult.success) {
            setEmployees(refreshResult.data);
          }
          break;

        default:
          console.log('Unknown form type:', formType);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Có lỗi xảy ra khi xử lý yêu cầu');
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    console.log('View foreign teacher:', employee);
    // You can implement a view modal here if needed
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        mainTabs={getMainTabs()}
        activeMainTab={activeMainTab}
        activeTab={activeTab}
        onMainTabClick={(mainTabId: MainTabType) => handleMainTabClick(mainTabId, setActiveMainTab)}
        onSubTabClick={(subTabId: TabType) => handleSubTabNavigation(subTabId, router.pathname)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Giáo viên nước ngoài (GVNN)</h1>
              <p className="text-gray-600">Quản lý danh sách giáo viên nước ngoài</p>
            </div>

            <ForeignTeachersTab
              showForeignTeacherForm={showForeignTeacherForm}
              setShowForeignTeacherForm={setShowForeignTeacherForm}
              employees={employees}
              isLoadingEmployees={loading}
              handleFormSubmit={handleFormSubmit}
              onViewEmployee={handleViewEmployee}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ForeignTeachersPage;
