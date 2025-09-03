import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab } from '@/shared/types';
import { Card } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import { Button, Badge } from '@/components/ui';
import { DataTable, FilterBar, FormModal } from '@/dashboard/shared';
import RequestForm from '@/dashboard/shared/forms/RequestFormSimple';
import { useCurrentEmployee } from '@/lib/hooks/useCurrentEmployee';
import {
  RequestType,
  RequestStatus,
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS
} from '@/dashboard/shared/types';
import { getMainTabs, handleSubTabNavigation } from '@/components/navigation/NavigationConfig';

export default function RequestsPage() {
  const { user, signOut } = useAuth();
  const { employee: currentEmployee, loading: employeeLoading, error: employeeError } = useCurrentEmployee();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('hcns');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    request_type: '',
    search: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Define the hierarchical navigation structure (same as dashboard)
  const mainTabs: MainTab[] = getMainTabs();

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('requests-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('requests-active-main-tab') as MainTabType;

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
      localStorage.setItem('requests-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('requests-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

  // Navigation helper functions
  const handleMainTabClick = (mainTabId: MainTabType) => {
    setActiveMainTab(mainTabId);
    // Set the first subtab as active when switching main tabs
    const mainTab = mainTabs.find(tab => tab.id === mainTabId);
    if (mainTab && mainTab.subtabs.length > 0) {
      setActiveTab(mainTab.subtabs[0].id);
    }
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // For tabs that exist in requests page (requests)
    const requestsTabs = ['requests'];

    if (requestsTabs.includes(subTabId)) {
      setActiveTab(subTabId);
    } else {
      // Use centralized navigation handler for other tabs
      handleSubTabNavigation(subTabId, window.location.pathname);
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Requests functionality
  useEffect(() => {
    fetchRequests();
  }, [filters, currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/employee-requests?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setRequests(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (requestData: any) => {
    try {
      // Transform the data to match the API expectations
      const apiData = {
        employee_id: requestData.created_by_employee_id, // Map created_by_employee_id to employee_id
        status: 'pending',
        priority: 'medium',
        due_date: null, // Can be set based on request type if needed
        data: {
          request_type: requestData.request_type,
          title: requestData.title,
          description: requestData.description,
          ...requestData.request_data // Spread the request-specific data
        }
      };

      const response = await fetch('/api/employee-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        fetchRequests(); // Refresh the list
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error creating request:', error);
      return { success: false, message: 'Lỗi khi tạo yêu cầu' };
    }
  };

  const handleUpdateRequest = async (requestId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/employee-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        fetchRequests(); // Refresh the list
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error updating request:', error);
      return { success: false, message: 'Lỗi khi cập nhật yêu cầu' };
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value === 'all' ? '' : value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      request_type: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (status: RequestStatus) => {
    return (
      <Badge className={REQUEST_STATUS_COLORS[status]}>
        {REQUEST_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRequestSummary = (request: any) => {
    // The API stores request data in the 'data' field
    const requestType = request.data?.request_type;
    const requestData = request.data;

    switch (requestType) {
      case 'nghi_phep':
        return `${formatDate(requestData.from_date || '')} - ${formatDate(requestData.to_date || '')} (${requestData.total_days || 0} ngày)`;
      case 'doi_lich':
        return `${formatDate(requestData.original_date || '')} → ${formatDate(requestData.new_date || '')}`;
      case 'tam_ung':
        return formatCurrency(requestData.amount || 0);
      case 'mua_sam_sua_chua':
        return `${requestData.item_name || ''} - ${formatCurrency(requestData.estimated_cost || 0)}`;
      default:
        return requestData.description || '';
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Tiêu đề',
      render: (value: any, request: any) => (
        <div>
          <div className="font-medium text-gray-900">{request.data?.title || 'Không có tiêu đề'}</div>
          <div className="text-sm text-gray-500">
            {REQUEST_TYPE_LABELS[request.data?.request_type as RequestType] || 'Không xác định'}
          </div>
        </div>
      )
    },
    {
      key: 'summary',
      label: 'Chi tiết',
      render: (value: any, request: any) => (
        <div className="text-sm text-gray-600">
          {getRequestSummary(request)}
        </div>
      )
    },
    {
      key: 'created_by',
      label: 'Người tạo',
      render: (value: any, request: any) => (
        <div>
          <div className="font-medium">{request.employee?.full_name || 'Không xác định'}</div>
          <div className="text-sm text-gray-500">{request.employee?.position || ''}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: any, request: any) => getStatusBadge(request.status)
    },
    {
      key: 'created_at',
      label: 'Ngày tạo',
      render: (value: any, request: any) => formatDate(request.created_at)
    }
  ];

  const actions = [
    {
      label: 'Xem chi tiết',
      onClick: (request: any) => handleViewRequest(request),
      variant: 'secondary' as const
    }
  ];

  const filterConfigs = [
    {
      key: 'status',
      label: 'Trạng thái',
      options: [
        { value: 'all', label: 'Tất cả trạng thái' },
        ...Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({
          value,
          label
        }))
      ]
    },
    {
      key: 'request_type',
      label: 'Loại yêu cầu',
      options: [
        { value: 'all', label: 'Tất cả loại yêu cầu' },
        ...Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({
          value,
          label
        }))
      ]
    }
  ];

  const getStatusCounts = () => {
    const counts = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quản lý yêu cầu</h2>
                <p className="text-gray-600">Quản lý các yêu cầu nghỉ phép, đổi lịch, tạm ứng và mua sắm</p>
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
                <div className="text-sm text-gray-600">Tổng số</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
                <div className="text-sm text-gray-600">Chờ duyệt</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
                <div className="text-sm text-gray-600">Đã duyệt</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                <div className="text-sm text-gray-600">Bị từ chối</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
                <div className="text-sm text-gray-600">Đang thực hiện</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-gray-600">{statusCounts.completed}</div>
                <div className="text-sm text-gray-600">Hoàn thành</div>
              </Card>
            </div>

            {/* Filters */}
            <FilterBar
              filters={filters}
              filterConfigs={filterConfigs}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              actionButton={{
                label: 'Tạo yêu cầu mới',
                icon: '+',
                onClick: () => setShowCreateModal(true),
                variant: 'primary'
              }}
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Requests Table */}
            <DataTable
              data={requests}
              columns={columns}
              actions={actions}
              isLoading={loading}
              emptyState={{
                title: 'Không có yêu cầu nào',
                description: 'Chưa có yêu cầu nào được tạo. Hãy tạo yêu cầu đầu tiên.'
              }}
            />

            {/* Create Request Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Tạo yêu cầu mới</h3>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                      >
                        ×
                      </button>
                    </div>
                    {employeeError && (
                      <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
                        <strong>Cảnh báo:</strong> {employeeError}
                        <br />
                        <small>Vui lòng liên hệ quản trị viên để tạo hồ sơ nhân viên.</small>
                      </div>
                    )}

                    <RequestForm
                      onSubmit={handleCreateRequest}
                      onCancel={() => setShowCreateModal(false)}
                      employees={[]}
                      currentUserId={currentEmployee?.id}
                    />
                  </div>
                </div>
              </div>
            )}

            {showDetailModal && selectedRequest && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
                  <h3 className="text-lg font-semibold mb-4">Chi tiết yêu cầu</h3>
                  <div className="space-y-4">
                    <div>
                      <strong>Tiêu đề:</strong> {selectedRequest.data?.title || 'Không có tiêu đề'}
                    </div>
                    <div>
                      <strong>Loại:</strong> {REQUEST_TYPE_LABELS[selectedRequest.data?.request_type as RequestType] || 'Không xác định'}
                    </div>
                    <div>
                      <strong>Trạng thái:</strong> {getStatusBadge(selectedRequest.status)}
                    </div>
                    <div>
                      <strong>Người tạo:</strong> {selectedRequest.employee?.full_name || 'Không xác định'}
                    </div>
                    <div>
                      <strong>Mô tả:</strong> {selectedRequest.data?.description || 'Không có mô tả'}
                    </div>
                    <div>
                      <strong>Chi tiết:</strong> {getRequestSummary(selectedRequest)}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setShowDetailModal(false)}>
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  if (loading && requests.length === 0) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Quản lý Yêu cầu - MerakiERP</title>
        <meta name="description" content="Quản lý các yêu cầu nghỉ phép, đổi lịch, tạm ứng và mua sắm" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 flex">
        {/* Sidebar */}
        <Sidebar
          mainTabs={mainTabs}
          activeMainTab={activeMainTab}
          activeTab={activeTab}
          onMainTabClick={handleMainTabClick}
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
              MerakiERP - Yêu cầu
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
    </ProtectedRoute>
  );
}
