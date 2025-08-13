import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { ROLES } from '../lib/auth/rbac';
import { TabType, ApiTestResult, Class, Facility, ProgramType, UnitOption, Employee, Student, Enrollment, Attendance, Finance, Task, Admission } from '../components/dashboard/types';
import { tabs, getNextSuggestedUnit } from '../components/dashboard/utils';
import PersonalTab from '../components/dashboard/PersonalTab';
import FacilitiesTab from '../components/dashboard/FacilitiesTab';
import ClassesTab from '../components/dashboard/ClassesTab';
import EmployeesTab from '../components/dashboard/EmployeesTab';
import StudentsTab from '../components/dashboard/StudentsTab';
import SessionsTab from '../components/dashboard/SessionsTab';
import AttendanceTab from '../components/dashboard/AttendanceTab';
import FinancesTabNew from '../components/dashboard/FinancesTabNew';
import TasksTab from '../components/dashboard/TasksTab';
import ScheduleTab from '../components/dashboard/ScheduleTab';
import ApiTestTab from '../components/dashboard/ApiTestTab';
import AdmissionsTab from '../components/dashboard/AdmissionsTab';
import UnitTransitionModal from '../components/dashboard/UnitTransitionModal';
import ClassEnrollmentModal from '../components/dashboard/ClassEnrollmentModal';
import AdmissionForm from '../components/AdmissionForm';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('facilities');
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, [activeTab, selectedFacility, selectedProgram]);

  // Fetch functions
  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      let url = '/api/classes?status=active';
      
      if (selectedFacility) {
        url += `&facility_id=${selectedFacility}`;
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
        return <FinancesTabNew />;
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
      case 'schedule':
        return <ScheduleTab />;
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

      <div className="min-h-screen bg-gray-100">
        {/* Authentication Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  🎓 MerakiERP Dashboard
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplayName(user?.user_metadata?.role || 'student')}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide" aria-label="Tabs" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 flex-shrink-0`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
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

      {/* Admission Form Modal */}
      {showAdmissionForm && (
        <AdmissionForm
          onSubmit={(data) => handleFormSubmit(data, 'Admission')}
          onCancel={() => setShowAdmissionForm(false)}
        />
      )}
      </div>
    </ProtectedRoute>
  );
}
