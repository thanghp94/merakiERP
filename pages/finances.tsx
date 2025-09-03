import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab } from '@/shared/types';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import InvoiceModal from '@/dashboard/tabs/invoices/InvoiceModal';
import InvoiceDetailDrawer from '@/dashboard/tabs/invoices/InvoiceDetailDrawer';
import InvoicesListView from '@/dashboard/tabs/invoices/InvoicesListView';
import PaymentsListView from '@/dashboard/tabs/invoices/PaymentsListView';
import FinancialReportsView from '@/dashboard/tabs/invoices/FinancialReportsView';
import { getMainTabs, handleSubTabNavigation, handleMainTabClick } from '@/components/navigation/NavigationConfig';

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

export default function FinancesPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState<TabType>('finances');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('taichinh');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Finances state
  const [activeFinanceTab, setActiveFinanceTab] = useState<'invoices' | 'payments' | 'reports'>('invoices');
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

  // Define the hierarchical navigation structure (same as dashboard)
  const mainTabs: MainTab[] = getMainTabs();

  // Handle query parameter for pre-selected tab
  useEffect(() => {
    if (tab && typeof tab === 'string') {
      setActiveTab(tab as TabType);
      // Also set the appropriate main tab based on the subtab
      const mainTabsData = getMainTabs();
      for (const mainTab of mainTabsData) {
        if (mainTab.subtabs.some(sub => sub.id === tab)) {
          setActiveMainTab(mainTab.id);
          break;
        }
      }
    }
  }, [tab]);

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('finances-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('finances-active-main-tab') as MainTabType;

      if (savedActiveTab) {
        setActiveTab(savedActiveTab);
      }
      if (savedActiveMainTab) {
        setActiveMainTab(savedActiveMainTab);
      }
    }
  }, []);

  // Save tab state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finances-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finances-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

  // Load invoices and payments
  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (activeFinanceTab === 'payments') {
      loadPayments();
    }
  }, [activeFinanceTab]);

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
    if (activeFinanceTab === 'payments') {
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

  // Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // For tabs that exist in finances page (finances)
    const financesTabs = ['finances'];

    if (financesTabs.includes(subTabId)) {
      setActiveTab(subTabId);
    } else {
      // Use centralized navigation handler for other tabs
      handleSubTabNavigation(subTabId, window.location.pathname);
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'finances':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quản lý Tài chính</h2>
                <p className="text-gray-600">Quản lý hóa đơn, thanh toán và báo cáo tài chính</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveFinanceTab('invoices')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeFinanceTab === 'invoices'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Hóa đơn
                </button>
                <button
                  onClick={() => setActiveFinanceTab('payments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeFinanceTab === 'payments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Thanh toán
                </button>
                <button
                  onClick={() => setActiveFinanceTab('reports')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeFinanceTab === 'reports'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Báo cáo
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeFinanceTab === 'invoices' && (
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

            {activeFinanceTab === 'payments' && (
              <PaymentsListView
                payments={payments}
                isLoading={isLoadingPayments}
              />
            )}

            {activeFinanceTab === 'reports' && (
              <FinancialReportsView
                invoices={invoices}
                payments={payments}
              />
            )}
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chức năng đang phát triển</h3>
            <p className="text-gray-500 mb-4">Chức năng này sẽ được phát triển trong tương lai.</p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-500 transition-colors"
            >
              Quay lại Dashboard
            </a>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Quản lý Tài chính - MerakiERP</title>
        <meta name="description" content="Quản lý hóa đơn, thanh toán và báo cáo tài chính" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 flex">
        {/* Sidebar */}
        <Sidebar
          mainTabs={mainTabs}
          activeMainTab={activeMainTab}
          activeTab={activeTab}
          onMainTabClick={handleMainTabClickLocal}
          onSubTabClick={handleSubTabClick}
          isMobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={handleMobileMenuClose}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-teal-500 bg-clip-text text-transparent">
              MerakiERP - Tài chính
            </h1>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6">
            <Card className="h-full overflow-hidden shadow-xl" shadow="lg" padding="sm">
              {renderTabContent()}
            </Card>
          </main>
        </div>
      </div>

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
    </ProtectedRoute>
  );
}
