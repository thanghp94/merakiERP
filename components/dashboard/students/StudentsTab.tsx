import React, { useState, useEffect } from 'react';
import StudentEnrollmentForm from './StudentEnrollmentForm';
import { Student } from '../shared/types';
import { getStatusBadge } from '../shared/utils';
import FilterBar, { FilterConfig } from '../shared/FilterBar';

interface StudentsTabProps {
  showStudentForm: boolean;
  setShowStudentForm: (show: boolean) => void;
}

interface FilterOptions {
  facilities: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; class_name: string; facility_id: string; program_type?: string }>;
  programTypes: Array<{ value: string; label: string }>;
}

export default function StudentsTab({
  showStudentForm,
  setShowStudentForm
}: StudentsTabProps): JSX.Element {
  const [filters, setFilters] = useState({
    facility_type: 'all',
    facility_id: 'all',
    class_id: 'all',
    program_type: 'all'
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    facilities: [],
    classes: [],
    programTypes: []
  });
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  
  // Add students state management
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Attendance drawer state
  const [attendanceDrawer, setAttendanceDrawer] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    attendanceRecords: any[];
    filteredRecords: any[];
    isLoading: boolean;
    unitFilter: string;
    classFilter: string;
    availableUnits: string[];
    availableClasses: Array<{ id: string; name: string }>;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    attendanceRecords: [],
    filteredRecords: [],
    isLoading: false,
    unitFilter: 'all',
    classFilter: 'all',
    availableUnits: [],
    availableClasses: []
  });

  // Invoice drawer state
  const [invoiceDrawer, setInvoiceDrawer] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    invoices: any[];
    isLoading: boolean;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    invoices: [],
    isLoading: false
  });

  // Fetch filter options and initial students on component mount
  useEffect(() => {
    fetchFilterOptions();
    fetchStudents();
  }, []);

  const fetchFilterOptions = async () => {
    setIsLoadingFilters(true);
    try {
      // Fetch facilities
      const facilitiesResponse = await fetch('/api/facilities');
      const facilitiesResult = await facilitiesResponse.json();
      
      // Fetch classes with program types
      const classesResponse = await fetch('/api/classes');
      const classesResult = await classesResponse.json();
      
      if (facilitiesResult.success && classesResult.success) {
        const facilities = facilitiesResult.data || [];
        const classes = classesResult.data || [];
        
        // Extract unique program types from classes
        const programTypesSet = new Set<string>();
        classes.forEach((cls: any) => {
          if (cls.data?.program_type) {
            programTypesSet.add(cls.data.program_type);
          }
        });
        
        const programTypes = Array.from(programTypesSet).map(type => ({
          value: type,
          label: type
        }));

        setFilterOptions({
          facilities,
          classes,
          programTypes
        });
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    
    // Reset dependent filters
    if (filterType === 'facility_id') {
      newFilters.class_id = 'all';
    }
    
    setFilters(newFilters);
    
    // Trigger students fetch with new filters
    fetchStudentsWithFilters(newFilters);
  };

  const fetchStudents = async (filterParams?: typeof filters) => {
    setIsLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      
      // Use provided filters or current filters
      const currentFilters = filterParams || filters;
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`/api/students?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setStudents(result.data || []);
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

  const fetchStudentsWithFilters = async (currentFilters: typeof filters) => {
    await fetchStudents(currentFilters);
  };

  // Filter classes based on selected facility
  const getFilteredClasses = () => {
    if (filters.facility_id === 'all') {
      return filterOptions.classes;
    }
    return filterOptions.classes.filter(cls => cls.facility_id === filters.facility_id);
  };

  // Create filter configurations for FilterBar
  const getFilterConfigs = (): FilterConfig[] => {
    return [
      {
        key: 'facility_type',
        label: 'Cơ sở',
        options: [
          { value: 'all', label: 'Tất cả cơ sở' },
          { value: 'meraki', label: 'Meraki' },
          { value: 'partner', label: 'Đối tác' }
        ],
        disabled: isLoadingFilters
      },
      {
        key: 'facility_id',
        label: 'Chi nhánh',
        options: [
          { value: 'all', label: 'Tất cả chi nhánh' },
          ...filterOptions.facilities.map(facility => ({
            value: facility.id,
            label: facility.name
          }))
        ],
        disabled: isLoadingFilters
      },
      {
        key: 'class_id',
        label: 'Lớp học',
        options: [
          { value: 'all', label: 'Tất cả lớp học' },
          ...getFilteredClasses().map(cls => ({
            value: cls.id,
            label: cls.class_name
          }))
        ],
        disabled: isLoadingFilters
      },
      {
        key: 'program_type',
        label: 'Chương trình',
        options: [
          { value: 'all', label: 'Tất cả chương trình' },
          ...filterOptions.programTypes.map(program => ({
            value: program.value,
            label: program.label
          }))
        ],
        disabled: isLoadingFilters
      }
    ];
  };

  const handleClearFilters = () => {
    setFilters({
      facility_type: 'all',
      facility_id: 'all',
      class_id: 'all',
      program_type: 'all'
    });
    fetchStudents();
  };

  // Handle invoice drawer
  const handleViewInvoices = async (student: Student) => {
    setInvoiceDrawer({
      isOpen: true,
      studentId: student.id,
      studentName: student.full_name,
      invoices: [],
      isLoading: true
    });

    try {
      const response = await fetch(`/api/invoices?student_id=${student.id}`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`📄 Found ${result.data.length} invoices for student ${student.full_name}`);
        setInvoiceDrawer(prev => ({
          ...prev,
          invoices: result.data || [],
          isLoading: false
        }));
      } else {
        console.error('Failed to fetch invoices:', result.message);
        setInvoiceDrawer(prev => ({
          ...prev,
          invoices: [],
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoiceDrawer(prev => ({
        ...prev,
        invoices: [],
        isLoading: false
      }));
    }
  };

  const closeInvoiceDrawer = () => {
    setInvoiceDrawer({
      isOpen: false,
      studentId: '',
      studentName: '',
      invoices: [],
      isLoading: false
    });
  };

  // Handle attendance drawer
  const handleViewAttendance = async (student: Student) => {
    setAttendanceDrawer({
      isOpen: true,
      studentId: student.id,
      studentName: student.full_name,
      attendanceRecords: [],
      filteredRecords: [],
      isLoading: true,
      unitFilter: 'all',
      classFilter: 'all',
      availableUnits: [],
      availableClasses: []
    });

    try {
      // First, get enrollments for this student to find their attendance records
      const enrollmentsResponse = await fetch(`/api/enrollments?student_id=${student.id}`);
      const enrollmentsResult = await enrollmentsResponse.json();
      
      if (!enrollmentsResult.success) {
        console.error('Failed to fetch enrollments:', enrollmentsResult.message);
        setAttendanceDrawer(prev => ({
          ...prev,
          attendanceRecords: [],
          filteredRecords: [],
          isLoading: false
        }));
        return;
      }

      const enrollments = enrollmentsResult.data || [];
      if (enrollments.length === 0) {
        setAttendanceDrawer(prev => ({
          ...prev,
          attendanceRecords: [],
          filteredRecords: [],
          isLoading: false
        }));
        return;
      }

      // Fetch attendance records for each enrollment
      const allAttendanceRecords: any[] = [];
      console.log(`🔍 Fetching attendance for ${enrollments.length} enrollments...`);
      
      for (const enrollment of enrollments) {
        console.log(`  - Fetching attendance for enrollment ${enrollment.id}...`);
        const response = await fetch(`/api/attendance?enrollment_id=${enrollment.id}`);
        const result = await response.json();
        
        console.log(`    API response:`, result);
        
        if (result.success && result.data) {
          console.log(`    Found ${result.data.length} attendance records`);
          allAttendanceRecords.push(...result.data);
        } else {
          console.log(`    No attendance records found or API error:`, result.message);
        }
      }
      
      console.log(`📊 Total attendance records found: ${allAttendanceRecords.length}`);
      console.log('Sample records:', allAttendanceRecords.slice(0, 2));
      
      // Extract unique units and classes from the attendance records
      const unitsSet = new Set<string>();
      const classesSet = new Set<{ id: string; name: string }>();
      
      allAttendanceRecords.forEach((record: any) => {
        // Extract units (same logic as before)
        const lessonId = record.main_sessions?.lesson_id || '';
        console.log(`  - Processing record: lesson_id="${lessonId}"`);
        
        if (lessonId.includes('.')) {
          const unit = lessonId.split('.')[0];
          if (unit.match(/^U\d+$/)) { // Validate it's a proper unit format
            unitsSet.add(unit);
            console.log(`    ✅ Added unit from lesson_id: ${unit}`);
          }
        } else {
          // If lesson_id doesn't have unit, try to extract from main_session_name
          const sessionName = record.main_sessions?.main_session_name || '';
          console.log(`    Trying main_session_name: "${sessionName}"`);
          
          // Look for patterns like "GrapeSEED Test Class.U6.L5" or "Class.U8.L1"
          const unitMatch = sessionName.match(/\.U(\d+)\./);
          if (unitMatch) {
            const unit = `U${unitMatch[1]}`;
            unitsSet.add(unit);
            console.log(`    ✅ Added unit from session_name: ${unit}`);
          } else {
            // Also try pattern without dots like "U6L5" or "U8L1"
            const unitMatch2 = sessionName.match(/U(\d+)L\d+/);
            if (unitMatch2) {
              const unit = `U${unitMatch2[1]}`;
              unitsSet.add(unit);
              console.log(`    ✅ Added unit from session_name pattern: ${unit}`);
            } else {
              console.log(`    ⚠️  No unit found in session_name`);
            }
          }
        }
        
        // Extract classes from enrollment data
        const className = record.enrollments?.classes?.class_name;
        const classId = record.enrollments?.classes?.id;
        if (className && classId) {
          // Check if this class is already in the set
          const existingClass = Array.from(classesSet).find(c => c.id === classId);
          if (!existingClass) {
            classesSet.add({ id: classId, name: className });
            console.log(`    ✅ Added class: ${className} (${classId})`);
          }
        }
      });
      
      const availableUnits = Array.from(unitsSet).sort();
      const availableClasses = Array.from(classesSet).sort((a, b) => a.name.localeCompare(b.name));
      console.log(`📋 Available units: ${availableUnits.join(', ')}`);
      console.log(`📋 Available classes: ${availableClasses.map(c => c.name).join(', ')}`);
      
      setAttendanceDrawer(prev => ({
        ...prev,
        attendanceRecords: allAttendanceRecords,
        filteredRecords: allAttendanceRecords,
        availableUnits,
        availableClasses,
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceDrawer(prev => ({
        ...prev,
        attendanceRecords: [],
        filteredRecords: [],
        isLoading: false
      }));
    }
  };

  const closeAttendanceDrawer = () => {
    setAttendanceDrawer({
      isOpen: false,
      studentId: '',
      studentName: '',
      attendanceRecords: [],
      filteredRecords: [],
      isLoading: false,
      unitFilter: 'all',
      classFilter: 'all',
      availableUnits: [],
      availableClasses: []
    });
  };

  // Apply both unit and class filters
  const applyFilters = (unitFilter: string, classFilter: string) => {
    let filtered = attendanceDrawer.attendanceRecords;

    // Apply unit filter
    if (unitFilter !== 'all') {
      filtered = filtered.filter((record: any) => {
        // First try to extract unit from lesson_id (e.g., "U2.L3" -> "U2")
        const lessonId = record.main_sessions?.lesson_id || '';
        if (lessonId.includes('.')) {
          const recordUnit = lessonId.split('.')[0];
          return recordUnit === unitFilter;
        } else {
          // If lesson_id doesn't have unit, try to extract from main_session_name
          const sessionName = record.main_sessions?.main_session_name || '';
          
          // Look for patterns like "GrapeSEED Test Class.U6.L5" or "Class.U8.L1"
          const unitMatch = sessionName.match(/\.U(\d+)\./);
          if (unitMatch) {
            const recordUnit = `U${unitMatch[1]}`;
            return recordUnit === unitFilter;
          } else {
            // Also try pattern without dots like "U6L5" or "U8L1"
            const unitMatch2 = sessionName.match(/U(\d+)L\d+/);
            if (unitMatch2) {
              const recordUnit = `U${unitMatch2[1]}`;
              return recordUnit === unitFilter;
            }
          }
        }
        return false;
      });
    }

    // Apply class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter((record: any) => {
        const recordClassId = record.enrollments?.classes?.id;
        return recordClassId === classFilter;
      });
    }

    return filtered;
  };

  // Handle unit filter change
  const handleUnitFilterChange = (unit: string) => {
    const filtered = applyFilters(unit, attendanceDrawer.classFilter);

    setAttendanceDrawer(prev => ({
      ...prev,
      unitFilter: unit,
      filteredRecords: filtered
    }));
  };

  // Handle class filter change
  const handleClassFilterChange = (classId: string) => {
    const filtered = applyFilters(attendanceDrawer.unitFilter, classId);

    setAttendanceDrawer(prev => ({
      ...prev,
      classFilter: classId,
      filteredRecords: filtered
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getAttendanceStatusBadge = (status: string) => {
    const statusConfig = {
      present: { bg: 'bg-green-100', text: 'text-green-800', label: 'Có mặt' },
      absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Vắng mặt' },
      late: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Trễ' },
      excused: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Có phép' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.absent;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-3 relative">
      {showStudentForm ? (
        <StudentEnrollmentForm 
          onSuccess={() => {
            setShowStudentForm(false);
            fetchStudents();
          }} 
        />
      ) : (
        <div className="space-y-3">
          {/* Filter Controls */}
          <FilterBar
            filters={filters}
            filterConfigs={getFilterConfigs()}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            actionButton={{
              label: showStudentForm ? 'Xem danh sách' : 'Thêm học sinh',
              icon: showStudentForm ? '📋' : '➕',
              onClick: () => setShowStudentForm(!showStudentForm)
            }}
            isLoading={isLoadingFilters}
          />

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">
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
                        Điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phụ huynh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: Student) => (
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
                            {student.phone || '-'}
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewAttendance(student)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              📋 Xem điểm danh
                            </button>
                            <button
                              onClick={() => handleViewInvoices(student)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              💰 Xem hóa đơn
                            </button>
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

      {/* Attendance Drawer */}
      {attendanceDrawer.isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeAttendanceDrawer}></div>
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Điểm danh - {attendanceDrawer.studentName}
                  </h3>
                  <button
                    onClick={closeAttendanceDrawer}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-1 gap-4">
                  {/* Unit Filter */}
                  <div>
                    <label htmlFor="unit-filter" className="block text-sm font-medium text-gray-700 mb-2">
                      Lọc theo Unit
                    </label>
                    <select
                      id="unit-filter"
                      value={attendanceDrawer.unitFilter}
                      onChange={(e) => handleUnitFilterChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">Tất cả Unit</option>
                      {attendanceDrawer.availableUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Filter */}
                  <div>
                    <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-2">
                      Lớp ghi danh
                    </label>
                    <select
                      id="class-filter"
                      value={attendanceDrawer.classFilter}
                      onChange={(e) => handleClassFilterChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">Tất cả lớp</option>
                      {attendanceDrawer.availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {attendanceDrawer.isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Đang tải...</span>
                  </div>
                ) : attendanceDrawer.filteredRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Chưa có điểm danh</h4>
                    <p className="text-gray-600">
                      {attendanceDrawer.unitFilter === 'all' && attendanceDrawer.classFilter === 'all'
                        ? 'Học sinh này chưa có bản ghi điểm danh nào.' 
                        : `Không có điểm danh nào cho bộ lọc đã chọn.`}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Buổi học
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ghi chú
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceDrawer.filteredRecords.map((record: any) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {record.main_sessions?.main_session_name || 'Buổi học'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(record.main_sessions?.scheduled_date || record.created_at)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {getAttendanceStatusBadge(record.status)}
                              {record.data?.late_minutes && (
                                <div className="text-xs text-red-600 mt-1">
                                  Trễ {record.data.late_minutes} phút
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-600">
                                {record.data?.notes || '-'}
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
          </div>
        </div>
      )}

      {/* Invoice Drawer */}
      {invoiceDrawer.isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeInvoiceDrawer}></div>
          <div className="absolute left-0 top-0 h-full w-1/2 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Hóa đơn - {invoiceDrawer.studentName}
                  </h3>
                  <button
                    onClick={closeInvoiceDrawer}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {invoiceDrawer.isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Đang tải...</span>
                  </div>
                ) : invoiceDrawer.invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Chưa có hóa đơn</h4>
                    <p className="text-gray-600">Học sinh này chưa có hóa đơn nào.</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {invoiceDrawer.invoices.map((invoice: any) => (
                      <div key={invoice.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {/* Invoice Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {invoice.invoice_number || `Hóa đơn #${invoice.id.slice(-6)}`}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {invoice.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-500">
                                Ngày: {formatDate(invoice.invoice_date || invoice.created_at)}
                              </span>
                              {invoice.due_date && (
                                <span className="text-sm text-gray-500">
                                  Hạn: {formatDate(invoice.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {invoice.total_amount?.toLocaleString('vi-VN') || '0'} ₫
                            </div>
                            <div className="mt-1">
                              {getStatusBadge(invoice.status)}
                            </div>
                            {invoice.is_income !== undefined && (
                              <div className={`text-xs mt-1 ${invoice.is_income ? 'text-green-600' : 'text-red-600'}`}>
                                {invoice.is_income ? 'Thu' : 'Chi'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Invoice Items */}
                        {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Chi tiết các khoản:</h5>
                            <div className="space-y-2">
                              {invoice.invoice_items.map((item: any, index: number) => (
                                <div key={item.id || index} className="bg-white rounded p-3 border border-gray-100">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {item.item_name}
                                      </div>
                                      {item.item_description && (
                                        <div className="text-sm text-gray-600 mt-1">
                                          {item.item_description}
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                        <span>Danh mục: {item.category}</span>
                                        <span>SL: {item.quantity || 1}</span>
                                        <span>Đơn giá: {item.unit_price?.toLocaleString('vi-VN')} ₫</span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="font-semibold text-gray-900">
                                        {item.total_amount?.toLocaleString('vi-VN') || 
                                         ((item.quantity || 1) * (item.unit_price || 0)).toLocaleString('vi-VN')} ₫
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Payment Info */}
                        {(invoice.paid_amount > 0 || invoice.remaining_amount > 0) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {invoice.paid_amount > 0 && (
                                <div>
                                  <span className="text-gray-600">Đã thanh toán:</span>
                                  <span className="ml-2 font-medium text-green-600">
                                    {invoice.paid_amount.toLocaleString('vi-VN')} ₫
                                  </span>
                                </div>
                              )}
                              {invoice.remaining_amount > 0 && (
                                <div>
                                  <span className="text-gray-600">Còn lại:</span>
                                  <span className="ml-2 font-medium text-orange-600">
                                    {invoice.remaining_amount.toLocaleString('vi-VN')} ₫
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {invoice.notes && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm">
                              <span className="text-gray-600">Ghi chú:</span>
                              <p className="mt-1 text-gray-800">{invoice.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
