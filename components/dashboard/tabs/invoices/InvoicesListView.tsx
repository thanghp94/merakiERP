import React from 'react';
import { FilterBar, FilterConfig } from '../../shared';
import { InvoiceSummaryCards, InvoiceTable } from './listview';

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
      <InvoiceSummaryCards invoices={invoices} />

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

        <InvoiceTable
          filteredInvoices={filteredInvoices}
          isLoading={isLoading}
          onViewInvoice={onViewInvoice}
          onEditInvoice={onEditInvoice}
          onDeleteInvoice={onDeleteInvoice}
        />
      </div>
    </div>
  );
}
