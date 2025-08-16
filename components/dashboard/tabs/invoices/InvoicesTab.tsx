import React, { useState, useEffect } from 'react';
import InvoiceModal from './InvoiceModal';
import InvoiceDetailDrawer from './InvoiceDetailDrawer';
import InvoicesListView from './InvoicesListView';
import PaymentsListView from './PaymentsListView';
import FinancialReportsView from './FinancialReportsView';

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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

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
      const response = await fetch('/api/payments');
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
        loadInvoices();
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

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  const handlePaymentConfirmed = () => {
    loadInvoices();
    if (activeTab === 'payments') {
      loadPayments();
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

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'search') {
      setSearchTerm(value);
    } else if (key === 'type') {
      setFilterType(value as any);
    } else if (key === 'status') {
      setFilterStatus(value as any);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
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
      {activeTab === 'invoices' && (
        <InvoicesListView
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          isLoading={isLoadingInvoices}
          searchTerm={searchTerm}
          filterType={filterType}
          filterStatus={filterStatus}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onAddInvoice={handleAddInvoice}
          onViewInvoice={handleViewInvoice}
          onEditInvoice={handleEdit}
          onDeleteInvoice={handleDelete}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsListView
          payments={payments}
          isLoading={isLoadingPayments}
        />
      )}

      {activeTab === 'reports' && (
        <FinancialReportsView
          invoices={invoices}
          payments={payments}
        />
      )}

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

      {/* Invoice Detail Drawer */}
      <InvoiceDetailDrawer
        isOpen={showInvoiceDetail}
        onClose={() => {
          setShowInvoiceDetail(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
}
