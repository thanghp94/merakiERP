import React, { useState, useEffect } from 'react';
import { formatDate, getStatusBadge } from './shared/utils';
import PayrollModal from './PayrollModal';

interface PayrollPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  payroll_period_id: string;
  base_salary: number;
  working_days: number;
  actual_working_days: number;
  allowances: any;
  bonuses: any;
  gross_salary: number;
  bhxh_employee: number;
  bhyt_employee: number;
  bhtn_employee: number;
  personal_income_tax: number;
  other_deductions: any;
  total_deductions: number;
  net_salary: number;
  bhxh_employer: number;
  bhyt_employer: number;
  bhtn_employer: number;
  invoice_id?: string;
  employees?: {
    id: string;
    full_name: string;
    employee_code: string;
  };
  payroll_periods?: {
    id: string;
    period_name: string;
  };
  invoices?: {
    id: string;
    invoice_number: string;
    status: string;
    total_amount: number;
  };
}

interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  data: any;
}

export default function PayrollTab() {
  const [activeTab, setActiveTab] = useState<'periods' | 'records' | 'reports'>('periods');
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [showCreatePeriodForm, setShowCreatePeriodForm] = useState(false);
  const [showCreateRecordForm, setShowCreateRecordForm] = useState(false);

  // Form states
  const [periodForm, setPeriodForm] = useState({
    period_name: '',
    start_date: '',
    end_date: ''
  });

  const [recordForm, setRecordForm] = useState({
    employee_id: '',
    payroll_period_id: '',
    base_salary: '',
    working_days: '26',
    actual_working_days: '26',
    allowances: {
      transport: '',
      lunch: '',
      phone: ''
    },
    bonuses: {
      performance: '',
      holiday: ''
    },
    other_deductions: {
      advance: '',
      union_fee: ''
    },
    dependents: '0'
  });

  useEffect(() => {
    loadPeriods();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadRecords();
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    setIsLoadingPeriods(true);
    try {
      const response = await fetch('/api/payroll/periods');
      const result = await response.json();
      if (result.success) {
        setPeriods(result.data || []);
        if (result.data?.length > 0 && !selectedPeriod) {
          setSelectedPeriod(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    } finally {
      setIsLoadingPeriods(false);
    }
  };

  const loadRecords = async () => {
    if (!selectedPeriod) return;
    
    setIsLoadingRecords(true);
    try {
      const response = await fetch(`/api/payroll/records?payroll_period_id=${selectedPeriod}`);
      const result = await response.json();
      if (result.success) {
        setRecords(result.data || []);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/payroll/periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(periodForm),
      });

      const result = await response.json();
      if (result.success) {
        alert('Kỳ lương đã được tạo thành công!');
        setShowCreatePeriodForm(false);
        setPeriodForm({ period_name: '', start_date: '', end_date: '' });
        loadPeriods();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating period:', error);
      alert('Có lỗi xảy ra khi tạo kỳ lương!');
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean up allowances and bonuses - remove empty values
      const cleanAllowances = Object.fromEntries(
        Object.entries(recordForm.allowances).filter(([_, value]) => value !== '')
      );
      const cleanBonuses = Object.fromEntries(
        Object.entries(recordForm.bonuses).filter(([_, value]) => value !== '')
      );
      const cleanOtherDeductions = Object.fromEntries(
        Object.entries(recordForm.other_deductions).filter(([_, value]) => value !== '')
      );

      const payload = {
        ...recordForm,
        base_salary: parseFloat(recordForm.base_salary),
        working_days: parseInt(recordForm.working_days),
        actual_working_days: parseInt(recordForm.actual_working_days),
        dependents: parseInt(recordForm.dependents),
        allowances: cleanAllowances,
        bonuses: cleanBonuses,
        other_deductions: cleanOtherDeductions
      };

      const response = await fetch('/api/payroll/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        alert('Bảng lương đã được tạo thành công!');
        setShowCreateRecordForm(false);
        setRecordForm({
          employee_id: '',
          payroll_period_id: selectedPeriod,
          base_salary: '',
          working_days: '26',
          actual_working_days: '26',
          allowances: { transport: '', lunch: '', phone: '' },
          bonuses: { performance: '', holiday: '' },
          other_deductions: { advance: '', union_fee: '' },
          dependents: '0'
        });
        loadRecords();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Có lỗi xảy ra khi tạo bảng lương!');
    }
  };

  const handleGenerateInvoice = async (recordId: string) => {
    if (!confirm('Bạn có chắc chắn muốn tạo hóa đơn cho bảng lương này?')) {
      return;
    }

    try {
      const response = await fetch('/api/payroll/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payroll_record_id: recordId }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Hóa đơn lương đã được tạo thành công!');
        loadRecords(); // Refresh to show invoice link
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Có lỗi xảy ra khi tạo hóa đơn!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const renderPeriodsTab = () => (
    <div className="space-y-3">
      {/* Filter Controls with Add Button */}
      <div className="bg-white rounded-lg shadow-md p-3">
        <div className="flex justify-between items-center">
          <div className="flex-1"></div>
          <button
            onClick={() => setShowCreatePeriodForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Tạo kỳ lương mới</span>
          </button>
        </div>
      </div>

      {/* Create Period Form */}
      {showCreatePeriodForm && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="text-base font-medium text-gray-900 mb-4">Tạo kỳ lương mới</h4>
          <form onSubmit={handleCreatePeriod} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên kỳ lương
                </label>
                <input
                  type="text"
                  value={periodForm.period_name}
                  onChange={(e) => setPeriodForm({...periodForm, period_name: e.target.value})}
                  placeholder="Tháng 01/2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({...periodForm, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({...periodForm, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Tạo kỳ lương
              </button>
              <button
                type="button"
                onClick={() => setShowCreatePeriodForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Periods List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200">
          <h4 className="text-base font-medium text-gray-900">
            Danh sách kỳ lương ({periods.length})
          </h4>
        </div>

        {isLoadingPeriods ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách kỳ lương...</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V7a2 2 0 012-2h4a2 2 0 012 2v0M8 7v10a2 2 0 002 2h4a2 2 0 002-2V7m-6 0h6" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Chưa có kỳ lương nào</h4>
            <p className="text-gray-600">Tạo kỳ lương đầu tiên để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kỳ lương
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
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
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {period.period_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(period.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedPeriod(period.id);
                          setActiveTab('records');
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Xem bảng lương
                      </button>
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

  const renderRecordsTab = () => (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Bảng lương</h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Chọn kỳ lương</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.period_name}
              </option>
            ))}
          </select>
        </div>
        {selectedPeriod && (
          <button
            onClick={() => {
              setRecordForm({...recordForm, payroll_period_id: selectedPeriod});
              setShowCreateRecordForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Tạo bảng lương</span>
          </button>
        )}
      </div>


      {/* Records List */}
      {selectedPeriod && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">
              Bảng lương ({records.length})
            </h4>
          </div>

          {isLoadingRecords ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải bảng lương...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Chưa có bảng lương nào</h4>
              <p className="text-gray-600">Tạo bảng lương đầu tiên cho kỳ này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nhân viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lương cơ bản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày công
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng thu nhập
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BHXH/BHYT/BHTN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thuế TNCN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thực lĩnh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hóa đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employees?.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.employees?.employee_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(record.base_salary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.actual_working_days}/{record.working_days}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(record.gross_salary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600">
                          -{formatCurrency(record.bhxh_employee + record.bhyt_employee + record.bhtn_employee)}
                        </div>
                        <div className="text-xs text-gray-500">
                          BHXH: {formatCurrency(record.bhxh_employee)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600">
                          -{formatCurrency(record.personal_income_tax)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {formatCurrency(record.net_salary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.invoice_id ? (
                          <div className="text-sm text-green-600">
                            ✅ Đã tạo
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Chưa tạo
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!record.invoice_id && (
                          <button
                            onClick={() => handleGenerateInvoice(record.id)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Tạo hóa đơn
                          </button>
                        )}
                        {record.invoice_id && (
                          <a
                            href={`#invoice-${record.invoice_id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Xem hóa đơn
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Báo cáo lương</h3>
        <p className="text-gray-600">Tính năng báo cáo lương sẽ được phát triển trong phiên bản tiếp theo.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('periods')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'periods'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kỳ lương
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bảng lương
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Báo cáo
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'periods' && renderPeriodsTab()}
      {activeTab === 'records' && renderRecordsTab()}
      {activeTab === 'reports' && renderReportsTab()}

      {/* Payroll Modal */}
      <PayrollModal
        isOpen={showCreateRecordForm}
        onClose={() => setShowCreateRecordForm(false)}
        onSubmit={handleCreateRecord}
        recordForm={recordForm}
        setRecordForm={setRecordForm}
        employees={employees}
      />
    </div>
  );
}
