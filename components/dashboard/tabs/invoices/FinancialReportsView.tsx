import React from 'react';
import { formatDate } from '../../shared/utils';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  is_income: boolean;
  invoice_type: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  description: string;
  student?: {
    id: string;
    full_name: string;
  };
  employee?: {
    id: string;
    full_name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
}

interface FinancialReportsViewProps {
  invoices: Invoice[];
  payments: Payment[];
}

export default function FinancialReportsView({ invoices, payments }: FinancialReportsViewProps) {
  // Calculate monthly data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.invoice_date);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyInvoices
    .filter(i => i.is_income && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const monthlyExpense = monthlyInvoices
    .filter(i => !i.is_income && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const monthlyProfit = monthlyIncome - monthlyExpense;

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

  // Calculate by invoice type
  const tuitionIncome = invoices
    .filter(i => i.is_income && i.invoice_type === 'tuition' && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const serviceIncome = invoices
    .filter(i => i.is_income && i.invoice_type === 'standard' && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const payrollExpense = invoices
    .filter(i => !i.is_income && i.invoice_type === 'payroll' && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const operatingExpense = invoices
    .filter(i => !i.is_income && i.invoice_type === 'expense' && i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  // Calculate payment statistics
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const averagePayment = payments.length > 0 ? totalPayments / payments.length : 0;

  // Outstanding invoices analysis
  const overdueInvoices = invoices.filter(i => {
    if (!i.due_date || i.status === 'paid') return false;
    return new Date(i.due_date) < new Date() && i.remaining_amount > 0;
  });

  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.remaining_amount, 0);

  // Monthly names in Vietnamese
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Báo cáo tháng {monthNames[currentMonth]} {currentYear}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📈</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Thu nhập tháng</p>
                <p className="text-lg font-semibold text-green-900">
                  {monthlyIncome.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-green-600">
                  {monthlyInvoices.filter(i => i.is_income).length} hóa đơn
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
                <p className="text-sm font-medium text-red-800">Chi phí tháng</p>
                <p className="text-lg font-semibold text-red-900">
                  {monthlyExpense.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-red-600">
                  {monthlyInvoices.filter(i => !i.is_income).length} hóa đơn
                </p>
              </div>
            </div>
          </div>

          <div className={`${monthlyProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${monthlyProfit >= 0 ? 'bg-blue-500' : 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm">{monthlyProfit >= 0 ? '💰' : '📊'}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${monthlyProfit >= 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                  Lợi nhuận tháng
                </p>
                <p className={`text-lg font-semibold ${monthlyProfit >= 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                  {monthlyProfit.toLocaleString('vi-VN')} ₫
                </p>
                <p className={`text-xs ${monthlyProfit >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                  {monthlyProfit >= 0 ? 'Có lãi' : 'Thua lỗ'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Phân tích thu nhập</h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Học phí</p>
                <p className="text-xs text-gray-600">Tuition fees</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  {tuitionIncome.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-gray-500">
                  {totalIncome > 0 ? ((tuitionIncome / totalIncome) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Dịch vụ khác</p>
                <p className="text-xs text-gray-600">Other services</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-blue-600">
                  {serviceIncome.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-gray-500">
                  {totalIncome > 0 ? ((serviceIncome / totalIncome) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">Tổng thu nhập</p>
                <p className="text-lg font-bold text-green-600">
                  {totalIncome.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Phân tích chi phí</h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Lương nhân viên</p>
                <p className="text-xs text-gray-600">Staff salaries</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-red-600">
                  {payrollExpense.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-gray-500">
                  {totalExpense > 0 ? ((payrollExpense / totalExpense) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Chi phí vận hành</p>
                <p className="text-xs text-gray-600">Operating expenses</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-orange-600">
                  {operatingExpense.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-gray-500">
                  {totalExpense > 0 ? ((operatingExpense / totalExpense) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">Tổng chi phí</p>
                <p className="text-lg font-bold text-red-600">
                  {totalExpense.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Phân tích thanh toán</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            <p className="text-sm text-gray-600">Tổng số thanh toán</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {totalPayments.toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-sm text-gray-600">Tổng tiền đã thu</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {averagePayment.toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-sm text-gray-600">Thanh toán trung bình</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {totalOutstanding.toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-sm text-gray-600">Còn phải thu</p>
          </div>
        </div>
      </div>

      {/* Overdue Analysis */}
      {overdueInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            Hóa đơn quá hạn
          </h4>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-red-800">
                  {overdueInvoices.length} hóa đơn quá hạn thanh toán
                </p>
                <p className="text-xs text-red-600">Cần xử lý ngay</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">
                  {overdueAmount.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-red-500">Tổng nợ quá hạn</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Hóa đơn
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Hạn thanh toán
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Số tiền
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Quá hạn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueInvoices.slice(0, 5).map((invoice) => {
                  const daysOverdue = Math.floor(
                    (new Date().getTime() - new Date(invoice.due_date!).getTime()) / (1000 * 3600 * 24)
                  );
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {invoice.student?.full_name || invoice.employee?.full_name || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatDate(invoice.due_date!)}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-red-600">
                        {invoice.remaining_amount.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-4 py-2 text-sm text-red-600">
                        {daysOverdue} ngày
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {overdueInvoices.length > 5 && (
              <div className="text-center py-2 text-sm text-gray-500">
                Và {overdueInvoices.length - 5} hóa đơn khác...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Chỉ số tài chính chính</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ lợi nhuận</p>
            <p className="text-xl font-bold text-blue-600">
              {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%
            </p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ thu hồi</p>
            <p className="text-xl font-bold text-green-600">
              {(totalIncome + totalExpense) > 0 ? (((totalIncome + totalExpense - totalOutstanding) / (totalIncome + totalExpense)) * 100).toFixed(1) : 0}%
            </p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Hóa đơn trung bình</p>
            <p className="text-xl font-bold text-purple-600">
              {invoices.length > 0 ? ((totalIncome + totalExpense) / invoices.length).toLocaleString('vi-VN') : 0} ₫
            </p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ quá hạn</p>
            <p className="text-xl font-bold text-red-600">
              {invoices.length > 0 ? ((overdueInvoices.length / invoices.length) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
