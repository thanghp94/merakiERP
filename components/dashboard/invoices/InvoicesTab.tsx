import React, { useState, useEffect } from 'react';
import { formatDate, getStatusBadge } from '../shared/utils';
import InvoiceModal from './InvoiceModal';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  is_income: boolean;
  invoice_type: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  description: string;
  notes?: string;
  student?: {
    id: string;
    full_name: string;
  };
  employee?: {
    id: string;
    full_name: string;
  };
  facility?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    class_name: string;
  };
  invoice_items?: Array<{
    id: string;
    item_name: string;
    item_description: string;
    category: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
  created_at: string;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  invoice?: {
    invoice_number: string;
    student?: { full_name: string };
    employee?: { full_name: string };
  };
}

export default function InvoicesTab() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'reports'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Load invoices and payments
  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') {
      loadPayments();
    }
  }, [activeTab]);

  const loadInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const response = await fetch('/api/invoices');
      const result = await response.json();
      if (result.success) {
        setInvoices(result.data || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const response = await fetch('/api/finances?type=payments');
      const result = await response.json();
      if (result.success) {
        setPayments(result.data || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
      const method = editingInvoice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(editingInvoice ? 'Hóa đơn đã được cập nhật thành công!' : 'Hóa đơn đã được tạo thành công!');
        setShowAddForm(false);
        setEditingInvoice(null);
        loadInvoices(); // Refresh the invoices list
      } else {
        throw new Error(result.message || 'Failed to save invoice');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert(`Lỗi khi lưu hóa đơn: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowAddForm(true);
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await loadInvoices();
        alert('Xóa hóa đơn thành công!');
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Có lỗi xảy ra khi xóa hóa đơn!');
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesType = filterType === 'all' || 
      (filterType === 'income' && invoice.is_income) ||
      (filterType === 'expense' && !invoice.is_income);
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    const matchesSearch = searchTerm === '' || 
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.class?.class_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalIncome = invoices
    .filter(i => i.is_income && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const totalExpense = invoices
    .filter(i => !i.is_income && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const totalOutstanding = invoices
    .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + i.remaining_amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Get invoice type label in Vietnamese
  const getInvoiceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'tuition': 'Học phí',
      'standard': 'Dịch vụ',
      'payroll': 'Lương',
      'expense': 'Chi phí'
    };
    return labels[type] || type;
  };

  const renderInvoicesTab = () => (
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

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⏳</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-800">Chưa thanh toán</p>
              <p className="text-lg font-semibold text-orange-900">
                {totalOutstanding.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </div>

        <div className={`${netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${netProfit >= 0 ? 'bg-blue-500' : 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm">{netProfit >= 0 ? '💰' : '📊'}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                Lợi nhuận ròng
              </p>
              <p className={`text-lg font-semibold ${netProfit >= 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                {netProfit.toLocaleString('vi-VN')} ₫
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
              placeholder="Tìm theo số hóa đơn, mô tả, tên..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại hóa đơn
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="income">Hóa đơn thu</option>
              <option value="expense">Hóa đơn chi</option>
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
              <option value="draft">Nháp</option>
              <option value="sent">Đã gửi</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="paid">Đã thanh toán</option>
              <option value="overdue">Quá hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setEditingInvoice(null);
                setShowAddForm(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2"
            >
              <span>➕</span>
              <span>Tạo hóa đơn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Danh sách hóa đơn ({filteredInvoices.length})
          </h3>
        </div>

        {isLoadingInvoices ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách hóa đơn...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Không có hóa đơn nào</h4>
            <p className="text-gray-600">Không tìm thấy hóa đơn nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số hóa đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày/Hạn thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại/Liên quan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã thanh toán
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
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                      <div className={`text-xs ${invoice.is_income ? 'text-green-600' : 'text-red-600'}`}>
                        {getInvoiceTypeLabel(invoice.invoice_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(invoice.invoice_date)}
                      </div>
                      {invoice.due_date && (
                        <div className="text-xs text-gray-500">
                          Hạn: {formatDate(invoice.due_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {invoice.description}
                      </div>
                      {invoice.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {invoice.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.student?.full_name || 
                         invoice.employee?.full_name || 
                         invoice.facility?.name ||
                         invoice.class?.class_name || 
                         '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        invoice.is_income ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {invoice.total_amount.toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.paid_amount.toLocaleString('vi-VN')} ₫
                      </div>
                      {invoice.remaining_amount > 0 && (
                        <div className="text-xs text-orange-600">
                          Còn: {invoice.remaining_amount.toLocaleString('vi-VN')} ₫
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
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

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Lịch sử thanh toán ({payments.length})
          </h3>
        </div>

        {isLoadingPayments ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải lịch sử thanh toán...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Không có thanh toán nào</h4>
            <p className="text-gray-600">Chưa có thanh toán nào được ghi nhận.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hóa đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phương thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã tham chiếu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.invoice?.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.invoice?.student?.full_name || 
                         payment.invoice?.employee?.full_name || 
                         '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {payment.amount.toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.reference_number || '-'}
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
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Hóa đơn</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hóa đơn
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thanh toán
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
      {activeTab === 'invoices' && renderInvoicesTab()}
      {activeTab === 'payments' && renderPaymentsTab()}
      {activeTab === 'reports' && renderReportsTab()}

      {/* Add/Edit Invoice Modal */}
      <InvoiceModal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingInvoice(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingInvoice}
      />
    </div>
  );
}
