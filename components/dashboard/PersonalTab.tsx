import React, { useState, useEffect } from 'react';
import { formatDate } from './shared/utils';
import { useAuth } from '../../lib/auth/AuthContext';
import { getCurrentLocation, getLocationStatusMessage } from '../../lib/utils/gps';
import WorkScheduleModal from './employees/WorkScheduleModal';

interface ClockRecord {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in_time: string;
  clock_out_time?: string;
  total_hours?: number;
  status: 'active' | 'completed';
  created_at: string;
  data?: any;
  employees?: {
    id: string;
    full_name: string;
    data?: any;
  };
}

interface Request {
  id: string;
  employee_id: string;
  type: 'leave' | 'permission' | 'sick' | 'other';
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  data?: any;
  employees?: {
    id: string;
    full_name: string;
    data?: any;
  };
  approved_by_employee?: {
    id: string;
    full_name: string;
    data?: any;
  };
}

interface PersonalTabProps {}

const PersonalTab: React.FC<PersonalTabProps> = () => {
  const { user } = useAuth();
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [clockRecords, setClockRecords] = useState<ClockRecord[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeClockRecord, setActiveClockRecord] = useState<ClockRecord | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [showWorkSchedule, setShowWorkSchedule] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    type: 'leave',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '12:20',
    days_count: 0,
    return_date: ''
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get current employee from auth context or find by email
  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      if (!user?.email) return;

      try {
        // Try to find employee by email
        const response = await fetch(`/api/employees?email=${user.email}`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setCurrentEmployee(result.data[0]);
        } else {
          // Fallback: create a mock employee for demo purposes
          setCurrentEmployee({
            id: user.id || 'demo-employee-id',
            full_name: user.user_metadata?.full_name || user.email,
            email: user.email,
            data: user.user_metadata || {}
          });
        }
      } catch (error) {
        console.error('Error fetching current employee:', error);
        // Fallback: create a mock employee for demo purposes
        setCurrentEmployee({
          id: user.id || 'demo-employee-id',
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email,
          data: user.user_metadata || {}
        });
      }
    };

    fetchCurrentEmployee();
  }, [user]);

  useEffect(() => {
    if (currentEmployee) {
      fetchClockRecords();
      fetchRequests();
    }
  }, [currentEmployee]);

  const fetchClockRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clock-records?employee_id=${currentEmployee.id}`);
      const result = await response.json();
      
      if (result.success) {
        setClockRecords(result.data || []);
        setActiveClockRecord(result.data?.find((r: ClockRecord) => r.status === 'active') || null);
      } else {
        console.error('Failed to fetch clock records:', result.message);
        setClockRecords([]);
      }
    } catch (error) {
      console.error('Error fetching clock records:', error);
      setClockRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/employee-requests?employee_id=${currentEmployee.id}`);
      const result = await response.json();
      
      if (result.success) {
        setRequests(result.data || []);
      } else {
        console.error('Failed to fetch requests:', result.message);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    }
  };

  const handleClockIn = async () => {
    setIsGettingLocation(true);
    setLocationStatus('Đang lấy vị trí GPS...');

    try {
      // Get current location
      const location = await getCurrentLocation();
      setLocationStatus('Đã lấy vị trí GPS thành công');

      const response = await fetch('/api/clock-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: currentEmployee.id,
          type: 'clock_in',
          latitude: location.latitude,
          longitude: location.longitude
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLocationStatus('');
        alert(result.message);
        fetchClockRecords(); // Refresh the records
      } else {
        setLocationStatus(`❌ ${result.message}`);
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      if (error instanceof Error) {
        setLocationStatus(`❌ ${error.message}`);
        alert(`Lỗi vị trí: ${error.message}`);
      } else {
        setLocationStatus('❌ Không thể lấy vị trí GPS');
        alert('Có lỗi xảy ra khi chấm công vào!');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeClockRecord) return;
    
    setIsGettingLocation(true);
    setLocationStatus('Đang lấy vị trí GPS...');

    try {
      // Get current location
      const location = await getCurrentLocation();
      setLocationStatus('Đã lấy vị trí GPS thành công');

      const response = await fetch('/api/clock-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: currentEmployee.id,
          type: 'clock_out',
          latitude: location.latitude,
          longitude: location.longitude
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLocationStatus('');
        alert(result.message);
        fetchClockRecords(); // Refresh the records
      } else {
        setLocationStatus(`❌ ${result.message}`);
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      if (error instanceof Error) {
        setLocationStatus(`❌ ${error.message}`);
        alert(`Lỗi vị trí: ${error.message}`);
      } else {
        setLocationStatus('❌ Không thể lấy vị trí GPS');
        alert('Có lỗi xảy ra khi chấm công ra!');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleRequestFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequestFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate end date and return date when start date or days count changes
    if (name === 'start_date' || name === 'days_count') {
      const startDate = name === 'start_date' ? value : requestFormData.start_date;
      const daysCount = name === 'days_count' ? parseInt(value) || 0 : requestFormData.days_count;
      
      if (startDate && daysCount > 0) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + daysCount - 1);
        
        const returnDate = new Date(end);
        returnDate.setDate(end.getDate() + 1);
        
        setRequestFormData(prev => ({
          ...prev,
          end_date: end.toISOString().split('T')[0],
          return_date: returnDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);

    try {
      const response = await fetch('/api/employee-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: currentEmployee.id,
          type: requestFormData.type,
          title: requestFormData.title || `${getRequestTypeLabel(requestFormData.type)} - ${requestFormData.start_date}`,
          description: requestFormData.description,
          start_date: requestFormData.start_date,
          end_date: requestFormData.end_date || requestFormData.start_date,
          data: {
            start_time: requestFormData.start_time,
            days_count: requestFormData.days_count,
            return_date: requestFormData.return_date
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Yêu cầu đã được gửi thành công!');
        setShowRequestForm(false);
        setRequestFormData({
          type: 'leave',
          title: '',
          description: '',
          start_date: '',
          end_date: '',
          start_time: '12:20',
          days_count: 0,
          return_date: ''
        });
        fetchRequests(); // Refresh the requests list
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Có lỗi xảy ra khi gửi yêu cầu!');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
      active: { label: 'Đang làm việc', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Đã hoàn thành', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getRequestTypeLabel = (type: string) => {
    const typeLabels = {
      leave: 'Nghỉ phép',
      permission: 'Xin phép',
      sick: 'Nghỉ ốm',
      other: 'Khác'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cá nhân</h2>
            <p className="text-gray-600 mt-1">Quản lý chấm công và yêu cầu cá nhân</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowWorkSchedule(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📅</span>
              Lịch làm việc
            </button>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-blue-600">
                {currentTime.toLocaleTimeString('vi-VN')}
              </div>
              <div className="text-sm text-gray-600">
                {currentTime.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clock In/Out Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Chấm công</h3>
          {activeClockRecord && (
            <div className="text-sm text-gray-600">
              Đã vào lúc: {formatTime(activeClockRecord.clock_in_time)}
            </div>
          )}
        </div>

        {/* Location Status */}
        {locationStatus && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="text-sm text-blue-800">
                📍 {locationStatus}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {!activeClockRecord ? (
            <button
              onClick={handleClockIn}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🕐</span>
              Chấm công vào
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🕐</span>
              Chấm công ra
            </button>
          )}

          {activeClockRecord && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Đang làm việc
            </div>
          )}
        </div>
      </div>

      {/* Recent Clock Records */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lịch sử chấm công</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : clockRecords.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">🕐</div>
            <p className="text-gray-600">Chưa có bản ghi chấm công nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ vào
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ ra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clockRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.work_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.clock_in_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clock_out_time ? formatTime(record.clock_out_time) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_hours ? `${record.total_hours}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Requests Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Yêu cầu của tôi</h3>
          <button
            onClick={() => setShowRequestForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Tạo yêu cầu mới
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📝</div>
            <p className="text-gray-600">Chưa có yêu cầu nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{request.title}</h4>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {getRequestTypeLabel(request.type)}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                    <div className="text-xs text-gray-500">
                      <div>Từ: {formatDate(request.start_date)}</div>
                      {request.end_date && <div>Đến: {formatDate(request.end_date)}</div>}
                      <div>Tạo lúc: {formatDateTime(request.created_at)}</div>
                      {request.approved_at && (
                        <div>Duyệt lúc: {formatDateTime(request.approved_at)} bởi {request.approved_by}</div>
                      )}
                      {request.rejection_reason && (
                        <div className="text-red-600 mt-1">Lý do từ chối: {request.rejection_reason}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitRequest} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Tạo yêu cầu mới</h3>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Form Content - 2 Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Request Type */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Mục
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={requestFormData.type}
                      onChange={handleRequestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="leave">Xin nghỉ phép</option>
                      <option value="permission">Xin phép</option>
                      <option value="sick">Nghỉ ốm</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={requestFormData.start_time}
                      onChange={handleRequestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Proposed Date */}
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày đề xuất
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={requestFormData.start_date}
                      onChange={handleRequestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Number of Days */}
                  <div>
                    <label htmlFor="days_count" className="block text-sm font-medium text-gray-700 mb-2">
                      Số ngày nghỉ
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const newCount = Math.max(0, requestFormData.days_count - 1);
                          setRequestFormData(prev => ({ ...prev, days_count: newCount }));
                          // Trigger the auto-calculation
                          const event = { target: { name: 'days_count', value: newCount.toString() } } as any;
                          handleRequestFormChange(event);
                        }}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-l-md border border-gray-300"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        id="days_count"
                        name="days_count"
                        value={requestFormData.days_count}
                        onChange={handleRequestFormChange}
                        min="0"
                        className="w-20 px-3 py-2 text-center border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newCount = requestFormData.days_count + 1;
                          setRequestFormData(prev => ({ ...prev, days_count: newCount }));
                          // Trigger the auto-calculation
                          const event = { target: { name: 'days_count', value: newCount.toString() } } as any;
                          handleRequestFormChange(event);
                        }}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-r-md border border-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label htmlFor="start_date_display" className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      id="start_date_display"
                      name="start_date"
                      value={requestFormData.start_date}
                      onChange={handleRequestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Content/Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Nội dung
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={requestFormData.description}
                      onChange={handleRequestFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập lý do xin nghỉ phép..."
                      required
                    />
                  </div>

                  {/* Reason/Details */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Lý do
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={requestFormData.title}
                      onChange={handleRequestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập lý do chi tiết..."
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={requestFormData.end_date}
                      onChange={handleRequestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Return Date */}
                  <div>
                    <label htmlFor="return_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày đi làm lại
                    </label>
                    <input
                      type="date"
                      id="return_date"
                      name="return_date"
                      value={requestFormData.return_date}
                      onChange={handleRequestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className={`px-6 py-2 text-white rounded-lg transition-colors ${
                    isSubmittingRequest
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmittingRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Schedule Modal */}
      <WorkScheduleModal
        isOpen={showWorkSchedule}
        onClose={() => setShowWorkSchedule(false)}
        employee={currentEmployee}
        canEdit={false} // Employees can only view their work schedule
      />
    </div>
  );
};

export default PersonalTab;
