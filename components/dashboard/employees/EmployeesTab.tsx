import React, { useState, useEffect } from 'react';
import EmployeesTabCrud from '../crud/EmployeesTabCrud';
import WorkScheduleModal from './WorkScheduleModal';
import { Employee } from '../shared/types';

interface EmployeesTabProps {
  showEmployeeForm: boolean;
  setShowEmployeeForm: (show: boolean) => void;
  employees: Employee[];
  isLoadingEmployees: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
  onViewEmployee?: (employee: Employee) => void;
}

export default function EmployeesTab({
  showEmployeeForm,
  setShowEmployeeForm,
  employees,
  isLoadingEmployees,
  handleFormSubmit,
  onViewEmployee
}: EmployeesTabProps): JSX.Element {
  const [workScheduleModal, setWorkScheduleModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null
  });

  const handleSubmit = async (data: any, formType: string): Promise<void> => {
    if (formType === 'RefreshEmployees') {
      // Just refresh the employees list - this would be handled by parent component
      return;
    }

    await handleFormSubmit(data, formType);
  };

  const handleViewEmployee = (employee: Employee) => {
    if (onViewEmployee) {
      onViewEmployee(employee);
    } else {
      console.log('View employee:', employee);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    // The edit functionality is now handled directly in the CRUD component
    // This handler is no longer needed as the CRUD component handles editing internally
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.full_name}"?`)) {
      try {
        const response = await fetch(`/api/employees/${employee.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          // Refresh the employees list by calling the parent's form submit handler
          await handleFormSubmit({ refresh: true }, 'RefreshEmployees');
          alert('Xóa nhân viên thành công!');
        } else {
          alert(`Lỗi khi xóa nhân viên: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Có lỗi xảy ra khi xóa nhân viên');
      }
    }
  };

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
      <EmployeesTabCrud
        employees={employees}
        isLoading={isLoadingEmployees}
        onSubmit={handleSubmit}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
        onWorkSchedule={handleOpenWorkSchedule}
      />

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
