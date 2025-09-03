import React from 'react';
import { Employee } from '@/shared/types';
import { CrudTable, TableColumn, FilterConfig } from '@/dashboard/shared';
import { EmployeesTableProps, EMPLOYEE_STATUSES } from './types/employees.types';

export default function EmployeesTable({
  employees,
  isLoading,
  filters,
  onFilterChange,
  onClearFilters,
  onView,
  onEdit,
  onDelete,
  onWorkSchedule,
  onCreateClick
}: EmployeesTableProps) {
  // Extract unique values for filter options
  const getFilterOptions = () => {
    const statuses = Array.from(new Set(employees.map(employee => employee.status).filter(Boolean)));
    const positions = Array.from(new Set(employees.map(employee => employee.position).filter(Boolean)));
    const departments = Array.from(new Set(employees.map(employee => employee.department).filter(Boolean)));

    return {
      statuses,
      positions,
      departments
    };
  };

  const filterOptions = getFilterOptions();

  // Filter configuration
  const getFilterConfig = (): FilterConfig[] => {
    return [
      {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { value: 'all', label: 'Tất cả trạng thái' },
          ...filterOptions.statuses.map(status => ({
            value: status,
            label: EMPLOYEE_STATUSES[status as keyof typeof EMPLOYEE_STATUSES] || status
          }))
        ]
      },
      {
        key: 'position',
        label: 'Vị trí',
        options: [
          { value: 'all', label: 'Tất cả vị trí' },
          ...filterOptions.positions.map(position => ({
            value: position!,
            label: position!
          }))
        ]
      },
      {
        key: 'department',
        label: 'Phòng ban',
        options: [
          { value: 'all', label: 'Tất cả phòng ban' },
          ...filterOptions.departments.map(department => ({
            value: department!,
            label: department!
          }))
        ]
      }
    ];
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<Employee>[] => {
    return [
      {
        key: 'full_name',
        label: 'Họ và tên',
        render: (value, row) => (
          <div>
            <button
              onClick={() => onView(row)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
            >
              {value}
            </button>
            {row.position && (
              <div className="text-sm text-gray-500">{row.position}</div>
            )}
          </div>
        )
      },
      {
        key: 'contact',
        label: 'Liên hệ',
        render: (value, row) => (
          <div>
            {row.data?.email && (
              <div className="text-sm text-gray-900">{row.data.email}</div>
            )}
            {row.data?.phone && (
              <div className="text-sm text-gray-500">{row.data.phone}</div>
            )}
          </div>
        )
      },
      {
        key: 'department',
        label: 'Phòng ban',
        render: (value) => (
          <div className="text-sm text-gray-900">
            {value || '-'}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => {
          const statusColors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-yellow-100 text-yellow-800',
            terminated: 'bg-red-100 text-red-800'
          };

          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
              {EMPLOYEE_STATUSES[value as keyof typeof EMPLOYEE_STATUSES] || value}
            </span>
          );
        }
      }
    ];
  };

  return (
    <CrudTable
      data={employees}
      columns={getTableColumns()}
      isLoading={isLoading}
      filters={filters}
      filterConfigs={getFilterConfig()}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      customActions={onWorkSchedule ? [{
        label: 'Lịch làm việc',
        icon: '📅',
        onClick: onWorkSchedule,
        variant: 'secondary' as const,
        iconOnly: true,
        tooltip: 'Xem lịch làm việc'
      }] : []}
      title="Danh sách nhân viên"
      createButtonLabel="Thêm nhân viên"
      onCreateClick={onCreateClick}
      emptyState={{
        icon: (
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 0-5 0m13.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        title: 'Không có nhân viên nào',
        description: 'Chưa có nhân viên nào được tạo.'
      }}
    />
  );
}
