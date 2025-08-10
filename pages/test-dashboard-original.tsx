import { useState, useEffect } from 'react';
import FacilityForm from '../components/FacilityForm';
import ClassForm from '../components/ClassForm';
import EmployeeForm from '../components/EmployeeForm';
import EnrollmentForm from '../components/EnrollmentForm';
import AttendanceForm from '../components/AttendanceForm';
import FinanceForm from '../components/FinanceForm';
import TaskForm from '../components/TaskForm';
import StudentEnrollmentForm from '../components/StudentEnrollmentForm';
import LessonForm from '../components/LessonForm';

type TabType = 'facilities' | 'classes' | 'employees' | 'students' | 'enrollments' | 'attendance' | 'finances' | 'tasks' | 'schedule' | 'api-test';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  data: any;
  error?: string;
}

interface Class {
  id: string;
  class_name: string;
  facility_id: string;
  status: string;
  start_date: string;
  created_at: string;
  data: {
    program_type?: string;
    unit?: string;
    duration?: string;
    schedule?: string;
    max_students?: number;
    description?: string;
    unit_transitions?: Array<{
      from_unit: string;
      to_unit: string;
      transition_date: string;
      created_at: string;
    }>;
  };
  facilities?: {
    id: string;
    name: string;
    status: string;
  };
}

interface Facility {
  id: string;
  name: string;
  status: string;
}

interface ProgramType {
  value: string;
  label: string;
}

interface UnitOption {
  value: string;
  label: string;
}

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  status: string;
  created_at: string;
  data: {
    email?: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    hire_date?: string;
    salary?: number;
    qualifications?: string;
    notes?: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
  data: {
    date_of_birth?: string;
    address?: string;
    expected_campus?: string;
    program?: string;
    student_description?: string;
    current_english_level?: string;
    parent?: {
      name: string;
      phone: string;
      email?: string;
    };
    notes?: string;
  };
}

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  status: string;
  enrollment_date: string;
  created_at: string;
  data: {
    payment_status?: string;
    notes?: string;
  };
  students?: {
    id: string;
    full_name: string;
  };
  classes?: {
    id: string;
    class_name: string;
  };
}

interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  session_date: string;
  status: string;
  created_at: string;
  data: {
    notes?: string;
    late_minutes?: number;
  };
  students?: {
    id: string;
    full_name: string;
  };
  classes?: {
    id: string;
    class_name: string;
  };
}

interface Finance {
  id: string;
  student_id: string;
  type: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  data: {
    description?: string;
    payment_method?: string;
    notes?: string;
  };
  students?: {
    id: string;
    full_name: string;
  };
}

interface Task {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  created_at: string;
  data: {
    instructions?: string;
    attachments?: string[];
    points?: number;
  };
  classes?: {
    id: string;
    class_name: string;
  };
}

export default function TestDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('facilities');
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Classes management state
  const [showClassForm, setShowClassForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
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

  // Enrollments management state
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

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
    } else if (activeTab === 'enrollments') {
      fetchEnrollments();
    } else if (activeTab === 'attendance') {
      fetchAttendances();
    } else if (activeTab === 'finances') {
      fetchFinances();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab, selectedFacility, selectedProgram]);

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
        
        // Filter by program type if selected (since API doesn't support this filter)
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
        // Fallback values
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
      // Fallback values
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

  const fetchEnrollments = async () => {
    setIsLoadingEnrollments(true);
    try {
      const response = await fetch('/api/enrollments');
      const result = await response.json();
      
      if (result.success) {
        setEnrollments(result.data);
      } else {
        console.error('Failed to fetch enrollments:', result.message);
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
    } finally {
      setIsLoadingEnrollments(false);
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
      const response = await fetch('/api/finances');
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
        // Fallback values
        const fallbackUnits = [];
        for (let i = 1; i <= 30; i++) {
          fallbackUnits.push({ value: `U${i}`, label: `Unit ${i}` });
        }
        setGrapeSeedUnits(fallbackUnits);
      }
    } catch (error) {
      console.error('Error fetching GrapeSEED units:', error);
      // Fallback values
      const fallbackUnits = [];
      for (let i = 1; i <= 30; i++) {
        fallbackUnits.push({ value: `U${i}`, label: `Unit ${i}` });
      }
      setGrapeSeedUnits(fallbackUnits);
    }
  };

  const getNextSuggestedUnit = (currentUnit: string): string => {
    if (!currentUnit) return 'U1';
    
    const match = currentUnit.match(/U(\d+)/);
    if (match) {
      const currentNumber = parseInt(match[1]);
      const nextNumber = currentNumber + 1;
      return nextNumber <= 30 ? `U${nextNumber}` : currentUnit;
    }
    
    return 'U1';
  };

  const handleUnitTransition = (classItem: Class) => {
    setSelectedClassForTransition(classItem);
    const suggestedUnit = getNextSuggestedUnit(classItem.data?.unit || '');
    setNewUnit(suggestedUnit);
    setTransitionDate(new Date().toISOString().split('T')[0]);
    setShowUnitTransitionModal(true);
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

      const response = await fetch(`/api/classes/${selectedClassForTransition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: updatedData }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Chuyển unit thành công!');
        setShowUnitTransitionModal(false);
        setSelectedClassForTransition(null);
        setNewUnit('');
        setTransitionDate('');
        fetchClasses(); // Refresh the classes list
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Đang hoạt động', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Không hoạt động', className: 'bg-gray-100 text-gray-800' },
      completed: { label: 'Đã hoàn thành', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const tabs = [
    { id: 'facilities', label: 'Cơ sở', icon: '🏢' },
    { id: 'classes', label: 'Lớp học', icon: '📚' },
    { id: 'employees', label: 'Nhân viên', icon: '👥' },
    { id: 'students', label: 'Học sinh', icon: '🎓' },
    { id: 'enrollments', label: 'Đăng ký', icon: '📝' },
    { id: 'attendance', label: 'Điểm danh', icon: '✅' },
    { id: 'finances', label: 'Tài chính', icon: '💰' },
    { id: 'tasks', label: 'Bài tập', icon: '📋' },
    { id: 'schedule', label: 'Lịch học', icon: '📅' },
    { id: 'api-test', label: 'Test API', icon: '🔧' }
  ];

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

      setApiResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
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
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
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
          setShowEnrollmentForm(false);
          fetchEnrollments();
        } else if (formType === 'Attendance') {
          setShowAttendanceForm(false);
          fetchAttendances();
        } else if (formType === 'Finance') {
          setShowFinanceForm(false);
          fetchFinances();
        } else if (formType === 'Task') {
          setShowTaskForm(false);
          fetchTasks();
        }
        
        // Add to API results for tracking
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
      
      // Add error to API results
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
      case 'facilities':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Cơ sở</h2>
              <button
                onClick={() => setShowFacilityForm(!showFacilityForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showFacilityForm ? '📋' : '➕'}</span>
                <span>{showFacilityForm ? 'Xem danh sách' : 'Thêm cơ sở'}</span>
              </button>
            </div>

            {showFacilityForm ? (
              <FacilityForm onSubmit={(data) => handleFormSubmit(data, 'Facility')} />
            ) : (
              <div className="space-y-6">
                {/* Facilities List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách cơ sở ({facilitiesList.length})
                    </h3>
                  </div>

                  {isLoadingFacilitiesList ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách cơ sở...</p>
                    </div>
                  ) : facilitiesList.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có cơ sở nào</h4>
                      <p className="text-gray-600">Chưa có cơ sở nào được tạo.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tên cơ sở
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Loại
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Địa chỉ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sức chứa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ngày thành lập
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {facilitiesList.map((facility: any) => (
                            <tr key={facility.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                                {facility.data?.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {facility.data.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {facility.type || facility.data?.type || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {facility.data?.address || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {facility.data?.capacity || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {facility.data?.established ? formatDate(facility.data.established) : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(facility.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'classes':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Lớp học</h2>
              <button
                onClick={() => setShowClassForm(!showClassForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showClassForm ? '📋' : '➕'}</span>
                <span>{showClassForm ? 'Xem danh sách' : 'Thêm lớp học'}</span>
              </button>
            </div>

            {selectedClassForLesson ? (
              <LessonForm 
                classId={selectedClassForLesson}
                onSubmit={(data: any) => {
                  console.log('Lesson form submitted for class:', selectedClassForLesson, data);
                  alert('Buổi học đã được tạo thành công!');
                  setSelectedClassForLesson(null);
                }}
                onCancel={() => setSelectedClassForLesson(null)}
              />
            ) : showClassForm ? (
              <ClassForm onSubmit={(data) => handleFormSubmit(data, 'Class')} />
            ) : (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="facility-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Cơ sở
                      </label>
                      <select
                        id="facility-filter"
                        value={selectedFacility}
                        onChange={(e) => setSelectedFacility(e.target.value)}
                        disabled={isLoadingFacilities}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="">Tất cả cơ sở</option>
                        {facilities.map((facility) => (
                          <option key={facility.id} value={facility.id}>
                            {facility.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="program-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Chương trình học
                      </label>
                      <select
                        id="program-filter"
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        disabled={isLoadingPrograms}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="">Tất cả chương trình</option>
                        {programTypes.map((program) => (
                          <option key={program.value} value={program.value}>
                            {program.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSelectedFacility('');
                          setSelectedProgram('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  </div>
                </div>

                {/* Classes List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Lớp học đang hoạt động ({classes.length})
                    </h3>
                  </div>

                  {isLoadingClasses ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách lớp học...</p>
                    </div>
                  ) : classes.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có lớp học nào</h4>
                      <p className="text-gray-600">Không tìm thấy lớp học nào phù hợp với bộ lọc đã chọn.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tên lớp học
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cơ sở
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Chương trình
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ngày bắt đầu
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sĩ số tối đa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {classes.map((cls) => (
                            <tr key={cls.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{cls.class_name}</div>
                                {cls.data?.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {cls.data.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {cls.facilities?.name || 'Chưa chọn cơ sở'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {cls.data?.program_type || 'Chưa chọn chương trình'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {cls.data?.unit || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(cls.start_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {cls.data?.max_students || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(cls.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setSelectedClassForLesson(cls.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                                  >
                                    <span>📅</span>
                                    <span>Thêm buổi học</span>
                                  </button>
                                  {cls.data?.program_type === 'GrapeSEED' && (
                                    <button
                                      onClick={() => handleUnitTransition(cls)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                                    >
                                      <span>🔄</span>
                                      <span>Chuyển Unit</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Unit Transition Modal */}
            {showUnitTransitionModal && selectedClassForTransition && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Chuyển Unit - {selectedClassForTransition.class_name}
                      </h3>
                      <button
                        onClick={() => setShowUnitTransitionModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Unit hiện tại:</strong> {selectedClassForTransition.data?.unit || 'Chưa có'}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Gợi ý unit tiếp theo:</strong> {getNextSuggestedUnit(selectedClassForTransition.data?.unit || '')}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="new-unit" className="block text-sm font-medium text-gray-700 mb-2">
                        Unit mới <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="new-unit"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Chọn unit mới</option>
                        {grapeSeedUnits.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="transition-date" className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu unit mới <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="transition-date"
                        value={transitionDate}
                        onChange={(e) => setTransitionDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowUnitTransitionModal(false)}
                        disabled={isSubmittingTransition}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={submitUnitTransition}
                        disabled={isSubmittingTransition || !newUnit || !transitionDate}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {isSubmittingTransition ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                          </>
                        ) : (
                          'Chuyển Unit'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'employees':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Nhân viên</h2>
              <button
                onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showEmployeeForm ? '📋' : '➕'}</span>
                <span>{showEmployeeForm ? 'Xem danh sách' : 'Thêm nhân viên'}</span>
              </button>
            </div>

            {showEmployeeForm ? (
              <EmployeeForm onSubmit={(data) => handleFormSubmit(data, 'Employee')} />
            ) : (
              <div className="space-y-6">
                {/* Employees List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách nhân viên ({employees.length})
                    </h3>
                  </div>

                  {isLoadingEmployees ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách nhân viên...</p>
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có nhân viên nào</h4>
                      <p className="text-gray-600">Chưa có nhân viên nào được tạo.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Họ và tên
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Chức vụ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phòng ban
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Điện thoại
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ngày vào làm
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {employees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                                {employee.data?.qualifications && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {employee.data.qualifications}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {employee.position || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {employee.department || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {employee.data?.email || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {employee.data?.phone || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {employee.data?.hire_date ? formatDate(employee.data.hire_date) : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(employee.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'students':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Học sinh</h2>
              <button
                onClick={() => setShowStudentForm(!showStudentForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showStudentForm ? '📋' : '➕'}</span>
                <span>{showStudentForm ? 'Xem danh sách' : 'Thêm học sinh'}</span>
              </button>
            </div>

            {showStudentForm ? (
              <StudentEnrollmentForm 
                onSuccess={() => {
                  setShowStudentForm(false);
                  fetchStudents();
                }} 
              />
            ) : (
              <div className="space-y-6">
                {/* Students List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách học sinh ({students.length})
                    </h3>
                  </div>

                  {isLoadingStudents ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách học sinh...</p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có học sinh nào</h4>
                      <p className="text-gray-600">Chưa có học sinh nào được tạo.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Họ và tên
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Điện thoại
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cơ sở dự kiến
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Chương trình
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phụ huynh
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                                {student.data?.current_english_level && (
                                  <div className="text-sm text-gray-500">
                                    Trình độ: {student.data.current_english_level}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {student.email || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {student.phone || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {student.data?.expected_campus || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {student.data?.program || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {student.data?.parent?.name || '-'}
                                </div>
                                {student.data?.parent?.phone && (
                                  <div className="text-sm text-gray-500">
                                    {student.data.parent.phone}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(student.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'enrollments':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Đăng ký</h2>
              <button
                onClick={() => setShowEnrollmentForm(!showEnrollmentForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showEnrollmentForm ? '📋' : '➕'}</span>
                <span>{showEnrollmentForm ? 'Xem danh sách' : 'Thêm đăng ký'}</span>
              </button>
            </div>

            {showEnrollmentForm ? (
              <EnrollmentForm onSubmit={(data) => handleFormSubmit(data, 'Enrollment')} />
            ) : (
              <div className="space-y-6">
                {/* Enrollments List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách đăng ký ({enrollments.length})
                    </h3>
                  </div>

                  {isLoadingEnrollments ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách đăng ký...</p>
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có đăng ký nào</h4>
                      <p className="text-gray-600">Chưa có đăng ký nào được tạo.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Học sinh
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lớp học
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ngày đăng ký
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái thanh toán
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {enrollments.map((enrollment) => (
                            <tr key={enrollment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {enrollment.students?.full_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {enrollment.classes?.class_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(enrollment.enrollment_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {enrollment.data?.payment_status || 'Chưa thanh toán'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(enrollment.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Điểm danh</h2>
              <button
                onClick={() => setShowAttendanceForm(!showAttendanceForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showAttendanceForm ? '📋' : '➕'}</span>
                <span>{showAttendanceForm ? 'Xem danh sách' : 'Thêm điểm danh'}</span>
              </button>
            </div>

            {showAttendanceForm ? (
              <AttendanceForm onSubmit={(data) => handleFormSubmit(data, 'Attendance')} />
            ) : (
              <div className="space-y-6">
                {/* Attendance List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách điểm danh ({attendances.length})
                    </h3>
                  </div>

                  {isLoadingAttendances ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách điểm danh...</p>
                    </div>
                  ) : attendances.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có điểm danh nào</h4>
                      <p className="text-gray-600">Chưa có điểm danh nào được tạo.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Học sinh
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lớp học
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ngày học
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ghi chú
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendances.map((attendance) => (
                            <tr key={attendance.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {attendance.students?.full_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {attendance.classes?.class_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(attendance.session_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(attendance.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {attendance.data?.notes || '-'}
                                  {attendance.data?.late_minutes && (
                                    <div className="text-sm text-red-600">
                                      Trễ {attendance.data.late_minutes} phút
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'finances':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Tài chính</h2>
              <button
                onClick={() => setShowFinanceForm(!showFinanceForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>{showFinanceForm ? '📋' : '➕'}</span>
                <span>{showFinanceForm ? 'Xem danh sách' : 'Thêm tài chính'}</span>
              </button>
            </div>

            {showFinanceForm ? (
              <FinanceForm onSubmit={(data) => handleFormSubmit(data, 'Finance')} />
            ) : (
              <div className="space-y-6">
                {/* Finances List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách tài chính ({finances.length})
                    </h3>
                  </div>

                  {isLoadingFinances ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách tài chính...</p>
                    </div>
                  ) : finances.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có giao dịch tài chính nào</h4>
                      <p className="text-gray-600">Chưa có giao dịch tài chính nào được tạo.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Học sinh
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Loại
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Số tiền
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hạn thanh toán
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phương thức
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {finances.map((finance) => (
                            <tr key={finance.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {finance.students?.full_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {finance.type}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {finance.amount.toLocaleString('vi-VN')} VNĐ
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(finance.due_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {finance.data?.payment_method || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(finance.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
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
                {/* Tasks List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách bài tập ({tasks.length})
                    </h3>
                  </div>

                  {isLoadingTasks ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Đang tải danh sách bài tập...</p>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có bài tập nào</h4>
                      <p className="text-gray-600">Chưa có bài tập nào được tạo.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tiêu đề
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lớp học
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mô tả
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hạn nộp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Điểm số
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                {task.data?.instructions && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {task.data.instructions}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {task.classes?.class_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 truncate max-w-xs">
                                  {task.description || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(task.due_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {task.data?.points || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(task.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Lịch học các lớp</h2>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">Lịch học các lớp</h3>
                <p className="text-gray-600 mb-6">
                  Xem và quản lý lịch học của tất cả các lớp
                </p>
                
                <button 
                  onClick={() => window.location.href = '/schedule'}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <span className="mr-2">📅</span>
                  Xem lịch học
                </button>
              </div>
            </div>
          </div>
        );
      case 'api-test':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Test API Endpoints</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Quick Tests</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => testAllEndpoints()}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test All GET'}
                </button>
                <button
                  onClick={() => testEndpoint('/api/students')}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Test Students
                </button>
                <button
                  onClick={() => testEndpoint('/api/facilities')}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Test Facilities
                </button>
                <button
                  onClick={() => testEndpoint('/api/classes')}
                  disabled={loading}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Test Classes
                </button>
                <button
                  onClick={() => testEndpoint('/api/employees')}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Test Employees
                </button>
                <button
                  onClick={() => testEndpoint('/api/teaching-sessions')}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Test Sessions
                </button>
              </div>

              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {apiResults.length === 0 ? (
                  <p className="text-gray-500">No tests run yet. Click a button above to test an endpoint.</p>
                ) : (
                  apiResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.status >= 200 && result.status < 300
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-sm">
                          {result.method} {result.endpoint}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            result.status >= 200 && result.status < 300
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.status || 'ERROR'}
                        </span>
                      </div>
                      {result.error ? (
                        <p className="text-red-600 text-sm">{result.error}</p>
                      ) : (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            View Response ({result.data?.data?.length || 0} items)
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              🎓 Meraki ERP - Test Dashboard
            </h1>
            <div className="text-sm text-gray-500">
              English Language Center Management System
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
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
    </div>
  );
}
