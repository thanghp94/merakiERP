import React, { useState } from 'react';
import EmployeeForm from './EmployeeForm';
import WorkScheduleModal from './WorkScheduleModal';
import { Employee } from '../shared/types';
import { formatDate, getStatusBadge } from '../shared/utils';

interface EmployeesTabProps {
  showEmployeeForm: boolean;
  setShowEmployeeForm: (show: boolean) => void;
  employees: Employee[];
  isLoadingEmployees: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function EmployeesTab({
  showEmployeeForm,
  setShowEmployeeForm,
  employees,
  isLoadingEmployees,
  handleFormSubmit
}: EmployeesTabProps) {
  const [workScheduleModal, setWorkScheduleModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null
  });

  const handleOpenWorkSchedule = (employee: Employee) => {
    setWorkScheduleModal({
      isOpen: true,
      employee
    });
  };

  const handleCloseWorkSchedule = () => {
    setWorkScheduleModal({
      isOpen: false,
      employee: null
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Nhân viên</h2>
        <button
          onClick={() => setShowEmployeeForm(!showEmployeeForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
        >
          <span>{showEmployeeForm ? '📋' : '➕'}</span>
          <span>{showEmployeeForm ? 'Xem danh sách' : 'Thêm nhân viên'}</span>
        </button>
      </div>

      {showEmployeeForm ? (
        <EmployeeForm onSubmit={(data) => handleFormSubmit(data, 'Employee')} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Danh sách nhân viên ({employees.length})
              </h3>
            </div>

            {isLoadingEmployees ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Đang tải danh sách nhân viên...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Không có nhân viên nào</h4>
                <p className="text-gray-600">Chưa có nhân viên nào được tạo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Họ và tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chức vụ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phòng ban
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày vào làm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                          {employee.data?.qualifications && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {employee.data.qualifications}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {employee.position || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {employee.department || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {employee.data?.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {employee.data?.phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {employee.data?.hire_date ? formatDate(employee.data.hire_date) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(employee.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleOpenWorkSchedule(employee)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <span>📅</span>
                            Lịch làm việc
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Work Schedule Modal */}
      <WorkScheduleModal
        isOpen={workScheduleModal.isOpen}
        onClose={handleCloseWorkSchedule}
        employee={workScheduleModal.employee}
        canEdit={true} // Admin can edit work schedules
      />
    </div>
  );
}
