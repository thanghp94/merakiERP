import React, { useState, useEffect } from 'react';
import { formatDate } from '../../../shared/utils';
import { getCurrentLocation } from '../../../../../lib/utils/gps';

interface AttendanceViewProps {
  employee: any;
}

interface ClockRecord {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in_time: string;
  clock_out_time?: string;
  total_hours?: number;
  status: 'active' | 'completed';
  created_at: string;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ employee }) => {
  const [clockRecords, setClockRecords] = useState<ClockRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeClockRecord, setActiveClockRecord] = useState<ClockRecord | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  useEffect(() => {
    if (employee) {
      fetchClockRecords();
    }
  }, [employee]);

  const fetchClockRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clock-records?employee_id=${employee.id}`);
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

  const handleClockIn = async () => {
    setIsGettingLocation(true);
    setLocationStatus('Đang lấy vị trí GPS...');

    try {
      const location = await getCurrentLocation();
      setLocationStatus('Đã lấy vị trí GPS thành công');

      const response = await fetch('/api/clock-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employee.id,
          type: 'clock_in',
          latitude: location.latitude,
          longitude: location.longitude
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLocationStatus('');
        alert(result.message);
        fetchClockRecords();
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
      const location = await getCurrentLocation();
      setLocationStatus('Đã lấy vị trí GPS thành công');

      const response = await fetch('/api/clock-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employee.id,
          type: 'clock_out',
          latitude: location.latitude,
          longitude: location.longitude
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLocationStatus('');
        alert(result.message);
        fetchClockRecords();
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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Đang làm việc', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Đã hoàn thành', className: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    
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
          <h3 className="text-lg font-semibold text-gray-900">Chấm công</h3>
          <p className="text-sm text-gray-600">Chấm công và xem lịch sử điểm danh</p>
        </div>
        {activeClockRecord && (
          <div className="text-sm text-gray-600">
            Đã vào lúc: {formatTime(activeClockRecord.clock_in_time)}
          </div>
        )}
      </div>

      {/* Clock In/Out Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
              disabled={isGettingLocation}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🕐</span>
              {isGettingLocation ? 'Đang xử lý...' : 'Chấm công vào'}
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              disabled={isGettingLocation}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🕐</span>
              {isGettingLocation ? 'Đang xử lý...' : 'Chấm công ra'}
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

      {/* Clock Records History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử chấm công</h4>

        {clockRecords.length === 0 ? (
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
    </div>
  );
};

export default AttendanceView;
