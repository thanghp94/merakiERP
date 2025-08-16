import React from 'react';
import { formatDate, getStatusBadge } from '../../shared/utils';
import { FilterBar, FilterConfig } from '../../shared';

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

interface InvoicesListViewProps {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  isLoading: boolean;
  searchTerm: string;
  filterType: 'all' | 'income' | 'expense';
  filterStatus: 'all' | 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onAddInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export default function InvoicesListView({
  invoices,
  filteredInvoices,
  isLoading,
  searchTerm,
  filterType,
  filterStatus,
  onFilterChange,
  onClearFilters,
  onAddInvoice,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice
}: InvoicesListViewProps) {
  // Calculate totals - include paid and partial invoices
  const totalIncome = invoices
    .filter(i => i.is_income && ['paid', 'partial'].includes(i.status))
    .reduce((sum, i) => sum + i.paid_amount, 0);

  const totalExpense = invoices
    .filter(i => !i.is_income && ['paid', 'partial'].includes(i.status))
    .reduce((sum, i) => sum + i.paid_amount, 0);

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

  // Filter configuration for FilterBar
  const getFilterConfig = (): FilterConfig[] => {
    return [
      {
        key: 'search',
        label: 'Tìm kiếm',
        options: []
      },
      {
        key: 'type',
        label: 'Loại hóa đơn',
        options: [
          { value: 'all', label: 'Tất cả' },
          { value: 'income', label: 'Hóa đơn thu' },
          { value: 'expense', label: 'Hóa đơn chi' }
        ]
      },
      {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { value: 'all', label: 'Tất cả' },
          { value: 'draft', label: 'Nháp' },
          { value: 'sent', label: 'Đã gửi' },
          { value: 'partial', label: 'Thanh toán một phần' },
          { value: 'paid', label: 'Đã thanh toán' },
          { value: 'overdue', label: 'Quá hạn' },
          { value: 'cancelled', label: 'Đã hủy' }
        ]
      }
    ];
  };

  return (
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

      {/* Filter Bar */}
      <FilterBar
        filters={{
          search: searchTerm,
          type: filterType,
          status: filterStatus
        }}
        filterConfigs={getFilterConfig()}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        actionButton={{
          label: 'Tạo hóa đơn',
          icon: '➕',
          onClick: onAddInvoice,
          variant: 'primary'
        }}
        isLoading={isLoading}
      />

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Danh sách hóa đơn ({filteredInvoices.length})
          </h3>
        </div>

        {isLoading ? (
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
                          onClick={() => onViewInvoice(invoice)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => onEditInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => onDeleteInvoice(invoice.id)}
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
}
