import React, { useState, useEffect } from 'react';
import { formatDate, getStatusBadge } from './utils';
import FinanceFormNew from './FinanceFormNew';

interface FinanceItem {
  id: string;
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface Finance {
  id: string;
  student_id?: string;
  employee_id?: string;
  facility_id?: string;
  amount: number;
  transaction_type: string;
  category: string;
  payment_method: string;
  reference_number?: string;
  is_income: boolean;
  transaction_date: string;
  due_date?: string;
  status: string;
  description?: string;
  notes?: string;
  students?: { full_name: string };
  employees?: { full_name: string };
  facilities?: { name: string };
  finance_items?: FinanceItem[];
  created_at: string;
}

interface PaymentSchedule {
  id: string;
  student_id: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: string;
  students?: { full_name: string };
}

export default function FinancesTabNew() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'schedules' | 'reports'>('transactions');
  const [finances, setFinances] = useState<Finance[]>([]);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [isLoadingFinances, setIsLoadingFinances] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Load finances and payment schedules
  useEffect(() => {
    loadFinances();
  }, []);

  useEffect(() => {
    if (activeTab === 'schedules') {
      loadPaymentSchedules();
    }
  }, [activeTab]);

  const loadFinances = async () => {
    setIsLoadingFinances(true);
    try {
      const response = await fetch('/api/finances/enhanced');
      const result = await response.json();
      if (result.success) {
        setFinances(result.data || []);
      }
    } catch (error) {
      console.error('Error loading finances:', error);
    } finally {
      setIsLoadingFinances(false);
    }
  };

  const loadPaymentSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const response = await fetch('/api/payment-schedules');
      const result = await response.json();
      if (result.success) {
        setPaymentSchedules(result.data || []);
      }
    } catch (error) {
      console.error('Error loading payment schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/finances/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Giao dịch đã được lưu thành công!');
        setShowAddForm(false);
        loadFinances(); // Refresh the finances list
      } else {
        throw new Error(result.message || 'Failed to save transaction');
      }
    } catch (error) {
      console.error('Error saving finance transaction:', error);
      alert(`Lỗi khi lưu giao dịch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Filter finances
  const filteredFinances = finances.filter(finance => {
    const matchesType = filterType === 'all' || 
      (filterType === 'income' && finance.is_income) ||
      (filterType === 'expense' && !finance.is_income);
    
    const matchesStatus = filterStatus === 'all' || finance.status === filterStatus;
    
    const matchesSearch = searchTerm === '' || 
      finance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finance.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finance.employees?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finance.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalIncome = finances
    .filter(f => f.is_income && f.status === 'completed')
    .reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0);

  const totalExpense = finances
    .filter(f => !f.is_income && f.status === 'completed')
    .reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0);

  const netProfit = totalIncome - totalExpense;

  // Get category label in Vietnamese
  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'tuition_fee': 'Học phí',
      'registration_fee': 'Phí đăng ký',
      'material_fee': 'Phí tài liệu',
      'exam_fee': 'Phí thi',
      'private_lesson_fee': 'Phí học riêng',
      'summer_course_fee': 'Phí khóa hè',
      'late_fee': 'Phí trễ hạn',
      'other_income': 'Thu nhập khác',
      'staff_salary': 'Lương nhân viên',
      'teacher_bonus': 'Thưởng giáo viên',
      'facility_rent': 'Tiền thuê mặt bằng',
      'utilities': 'Tiện ích',
      'equipment': 'Thiết bị',
      'marketing': 'Marketing',
      'maintenance': 'Bảo trì',
      'office_supplies': 'Văn phòng phẩm',
      'transportation': 'Giao thông',
      'insurance': 'Bảo hiểm',
      'training': 'Đào tạo',
      'other_expense': 'Chi phí khác'
    };
    return labels[category] || category;
  };

  // Get payment method label in Vietnamese
  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'cash': 'Tiền mặt',
      'bank_transfer': 'Chuyển khoản',
      'credit_card': 'Thẻ tín dụng',
      'debit_card': 'Thẻ ghi nợ',
      'online_payment': 'Thanh toán online',
      'mobile_payment': 'Thanh toán di động',
      'check': 'Séc'
    };
    return labels[method] || method;
  };

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📈</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Tổng Thu</p>
              <p className="text-lg font-semibold text-green-900">
                {totalIncome.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📉</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Tổng Chi</p>
              <p className="text-lg font-semibold text-red-900">
                {totalExpense.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </div>

        <div className={`${netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${netProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500'} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm">{netProfit >= 0 ? '💰' : '⚠️'}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                Lợi nhuận ròng
              </p>
              <p className={`text-lg font-semibold ${netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                {netProfit.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">Tổng giao dịch</p>
              <p className="text-lg font-semibold text-gray-900">
                {finances.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mô tả, mã tham chiếu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại giao dịch
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="income">Thu nhập</option>
              <option value="expense">Chi phí</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="completed">Hoàn thành</option>
              <option value="pending">Chờ xử lý</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2"
            >
              <span>➕</span>
              <span>Thêm giao dịch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Danh sách giao dịch ({filteredFinances.length})
          </h3>
        </div>

        {isLoadingFinances ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách giao dịch...</p>
          </div>
        ) : filteredFinances.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Không có giao dịch nào</h4>
            <p className="text-gray-600">Không tìm thấy giao dịch nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày/Mã tham chiếu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên quan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
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
                {filteredFinances.map((finance) => (
                  <tr key={finance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(finance.transaction_date)}
                      </div>
                      {finance.reference_number && (
                        <div className="text-xs text-gray-500">
                          {finance.reference_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {finance.description}
                      </div>
                      {finance.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {finance.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        finance.is_income 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getCategoryLabel(finance.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {finance.students?.full_name || 
                         finance.employees?.full_name || 
                         finance.facilities?.name || 
                         '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        finance.is_income ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {finance.is_income ? '+' : '-'}{parseFloat(finance.amount.toString()).toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPaymentMethodLabel(finance.payment_method)}
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
  );

  const renderSchedulesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Lịch thanh toán ({paymentSchedules.length})
          </h3>
        </div>

        {isLoadingSchedules ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải lịch thanh toán...</p>
          </div>
        ) : paymentSchedules.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4m4-4h8m-4-4v8m-4 4h8" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Không có lịch thanh toán nào</h4>
            <p className="text-gray-600">Chưa có lịch thanh toán nào được tạo.</p>
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
                    Tổng số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Còn lại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạn thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiến độ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentSchedules.map((schedule) => {
                  const progress = (schedule.paid_amount / schedule.total_amount) * 100;
                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.students?.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {schedule.total_amount.toLocaleString('vi-VN')} ₫
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {schedule.paid_amount.toLocaleString('vi-VN')} ₫
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">
                          {schedule.remaining_amount.toLocaleString('vi-VN')} ₫
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(schedule.due_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(schedule.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Báo cáo tài chính</h3>
        <p className="text-gray-600">Tính năng báo cáo sẽ được phát triển trong phiên bản tiếp theo.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Tài chính</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Giao dịch
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lịch thanh toán
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
      {activeTab === 'transactions' && renderTransactionsTab()}
      {activeTab === 'schedules' && renderSchedulesTab()}
      {activeTab === 'reports' && renderReportsTab()}

      {/* Add Finance Form Modal */}
      {showAddForm && (
        <FinanceFormNew
          onSubmit={handleFormSubmit}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
