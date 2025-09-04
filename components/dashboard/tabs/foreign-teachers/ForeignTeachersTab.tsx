import React, { useState, useEffect } from 'react';
import ForeignTeachersCrudContainer from './ForeignTeachersCrudContainer';
import WorkScheduleModal from '../employees/WorkScheduleModal';
import { Employee } from '@/shared/types';

interface ForeignTeachersTabProps {
  showForeignTeacherForm: boolean;
  setShowForeignTeacherForm: (show: boolean) => void;
  employees: Employee[];
  isLoadingEmployees: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
  onViewEmployee?: (employee: Employee) => void;
}

export default function ForeignTeachersTab({
  showForeignTeacherForm,
  setShowForeignTeacherForm,
  employees,
  isLoadingEmployees,
  handleFormSubmit,
  onViewEmployee
}: ForeignTeachersTabProps): JSX.Element {
  const [workScheduleModal, setWorkScheduleModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null
  });

  // Filter employees to show only foreign teachers (non-Vietnamese)
  const foreignTeachers = employees.filter(employee =>
    employee.data?.nationality && employee.data.nationality.toLowerCase() !== 'vietnamese'
  );

  // Filter employees to show only Vietnamese nationality for nhân viên
  const vietnameseEmployees = employees.filter(employee =>
    employee.data?.nationality && employee.data.nationality.toLowerCase() === 'vietnamese'
  );

  const handleSubmit = async (data: any, formType: string): Promise<void> => {
    if (formType === 'RefreshForeignTeachers') {
      // Just refresh the employees list - this would be handled by parent component
      return;
    }

    await handleFormSubmit(data, formType);
  };

  const handleViewEmployee = (employee: Employee) => {
    if (onViewEmployee) {
      onViewEmployee(employee);
    } else {
      console.log('View foreign teacher:', employee);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    // The edit functionality is now handled directly in the CRUD component
    // This handler is no longer needed as the CRUD component handles editing internally
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giáo viên nước ngoài "${employee.full_name}"?`)) {
      try {
        const response = await fetch(`/api/employees/${employee.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          // Refresh the employees list by calling the parent's form submit handler
          await handleFormSubmit({ refresh: true }, 'RefreshForeignTeachers');
          alert('Xóa giáo viên nước ngoài thành công!');
        } else {
          alert(`Lỗi khi xóa giáo viên nước ngoài: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting foreign teacher:', error);
        alert('Có lỗi xảy ra khi xóa giáo viên nước ngoài');
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
      <ForeignTeachersCrudContainer
        employees={foreignTeachers}
        isLoading={isLoadingEmployees}
        onSubmit={handleSubmit}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
        onWorkSchedule={handleOpenWorkSchedule}
      />

      {/* You can use vietnameseEmployees wherever needed for nhân viên */}

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
