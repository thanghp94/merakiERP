import React from 'react';
import { formatDate, getStatusBadge } from '../../../shared/utils';
import InvoiceEntityDisplay from './InvoiceEntityDisplay';

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

interface InvoiceTableRowProps {
  invoice: Invoice;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export default function InvoiceTableRow({
  invoice,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice
}: InvoiceTableRowProps) {
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

  return (
    <tr className="hover:bg-gray-50">
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
        <InvoiceEntityDisplay invoice={invoice} />
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
  );
}
