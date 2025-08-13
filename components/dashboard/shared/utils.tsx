import React from 'react';

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { label: 'Đang hoạt động', className: 'bg-green-100 text-green-800' },
    inactive: { label: 'Không hoạt động', className: 'bg-gray-100 text-gray-800' },
    completed: { label: 'Đã hoàn thành', className: 'bg-blue-100 text-blue-800' },
    cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

export const getNextSuggestedUnit = (currentUnit: string): string => {
  if (!currentUnit) return 'U1';
  
  const match = currentUnit.match(/U(\d+)/);
  if (match) {
    const currentNumber = parseInt(match[1]);
    const nextNumber = currentNumber + 1;
    return nextNumber <= 30 ? `U${nextNumber}` : currentUnit;
  }
  
  return 'U1';
};

export const tabs = [
  { id: 'personal', label: 'Cá nhân', icon: '👤' },
  { id: 'facilities', label: 'Cơ sở', icon: '🏢' },
  { id: 'classes', label: 'Lớp học', icon: '📚' },
  { id: 'employees', label: 'Nhân viên', icon: '👥' },
  { id: 'students', label: 'Học sinh', icon: '👤' },
  { id: 'admissions', label: 'Tuyển sinh', icon: '🎓' },
  { id: 'sessions', label: 'Buổi học', icon: '🎯' },
  { id: 'attendance', label: 'Điểm danh', icon: '✅' },
  { id: 'finances', label: 'Tài chính', icon: '💰' },
  { id: 'payroll', label: 'Lương', icon: '💵' },
  { id: 'tasks', label: 'Bài tập', icon: '📋' },
  { id: 'schedule', label: 'Lịch học', icon: '📅' },
  { id: 'api-test', label: 'Test API', icon: '🔧' }
];
