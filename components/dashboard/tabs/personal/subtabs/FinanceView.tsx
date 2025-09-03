import React, { useState, useEffect } from 'react';
import { formatDate } from '../../../shared/utils';

interface FinanceViewProps {
  employee: any;
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
  invoice_id?: string;
  payroll_periods?: {
    id: string;
    period_name: string;
    start_date: string;
    end_date: string;
  };
  invoices?: {
    id: string;
    invoice_number: string;
    status: string;
    total_amount: number;
  };
}

const FinanceView: React.FC<FinanceViewProps> = ({ employee }) => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employee) {
      fetchPayrollData();
    }
  }, [employee]);

  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      // Fetch payroll records for this employee
      const response = await fetch(`/api/payroll/records?employee_id=${employee.id}`);
      const result = await response.json();
      setPayrollRecords(result.success ? result.data || [] : []);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      setPayrollRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
      overdue: { label: 'Quá hạn', className: 'bg-red-100 text-red-800' },
      draft: { label: 'Nháp', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tài chính cá nhân</h3>
          <p className="text-sm text-gray-600">Thông tin lương và các khoản thu chi của bạn</p>
        </div>
      </div>

      {payrollRecords.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có thông tin lương</h3>
          <p className="text-gray-600">Bạn chưa có bảng lương nào được tạo.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Tổng số kỳ lương</h4>
              <p className="text-2xl font-bold text-blue-600">{payrollRecords.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-1">Tổng thực lĩnh</h4>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(payrollRecords.reduce((sum, record) => sum + record.net_salary, 0))}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-900 mb-1">Lương trung bình</h4>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(payrollRecords.reduce((sum, record) => sum + record.net_salary, 0) / payrollRecords.length)}
              </p>
            </div>
          </div>

          {/* Payroll Records List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">
                Lịch sử lương ({payrollRecords.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kỳ lương
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
                      Khấu trừ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thực lĩnh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hóa đơn
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.payroll_periods?.period_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.payroll_periods?.start_date && record.payroll_periods?.end_date && (
                            `${formatDate(record.payroll_periods.start_date)} - ${formatDate(record.payroll_periods.end_date)}`
                          )}
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
                          -{formatCurrency(record.total_deductions)}
                        </div>
                        <div className="text-xs text-gray-500">
                          BHXH: {formatCurrency(record.bhxh_employee + record.bhyt_employee + record.bhtn_employee)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Thuế: {formatCurrency(record.personal_income_tax)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {formatCurrency(record.net_salary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.invoice_id ? (
                          <div className="flex items-center">
                            <span className="text-sm text-green-600 mr-2">✅ Đã tạo</span>
                            {record.invoices && getStatusBadge(record.invoices.status)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Chưa tạo
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
