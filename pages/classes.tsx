import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab, Class, Facility, ProgramType, UnitOption } from '@/shared/types';
import { getNextSuggestedUnit } from '@/shared/utils';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import ClassesTab from '@/dashboard/tabs/classes/ClassesTab';
import UnitTransitionModal from '@/dashboard/tabs/classes/UnitTransitionModal';
import ClassEnrollmentModal from '@/dashboard/tabs/enrollments/ClassEnrollmentModal';

export default function ClassesPage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('classes');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('vanhanh');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Classes management state
  const [showClassForm, setShowClassForm] = useState(false);
  const [selectedClassForLesson, setSelectedClassForLesson] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [grapeSeedUnits, setGrapeSeedUnits] = useState<UnitOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  // Filter states for classes
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active'); // Default to active

  // Unit transition states
  const [showUnitTransitionModal, setShowUnitTransitionModal] = useState(false);
  const [selectedClassForTransition, setSelectedClassForTransition] = useState<Class | null>(null);
  const [newUnit, setNewUnit] = useState('');
  const [transitionDate, setTransitionDate] = useState('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  // Class enrollment states
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<Class | null>(null);

  // Define the hierarchical navigation structure (same as dashboard)
  const mainTabs: MainTab[] = [
    {
      id: 'vanhanh',
      label: 'Vận hành',
      icon: '⚙️',
      subtabs: [
        { id: 'classes', label: 'Lớp học', icon: '🏫' },
        { id: 'sessions', label: 'Buổi học', icon: '📚' },
        { id: 'schedule', label: 'Lịch học', icon: '📅' }
      ]
    },
    {
      id: 'khachhang',
      label: 'Khách hàng',
      icon: '👥',
      subtabs: [
        { id: 'admissions', label: 'Tuyển sinh', icon: '📋' },
        { id: 'students', label: 'Học sinh', icon: '🎓' }
      ]
    },
    {
      id: 'taichinh',
      label: 'Tài chính',
      icon: '💰',
      subtabs: [
        { id: 'finances', label: 'Tài chính', icon: '💳' },
        { id: 'payroll', label: 'Lương', icon: '💰' }
      ]
    },
    {
      id: 'hcns',
      label: 'HCNS',
      icon: '👤',
      subtabs: [
        { id: 'employees', label: 'Nhân viên', icon: '👨‍💼' },
        { id: 'requests', label: 'Yêu cầu', icon: '📋' },
        { id: 'tasks', label: 'Bài tập', icon: '📝' },
        { id: 'business-tasks', label: 'Công việc', icon: '💼' },
        { id: 'facilities', label: 'Cơ sở', icon: '🏢' }
      ]
    }
  ];

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('classes-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('classes-active-main-tab') as MainTabType;

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
      localStorage.setItem('classes-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('classes-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

  useEffect(() => {
    fetchClasses();
    fetchFacilitiesForClasses();
    fetchProgramTypes();
    fetchGrapeSeedUnits();
  }, [selectedFacility, selectedProgram, selectedStatus]);

  // Fetch functions
  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      let url = '/api/classes';
      const params = new URLSearchParams();

      // Add status filter (default to active if not specified)
      if (selectedStatus) {
        params.append('status', selectedStatus);
      } else {
        params.append('status', 'active');
      }

      if (selectedFacility) {
        params.append('facility_id', selectedFacility);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        let filteredClasses = result.data;

        if (selectedProgram) {
          filteredClasses = result.data.filter((cls: Class) =>
            cls.data?.program_type === selectedProgram
          );
        }

        setClasses(filteredClasses);
      } else {
        console.error('Failed to fetch classes:', result.message);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchFacilitiesForClasses = async () => {
    setIsLoadingFacilities(true);
    try {
      const response = await fetch('/api/facilities');
      const result = await response.json();

      if (result.success) {
        setFacilities(result.data);
      } else {
        console.error('Failed to fetch facilities:', result.message);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  const fetchProgramTypes = async () => {
    setIsLoadingPrograms(true);
    try {
      const response = await fetch('/api/metadata/enums?type=program_type');
      const result = await response.json();

      if (result.success) {
        setProgramTypes(result.data);
      } else {
        console.error('Failed to fetch program types:', result.message);
        setProgramTypes([
          { value: 'GrapeSEED', label: 'GrapeSEED' },
          { value: 'Pre-WSC', label: 'Pre-WSC' },
          { value: 'WSC', label: 'WSC' },
          { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
          { value: 'Gavel club', label: 'Gavel club' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching program types:', error);
      setProgramTypes([
        { value: 'GrapeSEED', label: 'GrapeSEED' },
        { value: 'Pre-WSC', label: 'Pre-WSC' },
        { value: 'WSC', label: 'WSC' },
        { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
        { value: 'Gavel club', label: 'Gavel club' }
      ]);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const fetchGrapeSeedUnits = async () => {
    try {
      const response = await fetch('/api/metadata/enums?type=unit_grapeseed');
      const result = await response.json();

      if (result.success) {
        setGrapeSeedUnits(result.data);
      } else {
        console.error('Failed to fetch GrapeSEED units:', result.message);
        const fallbackUnits = [];
        for (let i = 1; i <= 30; i++) {
          fallbackUnits.push({ value: `U${i}`, label: `Unit ${i}` });
        }
        setGrapeSeedUnits(fallbackUnits);
      }
    } catch (error) {
      console.error('Error fetching GrapeSEED units:', error);
      const fallbackUnits = [];
      for (let i = 1; i <= 30; i++) {
        fallbackUnits.push({ value: `U${i}`, label: `Unit ${i}` });
      }
      setGrapeSeedUnits(fallbackUnits);
    }
  };

  const handleUnitTransition = (classItem: Class) => {
    setSelectedClassForTransition(classItem);
    const suggestedUnit = getNextSuggestedUnit(classItem.data?.unit || '');
    setNewUnit(suggestedUnit);
    setTransitionDate(new Date().toISOString().split('T')[0]);
    setShowUnitTransitionModal(true);
  };

  const handleClassEnrollment = (classItem: Class) => {
    setSelectedClassForEnrollment(classItem);
    setShowEnrollmentModal(true);
  };

  const submitUnitTransition = async () => {
    if (!selectedClassForTransition || !newUnit || !transitionDate) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmittingTransition(true);
    try {
      const currentTransitions = selectedClassForTransition.data?.unit_transitions || [];
      const newTransition = {
        from_unit: selectedClassForTransition.data?.unit || '',
        to_unit: newUnit,
        transition_date: transitionDate,
        created_at: new Date().toISOString()
      };

      const updatedData = {
        ...selectedClassForTransition.data,
        unit: newUnit,
        unit_transitions: [...currentTransitions, newTransition]
      };

      // Update both the JSONB data and the current_unit column
      const response = await fetch(`/api/classes/${selectedClassForTransition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedData,
          current_unit: newUnit // Add this to update the dedicated column
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Chuyển unit thành công!');
        setShowUnitTransitionModal(false);
        setSelectedClassForTransition(null);
        setNewUnit('');
        setTransitionDate('');
        fetchClasses();
      } else {
        throw new Error(result.message || 'Failed to update unit');
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      alert(`Lỗi khi chuyển unit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmittingTransition(false);
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
        case 'Class':
          endpoint = isEdit ? `/api/classes/${data.id}` : '/api/classes';
          method = isEdit ? 'PUT' : 'POST';
          break;
        case 'Enrollment':
          endpoint = isEdit ? `/api/enrollments/${data.id}` : '/api/enrollments';
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
        if (formType === 'Class') {
          setShowClassForm(false);
          fetchClasses();
        } else if (formType === 'Enrollment') {
          setShowEnrollmentModal(false);
        }

      } else {
        throw new Error(result.message || 'Failed to save data');
      }
    } catch (error) {
      console.error(`Error saving ${formType}:`, error);
      alert(`Lỗi khi lưu ${formType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    setActiveTab(subTabId);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'classes':
        return (
          <ClassesTab
            showClassForm={showClassForm}
            setShowClassForm={setShowClassForm}
            selectedClassForLesson={selectedClassForLesson}
            setSelectedClassForLesson={setSelectedClassForLesson}
            classes={classes}
            facilities={facilities}
            programTypes={programTypes}
            grapeSeedUnits={grapeSeedUnits}
            isLoadingClasses={isLoadingClasses}
            isLoadingFacilities={isLoadingFacilities}
            isLoadingPrograms={isLoadingPrograms}
            selectedFacility={selectedFacility}
            setSelectedFacility={setSelectedFacility}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            handleFormSubmit={handleFormSubmit}
            handleUnitTransition={handleUnitTransition}
            handleClassEnrollment={handleClassEnrollment}
          />
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
        <title>Quản lý Lớp học - MerakiERP</title>
        <meta name="description" content="Quản lý lớp học và chương trình đào tạo" />
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
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-teal-500 bg-clip-text text-transparent">
                MerakiERP - Lớp học
              </h1>

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
      <UnitTransitionModal
        showModal={showUnitTransitionModal}
        setShowModal={setShowUnitTransitionModal}
        selectedClass={selectedClassForTransition}
        newUnit={newUnit}
        setNewUnit={setNewUnit}
        transitionDate={transitionDate}
        setTransitionDate={setTransitionDate}
        isSubmitting={isSubmittingTransition}
        grapeSeedUnits={grapeSeedUnits}
        onSubmit={submitUnitTransition}
      />

      {/* Class Enrollment Modal */}
      <ClassEnrollmentModal
        showModal={showEnrollmentModal}
        setShowModal={setShowEnrollmentModal}
        selectedClass={selectedClassForEnrollment}
        onEnrollmentSuccess={() => {
          fetchClasses();
        }}
      />
    </ProtectedRoute>
  );
}
