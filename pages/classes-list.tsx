import React, { useState, useEffect } from 'react';
import Head from 'next/head';

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

const ClassesList: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [grapeSeedUnits, setGrapeSeedUnits] = useState<UnitOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  // Filter states
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  // Unit transition states
  const [showUnitTransitionModal, setShowUnitTransitionModal] = useState(false);
  const [selectedClassForTransition, setSelectedClassForTransition] = useState<Class | null>(null);
  const [newUnit, setNewUnit] = useState('');
  const [transitionDate, setTransitionDate] = useState('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchFacilities();
    fetchProgramTypes();
    fetchGrapeSeedUnits();
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [selectedFacility, selectedProgram]);

  const fetchClasses = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const fetchFacilities = async () => {
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

  const fetchGrapeSeedUnits = async () => {
    try {
      const response = await fetch('/api/metadata/enums?type=unit_grapeseed');
      const result = await response.json();
      
      if (result.success) {
        setGrapeSeedUnits(result.data);
      } else {
        console.error('Failed to fetch GrapeSEED units:', result.message);
        setGrapeSeedUnits([]);
      }
    } catch (error) {
      console.error('Error fetching GrapeSEED units:', error);
      setGrapeSeedUnits([]);
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

  const handleUnitTransition = (classItem: Class) => {
    setSelectedClassForTransition(classItem);
    const suggestedUnit = getNextSuggestedUnit(classItem.data?.unit || '');
    setNewUnit(suggestedUnit); // Pre-fill with suggested unit
    setTransitionDate(new Date().toISOString().split('T')[0]); // Today's date
    setShowUnitTransitionModal(true);
  };

  const submitUnitTransition = async () => {
    if (!selectedClassForTransition || !newUnit || !transitionDate) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmittingTransition(true);

    try {
      const currentUnit = selectedClassForTransition.data?.unit || '';
      
      // Prepare unit transition data
      const unitTransitions = selectedClassForTransition.data?.unit_transitions || [];
      const newTransition = {
        from_unit: currentUnit,
        to_unit: newUnit,
        transition_date: transitionDate,
        created_at: new Date().toISOString()
      };

      // Update class data
      const updatedData = {
        ...selectedClassForTransition.data,
        unit: newUnit, // Update current unit
        unit_transitions: [...unitTransitions, newTransition]
      };

      const response = await fetch(`/api/classes/${selectedClassForTransition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedData
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Chuyển unit thành công!');
        setShowUnitTransitionModal(false);
        fetchClasses(); // Refresh the list
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting unit transition:', error);
      alert('Có lỗi xảy ra khi chuyển unit');
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const getNextSuggestedUnit = (currentUnit: string): string => {
    if (!currentUnit) return 'U1';
    
    const match = currentUnit.match(/U(\d+)/);
    if (match) {
      const currentNumber = parseInt(match[1]);
      const nextNumber = currentNumber + 2; // Typically done every 2 units
      return `U${nextNumber}`;
    }
    
    return 'U1';
  };

  return (
    <>
      <Head>
        <title>Danh sách lớp học - MerakiERP</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Danh sách lớp học</h1>
            <p className="mt-2 text-gray-600">Quản lý và xem danh sách các lớp học đang hoạt động</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc</h2>
            
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
              <h2 className="text-lg font-medium text-gray-900">
                Lớp học đang hoạt động ({classes.length})
              </h2>
            </div>

            {isLoading ? (
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lớp học nào</h3>
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
                        Lịch học
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
                            {cls.data?.schedule || '-'}
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
                          {cls.data?.program_type === 'GrapeSEED' && cls.status === 'active' && (
                            <button
                              onClick={() => handleUnitTransition(cls)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              Chuyển Unit
                            </button>
                          )}
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
    </>
  );
};

export default ClassesList;
