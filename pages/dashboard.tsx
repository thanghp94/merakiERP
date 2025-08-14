import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { ROLES } from '../lib/auth/rbac';
import { TabType, MainTabType, MainTab, SubTab, ApiTestResult, Class, Facility, ProgramType, UnitOption, Employee, Student, Enrollment, Attendance, Finance, Task, Admission } from '../components/dashboard/shared/types';
import { tabs, getNextSuggestedUnit } from '../components/dashboard/shared/utils';
import { Button, Card, Badge } from '../components/ui';
import PersonalTab from '../components/dashboard/PersonalTab';
import FacilitiesTab from '../components/dashboard/FacilitiesTab';
import ClassesTab from '../components/dashboard/ClassesTab';
import EmployeesTab from '../components/dashboard/employees/EmployeesTab';
import StudentsTab from '../components/dashboard/students/StudentsTab';
import SessionsTab from '../components/dashboard/sessions/SessionsTab';
import AttendanceTab from '../components/dashboard/AttendanceTab';
import InvoicesTab from '../components/dashboard/invoices/InvoicesTab';
import PayrollTab from '../components/dashboard/PayrollTab';
import TasksTab from '../components/dashboard/TasksTab';
import BusinessTasksTab from '../components/dashboard/BusinessTasksTab';
import ScheduleTab from '../components/dashboard/ScheduleTab';
import ApiTestTab from '../components/dashboard/ApiTestTab';
import AdmissionsTab from '../components/dashboard/AdmissionsTab';
import UnitTransitionModal from '../components/dashboard/UnitTransitionModal';
import ClassEnrollmentModal from '../components/dashboard/ClassEnrollmentModal';
import AdmissionForm from '../components/AdmissionForm';
import RequestsTab from '../components/dashboard/RequestsTab';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('facilities');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('hcns');
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define the hierarchical navigation structure
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

  // Facilities management state
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>([]);
  const [isLoadingFacilitiesList, setIsLoadingFacilitiesList] = useState(false);

  // Employees management state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Students management state
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);


  // Attendance management state
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoadingAttendances, setIsLoadingAttendances] = useState(false);

  // Finances management state
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [isLoadingFinances, setIsLoadingFinances] = useState(false);

  // Tasks management state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Admissions management state
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    if (activeTab === 'classes') {
      fetchClasses();
      fetchFacilitiesForClasses();
      fetchProgramTypes();
      fetchGrapeSeedUnits();
    } else if (activeTab === 'facilities') {
      fetchFacilitiesList();
    } else if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'sessions') {
      // Sessions tab handles its own data fetching
    } else if (activeTab === 'attendance') {
      fetchAttendances();
    } else if (activeTab === 'finances') {
      fetchFinances();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab, selectedFacility, selectedProgram, selectedStatus]);

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

  const fetchFacilitiesList = async () => {
    setIsLoadingFacilitiesList(true);
    try {
      const response = await fetch('/api/facilities');
      const result = await response.json();
      
      if (result.success) {
        setFacilitiesList(result.data);
      } else {
        console.error('Failed to fetch facilities list:', result.message);
        setFacilitiesList([]);
      }
    } catch (error) {
      console.error('Error fetching facilities list:', error);
      setFacilitiesList([]);
    } finally {
      setIsLoadingFacilitiesList(false);
    }
  };

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

  const handleSignOut = async () => {
    await signOut();
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

  const getCurrentSubtabs = () => {
    const currentMainTab = mainTabs.find(tab => tab.id === activeMainTab);
    return currentMainTab ? currentMainTab.subtabs : [];
  };

  const getCurrentTabInfo = () => {
    const currentMainTab = mainTabs.find(tab => tab.id === activeMainTab);
    const currentSubTab = getCurrentSubtabs().find(tab => tab.id === activeTab);
    return {
      mainTab: currentMainTab,
      subTab: currentSubTab
    };
  };

  const handleFormSubmit = async (data: any, formType: string) => {
    console.log(`${formType} form submitted:`, data);
    
    try {
      let endpoint = '';
      switch (formType) {
        case 'Facility':
          endpoint = '/api/facilities';
          break;
        case 'Class':
          endpoint = '/api/classes';
          break;
        case 'Employee':
          endpoint = '/api/employees';
          break;
        case 'Student':
          endpoint = '/api/students';
          break;
        case 'Enrollment':
          endpoint = '/api/enrollments';
          break;
        case 'Attendance':
          endpoint = '/api/attendance';
          break;
        case 'Finance':
          endpoint = '/api/finances';
          break;
        case 'Task':
          endpoint = '/api/tasks';
          break;
        case 'Admission':
          endpoint = '/api/admissions';
          break;
        default:
          throw new Error(`Unknown form type: ${formType}`);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${formType} đã được lưu thành công vào Supabase!`);
        console.log(`${formType} saved successfully:`, result);
        
        // Refresh lists when items are added
        if (formType === 'Class') {
          setShowClassForm(false);
          fetchClasses();
        } else if (formType === 'Facility') {
          setShowFacilityForm(false);
          fetchFacilitiesList();
        } else if (formType === 'Employee') {
          setShowEmployeeForm(false);
          fetchEmployees();
        } else if (formType === 'Student') {
          setShowStudentForm(false);
          fetchStudents();
        } else if (formType === 'Enrollment') {
          setShowEnrollmentModal(false);
          // fetchEnrollments(); // Remove this as enrollments are handled differently
        } else if (formType === 'Attendance') {
          setShowAttendanceForm(false);
          fetchAttendances();
        } else if (formType === 'Finance') {
          setShowFinanceForm(false);
          fetchFinances();
        } else if (formType === 'Task') {
          setShowTaskForm(false);
          fetchTasks();
        } else if (formType === 'Admission') {
          setShowAdmissionForm(false);
          // Refresh admissions will be handled by the AdmissionsTab component
        }
        
        const apiResult: ApiTestResult = {
          endpoint,
          method: 'POST',
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
        return <PersonalTab />;
      case 'facilities':
        return (
          <FacilitiesTab
            showFacilityForm={showFacilityForm}
            setShowFacilityForm={setShowFacilityForm}
            facilitiesList={facilitiesList}
            isLoadingFacilitiesList={isLoadingFacilitiesList}
            handleFormSubmit={handleFormSubmit}
          />
        );
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
      case 'employees':
        return (
          <EmployeesTab
            showEmployeeForm={showEmployeeForm}
            setShowEmployeeForm={setShowEmployeeForm}
            employees={employees}
            isLoadingEmployees={isLoadingEmployees}
            handleFormSubmit={handleFormSubmit}
          />
        );
      case 'students':
        return (
          <StudentsTab
            showStudentForm={showStudentForm}
            setShowStudentForm={setShowStudentForm}
          />
        );
      case 'sessions':
        return <SessionsTab />;
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
        return <InvoicesTab />;
      case 'payroll':
        return <PayrollTab />;
      case 'tasks':
        return (
          <TasksTab
            showTaskForm={showTaskForm}
            setShowTaskForm={setShowTaskForm}
            tasks={tasks}
            isLoadingTasks={isLoadingTasks}
            handleFormSubmit={handleFormSubmit}
          />
        );
      case 'business-tasks':
        return <BusinessTasksTab employees={employees} />;
      case 'schedule':
        return <ScheduleTab />;
      case 'requests':
        return <RequestsTab employees={employees} />;
      case 'admissions':
        return (
          <AdmissionsTab
            onAddAdmission={() => setShowAdmissionForm(true)}
          />
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

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        {/* Modern Header with Navigation */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">M</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-teal-500 bg-clip-text text-transparent tracking-tight">
                      MerakiERP
                    </h1>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-teal-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1 h-1 bg-orange-300 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation - Main Tabs */}
              <nav className="hidden lg:flex items-center space-x-1">
                {/* Inactive main tabs first */}
                {mainTabs
                  .filter(mainTab => mainTab.id !== activeMainTab)
                  .map((mainTab) => (
                    <Button
                      key={mainTab.id}
                      variant="text"
                      size="sm"
                      onClick={() => handleMainTabClick(mainTab.id)}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2"
                    >
                      <span className="text-base">{mainTab.icon}</span>
                      <span>{mainTab.label}</span>
                    </Button>
                  ))}
                
                {/* Active main tab - positioned at the end, closest to subtabs */}
                {mainTabs
                  .filter(mainTab => mainTab.id === activeMainTab)
                  .map((mainTab) => (
                    <Button
                      key={mainTab.id}
                      variant="primary"
                      size="sm"
                      onClick={() => handleMainTabClick(mainTab.id)}
                      className="shadow-lg px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ml-2"
                    >
                      <span className="text-base">{mainTab.icon}</span>
                      <span>{mainTab.label}</span>
                    </Button>
                  ))}
                
                {/* Subtabs - appear horizontally to the right of active main tab */}
                <div className="flex items-center space-x-1 ml-2 pl-4 border-l border-gray-300">
                  {getCurrentSubtabs().map((subTab) => (
                    <Button
                      key={subTab.id}
                      variant={activeTab === subTab.id ? "secondary" : "text"}
                      size="sm"
                      onClick={() => handleSubTabClick(subTab.id)}
                      className={`${
                        activeTab === subTab.id
                          ? 'bg-orange-100 text-orange-700 shadow-sm border-orange-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
                      } px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 border`}
                    >
                      <span className="text-sm">{subTab.icon}</span>
                      <span className="hidden xl:inline">{subTab.label}</span>
                    </Button>
                  ))}
                </div>
              </nav>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

              {/* User Profile and Actions */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-r from-orange-500 to-teal-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-semibold">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplayName(user?.user_metadata?.role || 'student')}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleSignOut}
                  className="shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
              <div className="px-4 py-3 space-y-2">
                {/* Main Tabs */}
                {mainTabs.map((mainTab) => (
                  <div key={mainTab.id} className="space-y-1">
                    <Button
                      variant={activeMainTab === mainTab.id ? "primary" : "text"}
                      onClick={() => handleMainTabClick(mainTab.id)}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                      fullWidth
                    >
                      <span className="text-lg">{mainTab.icon}</span>
                      <span>{mainTab.label}</span>
                    </Button>
                    
                    {/* Subtabs - show only for active main tab */}
                    {activeMainTab === mainTab.id && (
                      <div className="ml-4 space-y-1">
                        {mainTab.subtabs.map((subTab) => (
                          <Button
                            key={subTab.id}
                            variant={activeTab === subTab.id ? "secondary" : "text"}
                            onClick={() => {
                              handleSubTabClick(subTab.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`${
                              activeTab === subTab.id
                                ? 'bg-orange-100 text-orange-700 border-orange-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
                            } w-full flex items-center space-x-3 px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 border`}
                            fullWidth
                          >
                            <span className="text-base">{subTab.icon}</span>
                            <span>{subTab.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Mobile User Info and Logout */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.user_metadata?.full_name || user?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName(user?.user_metadata?.role || 'student')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleSignOut}
                    className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200"
                    fullWidth
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng xuất</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
          <Card className="overflow-hidden shadow-xl" shadow="lg" padding="sm">
            {renderTabContent()}
          </Card>
        </main>
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

      {/* Admission Form Modal */}
      {showAdmissionForm && (
        <AdmissionForm
          onSubmit={(data) => handleFormSubmit(data, 'Admission')}
          onCancel={() => setShowAdmissionForm(false)}
        />
      )}
    </ProtectedRoute>
  );
}
