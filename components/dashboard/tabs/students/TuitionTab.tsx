import React, { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  amount: number;
  outstanding_amount: number;
  payment_status: string;
  due_date: string;
  created_at: string;
  class_id: string;
  student_id: string;
}

interface Student {
  id: string;
  name: string;
  full_name?: string;
  email?: string;
  phone?: string;
  facility_id?: string;
  facility_name?: string;
  enrollment_date?: string;
  tuition_fee?: number;
  payment_status?: string;
  due_date?: string;
  outstanding_amount?: number;
  invoices?: Invoice[];
}

interface Facility {
  id: string;
  name: string;
}

export default function TuitionTab(): JSX.Element {
  const [students, setStudents] = useState<Student[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchFacilities();
  }, [selectedFacility, selectedStatus, selectedMonth, selectedYear]);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', '1000');

      if (selectedFacility) {
        params.append('facility_id', selectedFacility);
      }
      if (selectedStatus) {
        params.append('payment_status', selectedStatus);
      }
      if (selectedMonth && selectedYear) {
        params.append('due_month', selectedMonth.toString());
        params.append('due_year', selectedYear.toString());
      }

      const url = `/api/students?${params.toString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setStudents(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch students');
        setStudents([]);
      }
    } catch (err) {
      setError('Error fetching students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities');
      const result = await response.json();

      if (result.success) {
        setFacilities(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800' },
      partial: { label: 'Thanh toán một phần', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
      overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
                  { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getInvoiceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'tuition': 'Học phí',
      'standard': 'Dịch vụ',
      'payroll': 'Lương',
      'expense': 'Chi phí'
    };
    return labels[type] || type;
  };

  // Calculate summary statistics
  // Map students to include facility_name from current_enrollments.classes.facilities.name if available
  // Also calculate total outstanding amount from all invoices for the student
  const studentsWithFacility = students.map((student: any) => {
    let facilityName = 'Chưa xác định cơ sở';
    let studentName = student.full_name || student.name || 'Chưa xác định tên';
    let totalOutstandingAmount = 0;

    if (student.invoices && student.invoices.length > 0) {
      // Exclude draft invoices from outstanding amount calculation
      const validInvoices = student.invoices.filter((invoice: any) => invoice.payment_status !== 'draft');
      totalOutstandingAmount = validInvoices.reduce((sum: number, invoice: any) => sum + (invoice.outstanding_amount || 0), 0);
    }

    if (student.current_enrollments && student.current_enrollments.length > 0) {
      const firstEnrollment = student.current_enrollments[0];
      if (firstEnrollment.classes && firstEnrollment.classes.facilities) {
        facilityName = firstEnrollment.classes.facilities.name || facilityName;
      }
    }

    return {
      ...student,
      facility_name: facilityName,
      full_name: studentName,
      outstanding_amount: totalOutstandingAmount,
    };
  });

  // Remove total tuition, total paid, total pending as no longer used

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Đang tải dữ liệu học phí...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchStudents}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cơ sở</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chưa thanh toán</option>
              <option value="partial">Thanh toán một phần</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Remove summary cards */}

      {/* Students List */}
      {studentsWithFacility.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có học sinh nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Không tìm thấy học sinh nào với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Danh sách học sinh</h3>
            <button
              onClick={fetchStudents}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>

          {studentsWithFacility.map((student) => (
            <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setSelectedStudent(student);
              setIsModalOpen(true);
            }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.facility_name || 'Chưa xác định cơ sở'} - {
                          student.enrollment_date ?
                          new Date(student.enrollment_date).toLocaleDateString('vi-VN') :
                          'Chưa xác định'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{formatCurrency(student.outstanding_amount || 0)}</span>
                      {student.outstanding_amount && student.outstanding_amount > 0 && (
                        <span className="ml-2 text-red-600">
                          (Còn nợ)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setIsModalOpen(false)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Hóa đơn của {selectedStudent.full_name}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {selectedStudent.invoices && selectedStudent.invoices.length > 0 ? (
                  selectedStudent.invoices.map((invoice) => (
                    <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Hóa đơn #{invoice.id}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ngày tạo: {new Date(invoice.created_at).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ngày đến hạn: {new Date(invoice.due_date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.amount)}
                          </p>
                          <p className="text-sm text-red-600">
                            Còn nợ: {formatCurrency(invoice.outstanding_amount)}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.payment_status === 'paid' ? 'Đã thanh toán' :
                             invoice.payment_status === 'partial' ? 'Thanh toán một phần' :
                             'Chưa thanh toán'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Không có hóa đơn nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
