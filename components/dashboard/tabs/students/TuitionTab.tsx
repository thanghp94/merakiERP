import React, { useState, useEffect } from 'react';
import { FilterBar, FilterConfig } from '../../shared';

interface StudentWithInvoice {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  facility?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    class_name: string;
    program_type?: string;
  };
  pending_invoices: Array<{
    id: string;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    total_amount: number;
    remaining_amount: number;
    status: string;
    is_overdue: boolean;
  }>;
  total_pending_amount: number;
  has_overdue: boolean;
}

interface TuitionTabProps {
  onViewStudent?: (student: any) => void;
}

export default function TuitionTab({ onViewStudent }: TuitionTabProps) {
  const [studentsWithInvoices, setStudentsWithInvoices] = useState<StudentWithInvoice[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFacility, setFilterFacility] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [studentsWithInvoices, searchTerm, filterFacility, filterClass, filterProgram, filterStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, facilitiesRes, classesRes] = await Promise.all([
        fetch('/api/students/pending-invoices'),
        fetch('/api/facilities'),
        fetch('/api/classes')
      ]);

      const [studentsData, facilitiesData, classesData] = await Promise.all([
        studentsRes.json(),
        facilitiesRes.json(),
        classesRes.json()
      ]);

      if (studentsData.success) {
        setStudentsWithInvoices(studentsData.data || []);
      }
      if (facilitiesData.success) {
        setFacilities(facilitiesData.data || []);
      }
      if (classesData.success) {
        setClasses(classesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching tuition data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...studentsWithInvoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Facility filter
    if (filterFacility !== 'all') {
      filtered = filtered.filter(student => student.facility?.id === filterFacility);
    }

    // Class filter
    if (filterClass !== 'all') {
      filtered = filtered.filter(student => student.class?.id === filterClass);
    }

    // Program filter
    if (filterProgram !== 'all') {
      filtered = filtered.filter(student => student.class?.program_type === filterProgram);
    }

    // Status filter
    if (filterStatus === 'overdue') {
      filtered = filtered.filter(student => student.has_overdue);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(student => !student.has_overdue);
    }

    setFilteredStudents(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'search':
        setSearchTerm(value);
        break;
      case 'facility':
        setFilterFacility(value);
        break;
      case 'class':
        setFilterClass(value);
        break;
      case 'program':
        setFilterProgram(value);
        break;
      case 'status':
        setFilterStatus(value);
        break;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterFacility('all');
    setFilterClass('all');
    setFilterProgram('all');
    setFilterStatus('all');
  };

  // Calculate summary
  const totalReceivable = filteredStudents.reduce((sum, student) => sum + student.total_pending_amount, 0);
  const overdueCount = filteredStudents.filter(student => student.has_overdue).length;
  const totalOverdue = filteredStudents
    .filter(student => student.has_overdue)
    .reduce((sum, student) => sum + student.total_pending_amount, 0);

  const getFilterConfig = (): FilterConfig[] => {
    return [
      {
        key: 'search',
        label: 'Tìm kiếm',
        options: []
      },
      {
        key: 'facility',
        label: 'Cơ sở',
        options: [
          { value: 'all', label: 'Tất cả cơ sở' },
          ...facilities.map(facility => ({
            value: facility.id,
            label: facility.name
          }))
        ]
      },
      {
        key: 'class',
        label: 'Lớp',
        options: [
          { value: 'all', label: 'Tất cả lớp' },
          ...classes.map(cls => ({
            value: cls.id,
            label: cls.class_name
          }))
        ]
      },
      {
        key: 'program',
        label: 'Chương trình',
        options: [
          { value: 'all', label: 'Tất cả chương trình' },
          { value: 'GrapeSEED', label: 'GrapeSEED' },
          { value: 'Pre-WSC', label: 'Pre-WSC' },
          { value: 'WSC', label: 'WSC' },
          { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
          { value: 'Gavel club', label: 'Gavel club' }
        ]
      },
      {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { value: 'all', label: 'Tất cả' },
          { value: 'pending', label: 'Chưa quá hạn' },
          { value: 'overdue', label: 'Quá hạn' }
        ]
      }
    ];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Quá hạn
        </span>
      );
    }
    
    const statusMap: { [key: string]: { bg: string; text: string; label: string } } = {
      'sent': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã gửi' },
      'partial': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Một phần' },
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' }
    };

    const statusInfo = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Học sinh có công nợ</p>
              <p className="text-lg font-semibold text-blue-900">
                {filteredStudents.length} học sinh
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-800">Tổng công nợ</p>
              <p className="text-lg font-semibold text-orange-900">
                {totalReceivable.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚠️</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Quá hạn</p>
              <p className="text-lg font-semibold text-red-900">
                {overdueCount} học sinh
              </p>
              <p className="text-sm text-red-700">
                {totalOverdue.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={{
          search: searchTerm,
          facility: filterFacility,
          class: filterClass,
          program: filterProgram,
          status: filterStatus
        }}
        filterConfigs={getFilterConfig()}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Danh sách học sinh có công nợ ({filteredStudents.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Không có học sinh nào có công nợ</h4>
            <p className="text-gray-600">Tất cả học sinh đã thanh toán đầy đủ học phí.</p>
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
                    Lớp/Chương trình
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cơ sở
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số hóa đơn chưa thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng công nợ
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
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-gray-50 ${student.has_overdue ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          {student.email && (
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          )}
                          {student.phone && (
                            <div className="text-sm text-gray-500">
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.class?.class_name || '-'}
                      </div>
                      {student.class?.program_type && (
                        <div className="text-sm text-gray-500">
                          {student.class.program_type}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.facility?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.pending_invoices.length} hóa đơn
                      </div>
                      <div className="text-xs text-gray-500">
                        {student.pending_invoices.map(invoice => (
                          <div key={invoice.id} className="flex justify-between">
                            <span>{invoice.invoice_number}</span>
                            <span>{invoice.remaining_amount.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${student.has_overdue ? 'text-red-600' : 'text-orange-600'}`}>
                        {student.total_pending_amount.toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.has_overdue ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Quá hạn
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Chưa thanh toán
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewStudent?.(student)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Chi tiết
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
  );
}
