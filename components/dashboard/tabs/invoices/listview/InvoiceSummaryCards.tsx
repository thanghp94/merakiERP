import React from 'react';

interface Invoice {
  is_income: boolean;
  status: string;
  paid_amount: number;
  remaining_amount: number;
}

interface InvoiceSummaryCardsProps {
  invoices: Invoice[];
}

export default function InvoiceSummaryCards({ invoices }: InvoiceSummaryCardsProps) {
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

  return (
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
  );
}
